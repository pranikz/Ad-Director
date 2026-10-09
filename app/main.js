// Director desktop app — main process.
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, safeStorage, Menu, nativeTheme, clipboard } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { Readable } = require("node:stream");
const MIME = { ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const { childEnv, resolveAuth, findClaude, claudeStatus, claudePing, getLoginEnv } = require("./lib/system");
const { ClaudeSession } = require("./lib/claude");
const mcp = require("./lib/mcp");
const gemini = require("./lib/gemini");

if (process.env.DIRECTOR_USER_DATA) app.setPath("userData", process.env.DIRECTOR_USER_DATA); // dev: clean profile for screenshots
protocol.registerSchemesAsPrivileged([{ scheme: "media", privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true } }]);

// ── settings ─────────────────────────────────────────────────────────
const SETTINGS = () => path.join(app.getPath("userData"), "settings.json");
const DEFAULTS = {
  projectsRoot: path.join(os.homedir(), "Downloads"),
  claudePath: "",
  permissionMode: "bypassPermissions",
  model: "",
  authMode: "auto", // auto | env | login | apikey: which Claude account Director runs on
  anthropicKey: "", // encrypted with the OS keychain (safeStorage), base64
  pluginDir: "",
  mcpServers: {}, // added during onboarding or in Settings; nothing is pre-installed
  mediaServers: [], // names the person connected as media backends (app config or their Claude Code)
  onboarded: false,
  geminiModel: "gemini-flash-latest",
  geminiKey: "", // encrypted with the OS keychain (safeStorage), base64
  sessions: {},
  recent: [],
};
let settings = load();
function load() {
  try {
    const saved = JSON.parse(fs.readFileSync(SETTINGS(), "utf8"));
    if (saved.ignoreApiEnv && !saved.authMode) saved.authMode = "login"; // older checkbox
    delete saved.ignoreApiEnv;
    return { ...DEFAULTS, ...saved };
  } catch { return { ...DEFAULTS }; }
}
function save() {
  fs.mkdirSync(path.dirname(SETTINGS()), { recursive: true });
  fs.writeFileSync(SETTINGS(), JSON.stringify(settings, null, 2), { mode: 0o600 });
}
const secret = (field) => { try { return settings[field] ? safeStorage.decryptString(Buffer.from(settings[field], "base64")) : ""; } catch { return ""; } };
const anthropicKey = () => secret("anthropicKey");
const geminiKey = () => {
  if (settings.geminiKey) try { return safeStorage.decryptString(Buffer.from(settings.geminiKey, "base64")); } catch {}
  return getLoginEnv().GEMINI_API_KEY || "";
};
const pluginDir = () => settings.pluginDir ||
  (app.isPackaged ? path.join(process.resourcesPath, "director") : path.resolve(__dirname, "../plugins/director"));
const skillDir = () => path.join(pluginDir(), "skills", "direct-film");
const env = () => childEnv({ auth: settings.authMode, apiKey: anthropicKey(), extra: geminiKey() ? { GEMINI_API_KEY: geminiKey() } : {} });
const publicSettings = () => ({ ...settings, geminiKey: undefined, anthropicKey: undefined, hasGeminiKey: !!geminiKey(), hasAnthropicKey: !!anthropicKey(),
  authResolved: resolveAuth(settings.authMode), pluginDir: pluginDir(), sessions: undefined });

// ── projects ─────────────────────────────────────────────────────────
const isProject = (d) => ["brief.md", "films", "timeline.json", "overlay"].some((f) => fs.existsSync(path.join(d, f)));
function listProjects() {
  const seen = new Set(), out = [];
  const add = (dir) => {
    if (seen.has(dir) || !fs.existsSync(dir) || !isProject(dir)) return;
    seen.add(dir);
    out.push({ name: path.basename(dir), dir, mtime: fs.statSync(dir).mtimeMs });
  };
  settings.recent.forEach(add);
  try { fs.readdirSync(settings.projectsRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith(".")).forEach((e) => add(path.join(settings.projectsRoot, e.name))); } catch {}
  return out.sort((a, b) => b.mtime - a.mtime);
}
function remember(dir) {
  settings.recent = [dir, ...settings.recent.filter((d) => d !== dir)].slice(0, 30);
  save();
}
const run = (cmd, args, opts = {}) => new Promise((resolve) =>
  execFile(cmd, args, { env: env(), timeout: 600000, maxBuffer: 1 << 24, ...opts }, (err, stdout, stderr) => resolve({ ok: !err, stdout, stderr: String(stderr || err?.message || "") })));

