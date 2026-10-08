// Media MCP connections. The app keeps a Claude-Code-format server map ({ name: { type, command, args, env } |
// { type: "http", url, headers } }), hands the enabled ones to Claude via --mcp-config, and can test any server
// with a real MCP handshake (initialize → tools/list) so "connected" means "answers and has tools".
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const INIT = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "director-app", version: "0.1.0" } };

/** Write the enabled servers as an --mcp-config file; null when none. */
function writeMcpConfig(servers, file) {
  const on = Object.fromEntries(Object.entries(servers || {}).filter(([, s]) => s && s.enabled !== false)
    .map(([name, s]) => { const { enabled, ...rest } = s; return [name, rest]; }));
  if (!Object.keys(on).length) return null;
  fs.writeFileSync(file, JSON.stringify({ mcpServers: on }, null, 2), { mode: 0o600 });
  return file;
}

/** Servers already configured in the person's Claude Code (~/.claude.json: user scope + every project scope). */
function importFromClaudeCode() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".claude.json"), "utf8"));
    const found = { ...(cfg.mcpServers || {}) };
    for (const p of Object.values(cfg.projects || {})) for (const [n, s] of Object.entries(p.mcpServers || {})) found[n] ??= s;
    return found;
  } catch {
    return {};
  }
}

function testStdio(server, env, timeoutMs) {
  return new Promise((resolve) => {
    let done = false, proc, stderr = "";
    const finish = (r) => { if (done) return; done = true; clearTimeout(timer); proc?.kill("SIGTERM"); resolve(r); };
    const timer = setTimeout(() => finish({ ok: false, error: `No answer in ${timeoutMs / 1000}s. ${stderr.trim().slice(-300)}` }), timeoutMs);
    try {
      proc = spawn(server.command, server.args || [], { env: { ...env, ...(server.env || {}) }, stdio: ["pipe", "pipe", "pipe"] });
    } catch (e) {
      return finish({ ok: false, error: String(e.message) });
    }
    const send = (m) => proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...m }) + "\n");
    let info = null;
    proc.on("error", (e) => finish({ ok: false, error: `Could not start "${server.command}": ${e.message}` }));
    proc.stderr.on("data", (c) => (stderr = (stderr + c).slice(-2000)));
    proc.on("close", (code) => finish({ ok: false, error: `Exited (${code}). ${stderr.trim().slice(-300)}` }));
    readline.createInterface({ input: proc.stdout }).on("line", (line) => {
      let m;
      try { m = JSON.parse(line); } catch { return; }
      if (m.id === 1) {
        if (m.error) return finish({ ok: false, error: m.error.message });
        info = m.result?.serverInfo || {};
        send({ method: "notifications/initialized" });
        send({ id: 2, method: "tools/list", params: {} });
      } else if (m.id === 2) {
        finish({ ok: true, server: info.name || "", version: info.version || "", tools: (m.result?.tools || []).map((t) => t.name) });
      }
    });
    send({ id: 1, method: "initialize", params: INIT });
  });
}

async function testHttp(server, timeoutMs) {
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream", ...(server.headers || {}) };
  const call = async (body, sid) => {
    const r = await fetch(server.url, { method: "POST", headers: sid ? { ...headers, "mcp-session-id": sid } : headers, body: JSON.stringify({ jsonrpc: "2.0", ...body }), signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`HTTP ${r.status}${r.status === 401 ? " — needs auth (add a header or sign in via Claude Code /mcp)" : ""}`);
    const text = await r.text();
    const json = r.headers.get("content-type")?.includes("event-stream")
      ? JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).pop() || "{}")
      : text ? JSON.parse(text) : {};
    return { json, sid: r.headers.get("mcp-session-id") || sid };
  };
  try {
    const a = await call({ id: 1, method: "initialize", params: INIT });
    if (a.json.error) return { ok: false, error: a.json.error.message };
    await call({ method: "notifications/initialized" }, a.sid).catch(() => {});
    const b = await call({ id: 2, method: "tools/list", params: {} }, a.sid);
    const info = a.json.result?.serverInfo || {};
    return { ok: true, server: info.name || "", version: info.version || "", tools: (b.json.result?.tools || []).map((t) => t.name) };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

/** Call one tool on a stdio server (e.g. AI Studio's login / whoami). Long timeout: login waits for a browser sign-in. */
function callTool(server, env, tool, args = {}, timeoutMs = 300000) {
  return new Promise((resolve) => {
    if (!server || server.url) return resolve({ ok: false, error: "Only stdio servers can be called from the app" });
    let done = false, proc, stderr = "";
    const finish = (r) => { if (done) return; done = true; clearTimeout(timer); proc?.kill("SIGTERM"); resolve(r); };
    const timer = setTimeout(() => finish({ ok: false, error: `No answer in ${Math.round(timeoutMs / 1000)}s` }), timeoutMs);
    try { proc = spawn(server.command, server.args || [], { env: { ...env, ...(server.env || {}) }, stdio: ["pipe", "pipe", "pipe"] }); }
    catch (e) { return finish({ ok: false, error: String(e.message) }); }
    const send = (m) => proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...m }) + "\n");
    proc.on("error", (e) => finish({ ok: false, error: e.message }));
    proc.stderr.on("data", (c) => (stderr = (stderr + c).slice(-2000)));
    proc.on("close", (code) => finish({ ok: false, error: `Exited (${code}). ${stderr.trim().slice(-300)}` }));
    readline.createInterface({ input: proc.stdout }).on("line", (line) => {
      let m;
      try { m = JSON.parse(line); } catch { return; }
      if (m.id === 1) { send({ method: "notifications/initialized" }); send({ id: 2, method: "tools/call", params: { name: tool, arguments: args } }); }
      else if (m.id === 2) {
        if (m.error) return finish({ ok: false, error: m.error.message });
        const text = (m.result?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
        finish(m.result?.isError ? { ok: false, error: text } : { ok: true, text });
      }
    });
    send({ id: 1, method: "initialize", params: INIT });
  });
}

/** Real handshake against one server. First uvx runs download the package, so stdio gets a generous timeout. */
function testMcp(server, env) {
  if (server.type === "http" || server.type === "sse" || server.url) return testHttp(server, 20000);
  return testStdio(server, env, 120000);
}

module.exports = { writeMcpConfig, importFromClaudeCode, testMcp, callTool };