const MEDIA = /\.(mp4|mov|webm|jpg|jpeg|png|webp)$/i;
function listFiles(dir) {
  const groups = { "out/with-text": "With text", "out/clean": "Clean", films: "Films", "films/takes": "Takes", refs: "Plates & casting", qa: "QA sheets" };
  return Object.entries(groups).map(([rel, label]) => {
    let files = [];
    try { files = fs.readdirSync(path.join(dir, rel)).filter((f) => MEDIA.test(f)).sort().map((f) => `${rel}/${f}`); } catch {}
    return { label, rel, files };
  }).filter((g) => g.files.length);
}

let current = null; // the open project dir; the media:// protocol only serves files inside it
let watcher = null;
function watch(dir, win) {
  watcher?.close();
  let t = null;
  try {
    watcher = fs.watch(dir, { recursive: true }, (_, f) => {
      if (!f || /(^|\/)(node_modules|renders|\.git)\//.test(f)) return;
      clearTimeout(t);
      t = setTimeout(() => win.webContents.send("project:changed", { dir }), 700);
    });
  } catch {}
}

// ── chat (one Claude Code process per project) ───────────────────────
const sessions = new Map();
function systemFor(dir) {
  return [
    `You are running inside the Director desktop app. The open project folder is: ${dir}`,
    `The direct-film skill lives at: ${skillDir()} (scripts in scripts/, templates in templates/).`,
    `If the project folder has no structure yet, scaffold it with: ${path.join(skillDir(), "scripts/new_project.sh")} "${dir}"`,
    `After you add or change films, outputs, overlay configs or QA files, run: python3 ${path.join(skillDir(), "scripts/timeline.py")} "${dir}" — the app's timeline viewer reads timeline.json.`,
    `The person sees every file you write in the app's media panel and timeline, so say which file to look at.`,
    `When you finish a version, the person may edit it themselves in the app's timeline: callout/card timing, text and position in overlay/cfg/<key>.json, and which take is films/<key>.mp4. Treat those files as the source of truth: re-read them before changing anything, keep the person's edits unless they ask otherwise, and re-render with make_ad.sh.`,
    geminiKey() ? "A Gemini API key is configured (GEMINI_API_KEY is set): scripts/transcribe.py works, and the person can run a Gemini VLM check from the app." : "No Gemini key is configured; do QA yourself from contact sheets and the video-trim MCP if present.",
  ].join("\n");
}
function sessionFor(dir, win) {
  if (sessions.has(dir)) return sessions.get(dir);
  const bin = findClaude(settings.claudePath);
  if (!bin) throw new Error("Claude Code not found. Install it (https://claude.com/claude-code) or set its path in Settings.");
  const s = new ClaudeSession({
    bin, env: env(), cwd: dir, pluginDir: pluginDir(), agent: "director:director",
    mcpConfig: mcp.writeMcpConfig(settings.mcpServers, path.join(app.getPath("userData"), "mcp.json")),
    permissionMode: settings.permissionMode, model: settings.model || undefined, resume: settings.sessions[dir], system: systemFor(dir),
  });
  s.on("event", (ev) => {
    if (ev.type === "system" && ev.subtype === "init") { settings.sessions[dir] = ev.session_id; save(); }
    if (!win.isDestroyed()) win.webContents.send("chat:event", { dir, ev });
  });
  sessions.set(dir, s);
  return s;
}
function resetSessions() { for (const s of sessions.values()) s.stop(); sessions.clear(); }

// ── window + IPC ─────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1560, height: 980, minWidth: 1100, minHeight: 700, backgroundColor: nativeTheme.shouldUseDarkColors ? "#212121" : "#ffffff", title: "Director",
    titleBarStyle: "hiddenInset", trafficLightPosition: { x: 16, y: 18 },
    ...(process.env.DIRECTOR_SNAPSHOT && { show: false, paintWhenInitiallyHidden: true }), // dev screenshots render hidden: nothing to click by accident
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  nativeTheme.on("updated", () => !win.isDestroyed() && win.setBackgroundColor(nativeTheme.shouldUseDarkColors ? "#212121" : "#ffffff"));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e) => e.preventDefault());

  const h = (ch, fn) => ipcMain.handle(ch, async (_e, arg) => {
    try { return await fn(arg ?? {}); } catch (e) { return { ok: false, error: String(e.message || e) }; }
  });
  h("settings:get", () => publicSettings());
  h("settings:set", (patch) => {
    if ("anthropicKey" in patch) {
      settings.anthropicKey = patch.anthropicKey ? safeStorage.encryptString(patch.anthropicKey).toString("base64") : "";
      delete patch.anthropicKey;
      resetSessions();
    }
    if ("geminiKey" in patch) {
      settings.geminiKey = patch.geminiKey ? safeStorage.encryptString(patch.geminiKey).toString("base64") : "";
      delete patch.geminiKey;
    }
    const restart = ["mcpServers", "claudePath", "permissionMode", "model", "authMode", "pluginDir"].some((k) => k in patch);
    Object.assign(settings, patch);
    save();
    if (restart) resetSessions(); // next message starts Claude with the new connections (and resumes the chat)
    return publicSettings();
  });
  h("claude:status", () => claudeStatus(findClaude(settings.claudePath), env()));
  h("claude:ping", () => claudePing(findClaude(settings.claudePath), env()));
  h("mcp:test", ({ name }) => mcp.testMcp(settings.mcpServers[name], env()));
  h("mcp:call", ({ name, tool, args, timeoutMs }) => mcp.callTool(settings.mcpServers[name], env(), tool, args, timeoutMs));
  // servers registered in the person's own Claude Code (OAuth ones like Higgsfield live there, so Claude holds the login)
  h("claude:mcpList", async () => {
    const r = await run(findClaude(settings.claudePath), ["mcp", "list"], { timeout: 90000 });
    return (r.stdout || "").split("\n").map((l) => /^(\S+?): (.+) - (.+)$/.exec(l.trim())).filter(Boolean)
      .map(([, name, target, status]) => ({ name, target, status: status.replace(/^[^A-Za-z]+/, "").trim() }));
  });
  h("claude:mcpAddHttp", async ({ name, url }) => {
    if (!/^[\w-]+$/.test(name) || !/^https:\/\//.test(url)) throw new Error("Bad server name or URL");
    const r = await run(findClaude(settings.claudePath), ["mcp", "add", "--transport", "http", "--scope", "user", name, url], { timeout: 60000 });
    if (!r.ok && !/already exists/i.test(r.stderr + r.stdout)) throw new Error((r.stderr || r.stdout).trim().slice(-400));
    return { ok: true };
  });
  h("clipboard:write", ({ text }) => { clipboard.writeText(String(text)); return { ok: true }; });
  h("mcp:import", () => mcp.importFromClaudeCode());
  h("gemini:test", () => (geminiKey() ? gemini.test(geminiKey(), settings.geminiModel) : { ok: false, error: "No key set" }));

  h("projects:list", () => listProjects());
  h("projects:create", async ({ name }) => {
    const slug = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
    let dir = path.join(settings.projectsRoot, slug);
    for (let n = 2; fs.existsSync(dir); n++) dir = path.join(settings.projectsRoot, `${slug}-${n}`); // never merge into an existing folder
    const r = await run(path.join(skillDir(), "scripts/new_project.sh"), [dir]);
    if (!r.ok) throw new Error(r.stderr);
    if (!fs.existsSync(path.join(dir, "brief.md"))) fs.writeFileSync(path.join(dir, "brief.md"), `# ${name}\n\n(brief: brand, product, claims, language, tone, count, length, aspect, do-nots)\n`);
    remember(dir);
    return { dir };
  });
  h("projects:pick", async () => {
    const r = await dialog.showOpenDialog(win, { properties: ["openDirectory", "createDirectory"] });
    if (r.canceled) return null;
    remember(r.filePaths[0]);
    return { dir: r.filePaths[0] };
  });
  h("projects:open", ({ dir }) => {
    current = path.resolve(dir);
    remember(current);
    watch(current, win);
    return { dir: current, files: listFiles(current), session: !!settings.sessions[current] };
  });
  h("projects:files", ({ dir }) => listFiles(dir));
  h("projects:timeline", async ({ dir, refresh }) => {
    const tl = path.join(dir, "timeline.json");
    if (refresh || !fs.existsSync(tl)) {
      if (fs.existsSync(path.join(dir, "films"))) await run("python3", [path.join(skillDir(), "scripts/timeline.py"), dir]);
    }
    try { return JSON.parse(fs.readFileSync(tl, "utf8")); } catch { return { films: [] }; }
  });
  h("projects:reveal", ({ dir, rel }) => shell.showItemInFolder(path.join(dir, rel || "")));
  h("open:external", ({ url }) => /^https?:/.test(url) && shell.openExternal(url));
  h("app:about", () => {
    const pkg = require("./package.json");
    let plugin = {};
    try { plugin = JSON.parse(fs.readFileSync(path.join(pluginDir(), ".claude-plugin", "plugin.json"), "utf8")); } catch {}
    return { name: app.getName(), version: app.getVersion(), homepage: pkg.homepage, bugs: pkg.bugs?.url, license: pkg.license, author: pkg.author,
      pluginVersion: plugin.version || null, pluginDir: pluginDir(), electron: process.versions.electron, chrome: process.versions.chrome,
      node: process.versions.node, os: `${process.platform} ${process.getSystemVersion?.() || ""} ${process.arch}`.trim(), packaged: app.isPackaged };
  });
  h("app:revealPlugin", () => shell.showItemInFolder(path.join(pluginDir(), ".claude-plugin", "plugin.json")));

  h("chat:send", ({ dir, text }) => { sessionFor(dir, win).send(text); return { ok: true }; });
  h("chat:stop", ({ dir }) => { sessions.get(dir)?.stop(); sessions.delete(dir); return { ok: true }; });
  h("chat:new", ({ dir }) => { sessions.get(dir)?.stop(); sessions.delete(dir); delete settings.sessions[dir]; save(); return { ok: true }; });

  // ── manual edits (only inside the open project, only for plain film keys) ──
  const KEY = /^[\w.-]+$/;
  const inProject = (dir, key) => {
    if (path.resolve(dir) !== current) throw new Error("Open the project first");
    if (key != null && !KEY.test(key)) throw new Error(`Bad film key: ${key}`);
  };
  const cfgPath = (dir, key) => path.join(dir, "overlay", "cfg", `${key}.json`);
  const timeline = () => run("python3", [path.join(skillDir(), "scripts/timeline.py"), current]);
  h("cfg:get", ({ dir, key }) => {
    inProject(dir, key);
    try { return JSON.parse(fs.readFileSync(cfgPath(dir, key), "utf8")); } catch { return null; }
  });
  h("cfg:save", async ({ dir, key, cfg }) => {
    inProject(dir, key);
    fs.mkdirSync(path.dirname(cfgPath(dir, key)), { recursive: true });
    fs.writeFileSync(cfgPath(dir, key), JSON.stringify(cfg, null, 1));
    await timeline();
    return { ok: true };
  });
  h("render", async ({ dir, key }) => {
    inProject(dir, key);
    if (!fs.existsSync(path.join(dir, "endcard", "tail.mp4"))) throw new Error("No end card yet (endcard/tail.mp4). Ask Director to render the end card first.");
    const r = await run(path.join(skillDir(), "scripts/make_ad.sh"), [dir, key], { timeout: 900000 });
    if (!r.ok) throw new Error(r.stderr.trim().slice(-800) || "Render failed");
    await timeline();
    return { ok: true, out: r.stdout.trim() };
  });
  h("take:use", async ({ dir, rel, key }) => {
    inProject(dir, key);
    const src = path.resolve(dir, rel), dst = path.join(dir, "films", `${key}.mp4`);
    if (!src.startsWith(path.join(dir, "films", "takes") + path.sep) || !fs.existsSync(src)) throw new Error("Pick a take from films/takes");
    if (fs.existsSync(dst)) fs.copyFileSync(dst, path.join(dir, "films", "takes", `${key}__replaced_${Date.now()}.mp4`));
    fs.copyFileSync(src, dst);
    fs.rmSync(path.join(dir, "qa", `${key}.cuts`), { force: true }); // new footage, new cuts
    await timeline();
    return { ok: true };
  });

  h("vlm:check", async ({ dir, rel, key }) => {
    const k = geminiKey();
    if (!k) throw new Error("Add a Gemini API key in Settings → Connections to run VLM checks.");
    let script = "";
    try { // the shipped prompt for this film, if the project saved one
      for (const f of fs.readdirSync(path.join(dir, "prompts")).filter((f) => f.endsWith(".json")))
        for (const j of JSON.parse(fs.readFileSync(path.join(dir, "prompts", f), "utf8"))) if (key.includes(j.name) || j.name.includes(key.replace(/^\d+_/, ""))) script = j.fields?.prompt || script;
    } catch {}
    const report = await gemini.vlmCheck({ key: k, model: settings.geminiModel, file: path.join(dir, rel), script });
    fs.mkdirSync(path.join(dir, "qa"), { recursive: true });
    fs.writeFileSync(path.join(dir, "qa", `${key}.vlm.json`), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(dir, "qa", `${key}.dialogue.json`), JSON.stringify(report.dialogue || [], null, 2));
    await run("python3", [path.join(skillDir(), "scripts/timeline.py"), dir]);
    return report;
  });
  return win;
}

app.whenReady().then(() => {
  if (process.env.DIRECTOR_THEME) nativeTheme.themeSource = process.env.DIRECTOR_THEME;
  // media://p/<relative path> → a file inside the open project (nothing outside it)
  protocol.handle("media", (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname.replace(/^\//, ""));
    const abs = current && path.resolve(current, rel);
    if (!abs || !abs.startsWith(current + path.sep) || !fs.existsSync(abs)) return new Response("not found", { status: 404 });
    // byte ranges, or <video> can't seek (scrubbing, timeline clicks, keeping the playhead across versions)
    const size = fs.statSync(abs).size, type = MIME[path.extname(abs).toLowerCase()] || "application/octet-stream";
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
    if (!m) return new Response(Readable.toWeb(fs.createReadStream(abs)), { headers: { "content-type": type, "content-length": String(size), "accept-ranges": "bytes" } });
    let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2])), end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    return new Response(Readable.toWeb(fs.createReadStream(abs, { start, end })), {
      status: 206, headers: { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1), "accept-ranges": "bytes" },
    });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }, { role: "viewMenu" }, { role: "windowMenu" }]));
  const win = createWindow();
  // dev-only self-check: DIRECTOR_SNAPSHOT=out.png [DIRECTOR_OPEN=dir] [DIRECTOR_JS=code] npm start → captures the window, quits
  if (process.env.DIRECTOR_THEME) nativeTheme.themeSource = process.env.DIRECTOR_THEME; // dev: light | dark
  if (process.env.DIRECTOR_SNAPSHOT) win.webContents.on("console-message", (e) => console.log(`[renderer] ${e.message}`));
  if (process.env.DIRECTOR_SNAPSHOT) win.webContents.once("did-finish-load", async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await wait(1500);
    if (process.env.DIRECTOR_OPEN) await win.webContents.executeJavaScript(`openProject(${JSON.stringify(process.env.DIRECTOR_OPEN)})`).catch((e) => console.error(e));
    await wait(2500);
    if (process.env.DIRECTOR_JS) await win.webContents.executeJavaScript(process.env.DIRECTOR_JS).catch((e) => console.error(e));
    await wait(Number(process.env.DIRECTOR_WAIT || 1500));
    fs.writeFileSync(process.env.DIRECTOR_SNAPSHOT, (await win.webContents.capturePage()).toPNG());
    app.quit();
  });
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on("window-all-closed", () => { resetSessions(); if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", resetSessions);
