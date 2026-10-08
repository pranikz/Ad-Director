// Director desktop app: renderer. Talks to the main process only through window.director (preload.js).
const D = window.director;
const $ = (id) => document.getElementById(id);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
const mediaUrl = (rel, bust = "") => `media://p/${rel.split("/").map(encodeURIComponent).join("/")}${bust ? `?v=${bust}` : ""}`;

// editing state lives up here: the playhead loop and chat handlers read it from the first frame
const E = { cfg: null, key: null, dirty: false, needsRender: false, rendering: false, undo: [], sel: null, typing: false, notes: new Map() };
const S = { settings: null, dir: null, timeline: { films: [] }, film: 0, variant: "with-text", files: [], rel: null, bust: Date.now(), mcpLive: null, chats: new Map() };

// ── markdown (escape first, then a small safe subset) ────────────────
function inline(s) {
  return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" data-ext>$1</a>');
}
function md(src) {
  const L = src.split("\n"), out = [];
  const list = /^\s*([-*]|\d+\.)\s/, block = /^(```|\||#{1,4}\s|\s*([-*]|\d+\.)\s)/;
  for (let i = 0; i < L.length;) {
    const l = L[i];
    if (/^```/.test(l)) { const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); i++; out.push(`<pre><code>${esc(b.join("\n"))}</code></pre>`); continue; }
    if (/^\|/.test(l) && /^\|?\s*:?-{2,}/.test(L[i + 1] || "")) {
      const rows = []; while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const [hd, , ...body] = rows;
      out.push(`<table><tr>${cells(hd).map((c) => `<th>${inline(c)}</th>`).join("")}</tr>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</table>`);
      continue;
    }
    if (/^#{1,4}\s/.test(l)) { out.push(`<h3>${inline(l.replace(/^#+\s/, ""))}</h3>`); i++; continue; }
    if (list.test(l)) {
      const ol = /^\s*\d+\./.test(l), items = [];
      while (i < L.length && list.test(L[i])) items.push(L[i++].replace(list, ""));
      out.push(`<${ol ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ol ? "ol" : "ul"}>`);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const p = []; while (i < L.length && L[i].trim() && !block.test(L[i])) p.push(L[i++]);
    out.push(`<p>${p.map(inline).join("<br>")}</p>`);
  }
  return out.join("");
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-ext]");
  if (a) { e.preventDefault(); D.openExternal({ url: a.href }); }
});

// ── connection pills ─────────────────────────────────────────────────
const pill = (id, state, title) => { const p = $(id); p.className = `pill ${state}`; if (title) p.title = title; };
async function refreshPills() {
  const st = await D.claude.status();
  S.status = st;
  pill("pill-claude", st.ok ? "ok" : "bad", st.ok ? `${st.version}, using ${st.using}` : st.error);
  const app = Object.entries(S.settings.mcpServers || {}).filter(([, v]) => v.enabled !== false).map(([n]) => n);
  const media = [...new Set([...app, ...(S.settings.mediaServers || [])])];
  if (S.mcpLive) {
    const up = media.filter((n) => S.mcpLive.some((m) => m.name === n && m.status === "connected")).length;
    pill("pill-mcp", !media.length ? "bad" : up === media.length ? "ok" : up ? "warn" : "bad", media.map((n) => `${n}: ${S.mcpLive.find((m) => m.name === n)?.status || "not loaded"}`).join("\n") || "No media MCP connected");
  } else pill("pill-mcp", media.length ? "" : "bad", media.length ? `${media.join(", ")}. Live status shows after the first message.` : "No media MCP connected");
  $("pill-mcp").lastChild.textContent = media.length ? `Media ${media.length}` : "Media";
  pill("pill-gemini", S.settings.hasGeminiKey ? "ok" : "", S.settings.hasGeminiKey ? `Gemini key set, ${S.settings.geminiModel}` : "Optional: add a Gemini key for VLM checks");
}

// ── projects ─────────────────────────────────────────────────────────
async function renderProjects() {
  const list = await D.projects.list();
  const ul = $("projects");
  ul.innerHTML = "";
  for (const p of list) {
    const li = h("li", p.dir === S.dir ? "on" : "", `<b>${esc(p.name)}</b><span>${esc(p.dir.replace(/^\/Users\/[^/]+/, "~"))}</span>`);
    li.onclick = () => openProject(p.dir);
    ul.append(li);
  }
  if (!list.length) ul.append(h("li", "", '<span>No projects yet</span>'));
}
function goHome() {
  if (!discardOk()) return;
  S.dir = null; E.key = null; E.cfg = null; E.sel = null;
  $("work").classList.add("hidden"); $("empty").classList.remove("hidden"); $("crumb").textContent = "";
  $("input").disabled = true; $("send").disabled = true;
  $("msgs").innerHTML = '<div class="hint">Describe what you want to make. Director starts a project for it.</div>';
  renderProjects(); $("empty-input").focus();
}
async function pickProject() { const r = await D.projects.pick(); if (r?.dir) { await renderProjects(); openProject(r.dir); } }

async function openProject(dir) {
  const r = await D.projects.open({ dir });
  if (S.dir && S.dir !== r.dir) { E.key = null; E.cfg = null; E.sel = null; }
  S.dir = r.dir; S.files = r.files; S.film = 0; S.rel = null;
  $("crumb").textContent = r.dir.replace(/^\/Users\/[^/]+/, "~");
  $("empty").classList.add("hidden"); $("work").classList.remove("hidden");
  $("input").disabled = false; $("send").disabled = !$("input").value.trim(); $("input").focus();
  showChat(dir, r.session);
  await renderProjects();
  await loadTimeline(false);
  renderMedia();
}

// ── viewer + timeline ────────────────────────────────────────────────
const video = $("video"), still = $("still");
const TRACKS = [["Shots", "shots"], ["Dialogue", "dialogue"], ["Callouts", "callouts"], ["Cards", "cards"], ["QA", "qa"], ["End card", "endcard"]];

async function loadTimeline(refresh) {
  S.timeline = await D.projects.timeline({ dir: S.dir, refresh });
  S.film = Math.min(S.film, Math.max(0, S.timeline.films.length - 1));
  renderTabs();
  selectSource();
}
function renderTabs() {
  const tabs = $("film-tabs");
  tabs.innerHTML = "";
  S.timeline.films.forEach((f, i) => {
    const b = h("button", i === S.film ? "on" : "", esc(f.key.replace(/^(\d+)_/, "$1 · ").replace(/_/g, " ")));
    b.onclick = () => { if (!discardOk()) return; S.film = i; S.rel = null; renderTabs(); selectSource(); };
    tabs.append(b);
  });
}
const film = () => S.timeline.films[S.film];
function sourceFor(f, v) {
  if (!f) return null;
  if (v === "film") return f.film;
  return f.outputs?.[v] || f.outputs?.["with-text"] || f.outputs?.clean || f.film;
}
async function selectSource() {
  await ensureCfg();
  document.querySelectorAll("#variant button").forEach((b) => {
    const has = !!film() && (b.dataset.v === "film" || !!film().outputs?.[b.dataset.v]);
    b.disabled = !has; b.classList.toggle("on", b.dataset.v === S.variant);
  });
  const rel = S.rel || sourceFor(film(), S.variant);
  show(rel);
  renderTimeline();
}
function show(rel) {
  $("screen-empty").classList.toggle("hidden", !!rel);
  if (!rel) { video.removeAttribute("src"); video.load(); still.classList.add("hidden"); video.classList.remove("hidden"); return; }
  const isImg = /\.(jpe?g|png|webp)$/i.test(rel);
  video.classList.toggle("hidden", isImg); still.classList.toggle("hidden", !isImg);
  if (isImg) { video.pause(); still.src = mediaUrl(rel, S.bust); }
  else if (!video.src.includes(mediaUrl(rel))) {
    S.wantT ??= video.currentTime || 0; // keep the playhead across With text / Clean / Film
    video.src = mediaUrl(rel, S.bust);
    video.addEventListener("loadedmetadata", () => { if (S.wantT != null) video.currentTime = Math.min(S.wantT, video.duration || S.wantT); S.wantT = null; renderPreview(true); }, { once: true });
  }
  S.shown = rel;
}
const tlDur = () => {
  const f = film(); if (!f) return 1;
  const showsFilm = S.shown === f.film;
  return (isFinite(video.duration) && video.duration > 0 && !video.classList.contains("hidden")) ? video.duration : showsFilm ? f.filmDuration : f.duration;
};
function renderTimeline() {
  const f = film(), lanes = $("tl-tracks"), labels = $("tl-labels"), ruler = $("tl-ruler");
  lanes.innerHTML = labels.innerHTML = ruler.innerHTML = "";
  if (!f) { labels.append(h("div", "", "No films yet")); return; }
  const dur = tlDur(), onFilmOnly = S.shown === f.film;
  const step = dur > 40 ? 5 : 1;
  for (let t = 0; t <= dur; t += step) {
    const major = t % (step * 5) === 0;
    const s = h("span", major ? "" : "minor", major ? fmt(t).replace(/\.0$/, "") : "");
    s.style.left = `${(t / dur) * 100}%`; ruler.append(s);
  }
  for (const [label, key] of TRACKS) {
    const editable = (key === "callouts" || key === "cards") && E.cfg && E.key === f.key;
    const items = editable
      ? E.cfg[key].map((c, i) => ({ start: c.t0, end: c.t1, label: key === "callouts" ? (c.lines || []).join(" ") : c.title, i, c }))
      : f.tracks[key] || [];
    if ((key === "qa" && !items.length) || (key === "endcard" && onFilmOnly)) continue;
    labels.append(h("div", "", label));
    const lane = h("div", "lane");
    for (const it of items) {
      const el = h("div", `item ${key} ${it.severity || ""}`, esc(it.label ?? it.text ?? ""));
      el.style.left = `${(it.start / dur) * 100}%`;
      el.style.width = `${Math.max(0.4, ((it.end - it.start) / dur) * 100)}%`;
      el.title = `${fmt(it.start)} to ${fmt(it.end)}  ${it.speaker ? it.speaker + ": " : ""}${it.label ?? it.text ?? ""}`;
      if (editable) {
        el.classList.add("editable"); el.dataset.i = it.i;
        if (E.sel?.kind === key && E.sel.i === it.i) el.classList.add("sel");
        if (crosses(it.c)) { el.classList.add("warn"); el.title += "  ⚠ crosses a shot cut"; }
        el.onpointerdown = (e) => dragItem(e, key, it.i, el, lane);
      } else el.onpointerdown = (e) => { e.stopPropagation(); seek(it.start + 0.02); };
      lane.append(el);
    }
    lanes.append(lane);
  }
}
function seek(t) { // a seek while a new source is loading waits for its metadata
  if (video.classList.contains("hidden")) return;
  t = Math.max(0, Math.min(t, tlDur()));
  if (video.readyState >= 1) { video.currentTime = t; S.wantT = null; } else S.wantT = t;
}
function tick() { // started at boot, once every module-level binding exists
  const dur = tlDur();
  $("tl-head").style.left = `${(Math.min(video.currentTime || 0, dur) / dur) * 100}%`;
  $("tl-time").textContent = `${fmt(video.currentTime || 0)} / ${fmt(dur)}`;
  renderPreview(false);
  requestAnimationFrame(tick);
}
video.addEventListener("loadedmetadata", renderTimeline);
const lanesEl = $("tl-lanes");
lanesEl.addEventListener("pointerdown", (e) => {
  const r = lanesEl.getBoundingClientRect();
  const at = (x) => seek(((x - r.left) / r.width) * tlDur());
  at(e.clientX);
  const move = (m) => at(m.clientX), up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
  addEventListener("pointermove", move); addEventListener("pointerup", up);
});
document.querySelectorAll("#variant button").forEach((b) => (b.onclick = () => { S.variant = b.dataset.v; S.rel = null; selectSource(); }));
$("tl-refresh").onclick = async () => { $("tl-refresh").disabled = true; S.bust = Date.now(); await loadTimeline(true); renderMedia(); $("tl-refresh").disabled = false; };

// ── media panel ──────────────────────────────────────────────────────
function renderMedia() {
  const box = $("media");
  box.innerHTML = "";
  for (const g of S.files) {
    const grp = h("div", "group", `<h3>${esc(g.label)} · ${g.files.length}</h3>`);
    const grid = h("div", "thumbs");
    for (const rel of g.files) {
      const t = h("div", "thumb");
      const name = rel.split("/").pop();
      t.innerHTML = /\.(jpe?g|png|webp)$/i.test(rel)
        ? `<img loading="lazy" src="${mediaUrl(rel, S.bust)}" alt="">`
        : `<video muted preload="metadata" src="${mediaUrl(rel, S.bust)}#t=1"></video>`;
      const cap = h("span", "", esc(name));
      if (g.rel === "films/takes" && film()) {
        const use = h("button", "use", "Use"); use.title = `Use this take as ${film().key}`;
        use.onclick = async (e) => {
          e.stopPropagation();
          if (locked() || !confirm(`Use ${name} as the film for ${film().key}? The current film is kept in films/takes.`)) return;
          const r = await D.edit.useTake({ dir: S.dir, rel, key: film().key });
          if (r?.ok === false) return alert(r.error);
          E.needsRender = true; addNote(`I swapped films/${film().key}.mp4 for the take ${rel}.`);
          S.bust = Date.now(); S.variant = "film"; await loadTimeline(false); updateEditBar();
        };
        cap.prepend(use);
      }
      t.append(cap);
      t.title = rel;
      t.onclick = () => {
        if (!discardOk()) return;
        const i = S.timeline.films.findIndex((f) => f.film === rel || Object.values(f.outputs || {}).includes(rel));
        if (i >= 0) {
          S.film = i; S.variant = rel === S.timeline.films[i].film ? "film" : rel.includes("/clean/") ? "clean" : "with-text"; S.rel = null; renderTabs(); selectSource();
        } else { S.rel = rel; show(rel); renderTimeline(); }
        $("stage").scrollTo({ top: 0, behavior: "smooth" });
      };
      t.ondblclick = () => D.projects.reveal({ dir: S.dir, rel });
      grid.append(t);
    }
    grp.append(grid); box.append(grp);
  }
}
let changeTimer = null;
D.onProjectChanged(({ dir }) => {
  if (dir !== S.dir) return;
  clearTimeout(changeTimer);
  changeTimer = setTimeout(async () => {
    S.files = await D.projects.files({ dir }); S.bust = Date.now();
    if (!E.dirty) E.key = null; // pick up Director's latest config; unsaved edits are never overwritten
    renderMedia(); await loadTimeline(false);
  }, 400);
});

// ── VLM check (optional Gemini) ──────────────────────────────────────
$("vlm-run").onclick = async () => {
  if (!S.settings.hasGeminiKey) { openSettings("s-geminiKey"); return; }
  const f = film(), rel = S.shown;
  if (!f || !rel || !/\.(mp4|mov|webm)$/i.test(rel)) return;
  const box = $("vlm"); box.classList.remove("hidden");
  box.innerHTML = `<div class="muted">Gemini is watching ${esc(rel)}… (about 30 to 90 s)</div>`;
  $("vlm-run").disabled = true;
  const r = await D.vlm.check({ dir: S.dir, rel, key: f.key });
  $("vlm-run").disabled = false;
  if (r?.ok === false) { box.innerHTML = `<div class="err-msg">${esc(r.error)}</div>`; return; }
  box.innerHTML = `<div><span class="verdict ${r.verdict}">${r.verdict === "pass" ? "Pass" : "Fail"}</span> <span class="muted">· ${esc(r.model)} · ${(r.issues || []).length} issues · saved qa/${esc(f.key)}.vlm.json</span></div><div>${esc(r.summary)}</div>`;
  const ul = h("ul");
  for (const i of r.issues || []) {
    const li = h("li", "", `<b>${fmt(i.time)}</b>${esc(i.severity)} · ${esc(i.category)}: ${esc(i.note)}`);
    li.onclick = () => seek(i.time);
    ul.append(li);
  }
  box.append(ul);
  await loadTimeline(false);
};

// ── chat ─────────────────────────────────────────────────────────────
function chatCtx(dir) {
  if (!S.chats.has(dir)) {
    const box = h("div", "chatbox");
    S.chats.set(dir, { box, texts: new Map(), tools: new Map(), busy: false, cur: null, started: 0 });
  }
  return S.chats.get(dir);
}
function showChat(dir, resumed) {
  const msgs = $("msgs"), c = chatCtx(dir);
  msgs.innerHTML = "";
  if (!c.box.childElementCount) c.box.append(h("div", "hint", resumed ? "Continuing this project's last conversation. Ask for anything." : "Tell Director what to make. A brief, a product page, a reference video path or a vague idea all work."));
  msgs.append(c.box);
  setBusy(c.busy);
  msgs.scrollTop = msgs.scrollHeight;
}
function setBusy(b) {
  $("stop").classList.toggle("hidden", !b);
  $("send").classList.toggle("hidden", b);
  updateEditBar(); renderTimeline(); renderInspector(); renderPreview(true);
  $("chat-status").textContent = b ? "Director is working…" : "";
}
const near = () => { const m = $("msgs"); return m.scrollHeight - m.scrollTop - m.clientHeight < 120; };
const stick = (was) => { if (was) $("msgs").scrollTop = $("msgs").scrollHeight; };

function toolLabel(name, input = {}) {
  const base = (p) => String(p || "").split("/").pop();
  if (name === "Bash") return ["Run", input.description || input.command];
  if (["Read", "Write", "Edit"].includes(name)) return [name, base(input.file_path)];
  if (name === "Skill") return ["Skill", input.skill];
  if (name === "Agent" || name === "Task") return ["Agent", input.description];
  if (name === "TodoWrite") return ["Plan", "updated"];
  if (name.startsWith("mcp__")) { const [, srv, ...t] = name.split("__"); return [srv, t.join("__")]; }
  return [name, input.pattern || input.query || input.url || ""];
}
function onChatEvent({ dir, ev }) {
  const c = chatCtx(dir), was = near();
  if (ev.type === "system" && ev.subtype === "init") {
    S.mcpLive = ev.mcp_servers || [];
    refreshPills();
    const off = S.mcpLive.filter((m) => m.status !== "connected");
    c.box.append(h("div", "meta", `${esc(ev.model || "Claude Code")} via ${esc(S.status?.using || "Claude Code")}, ${S.mcpLive.length - off.length} of ${S.mcpLive.length} MCP servers connected${off.length ? `. Not connected: ${esc(off.map((m) => m.name).join(", "))}` : ""}`));
  } else if (ev.type === "stream_event") {
    const e = ev.event;
    if (e.type === "message_start") c.cur = e.message.id;
    if (e.type === "content_block_start" && e.content_block.type === "text") {
      const el = h("div", "msg assistant"); el._src = ""; c.box.append(el);
      if (!c.texts.has(c.cur)) c.texts.set(c.cur, []);
      c.texts.get(c.cur).push(el);
    }
    if (e.type === "content_block_delta" && e.delta.type === "text_delta") {
      const el = c.texts.get(c.cur)?.at(-1);
      if (el) { el._src += e.delta.text; el.innerHTML = md(el._src); }
    }
  } else if (ev.type === "assistant") {
    const els = c.texts.get(ev.message.id) || [];
    let k = 0;
    for (const b of ev.message.content || []) {
      if (b.type === "text") {
        let el = els[k++];
        if (!el) { el = h("div", "msg assistant"); c.box.append(el); }
        el._src = b.text; el.innerHTML = md(b.text);
      } else if (b.type === "tool_use" && !c.tools.has(b.id)) {
        const [verb, what] = toolLabel(b.name, b.input);
        const el = h("div", "tool run", `<b>${esc(verb)}</b><span>${esc(String(what || "").slice(0, 140))}</span>`);
        el.title = JSON.stringify(b.input, null, 1).slice(0, 2000);
        c.tools.set(b.id, el); c.box.append(el);
      }
    }
  } else if (ev.type === "user") {
    for (const b of ev.message?.content || []) {
      if (b.type !== "tool_result") continue;
      const el = c.tools.get(b.tool_use_id);
      if (el) el.className = `tool ${b.is_error ? "err" : "done"}`;
    }
  } else if (ev.type === "result") {
    c.busy = false;
    const secs = Math.round((ev.duration_ms || 0) / 1000);
    c.box.append(h("div", "meta", `${ev.is_error ? "Stopped" : "Done"} · ${secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`}${ev.total_cost_usd ? ` · $${ev.total_cost_usd.toFixed(2)}` : ""}`));
    c.box.querySelectorAll(".tool.run").forEach((t) => (t.className = "tool done"));
  } else if (ev.type === "app_exit" || ev.type === "app_error") {
    c.busy = false;
    if (ev.error || ev.stderr) c.box.append(h("div", "err-msg", esc(ev.error || ev.stderr)));
    c.box.querySelectorAll(".tool.run").forEach((t) => (t.className = "tool err"));
  }
  if (dir === S.dir) { setBusy(c.busy); stick(was); }
}
D.chat.onEvent(onChatEvent);

async function send() {
  const text = $("input").value.trim();
  if (!text || !S.dir) return;
  const c = chatCtx(S.dir);
  c.box.querySelector(".hint")?.remove();
  c.box.append(h("div", "msg user", esc(text)));
  $("input").value = ""; $("send").disabled = true;
  const notes = E.notes.get(S.dir) || [];
  E.notes.delete(S.dir);
  const full = notes.length ? `[Edits I made in the Director app since your last turn. Keep them unless I ask otherwise:\n${notes.map((n) => `- ${n}`).join("\n")}]\n\n${text}` : text;
  c.busy = true; setBusy(true);
  $("msgs").scrollTop = $("msgs").scrollHeight;
  const r = await D.chat.send({ dir: S.dir, text: full });
  if (r?.ok === false) { c.busy = false; setBusy(false); c.box.append(h("div", "err-msg", esc(r.error))); }
}
$("composer").onsubmit = (e) => { e.preventDefault(); send(); };
$("input").addEventListener("input", () => ($("send").disabled = !$("input").value.trim() || !S.dir));
$("input").onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } };
$("stop").onclick = async () => { await D.chat.stop({ dir: S.dir }); const c = chatCtx(S.dir); c.busy = false; setBusy(false); c.box.append(h("div", "meta", "Stopped. Your next message continues the same conversation.")); };
$("chat-new").onclick = async () => { if (!S.dir) return; await D.chat.reset({ dir: S.dir }); S.chats.delete(S.dir); showChat(S.dir, false); };

// ── settings ─────────────────────────────────────────────────────────
const dlg = $("settings");
async function openSettings(focusId) {
  S.settings = await D.settings.get();
  const s = S.settings;
  for (const k of ["claudePath", "model", "projectsRoot", "pluginDir", "geminiModel"]) $(`s-${k}`).value = s[k] || "";
  $("s-permissionMode").value = s.permissionMode;
  $("s-geminiKey").value = ""; $("s-geminiKey").placeholder = s.hasGeminiKey ? "•••••••• saved in keychain" : "AIza…";
  $("s-mcp").value = JSON.stringify(s.mcpServers || {}, null, 2);
  renderServers();
  showSec(focusId ? $(focusId).closest("section").id : "sec-claude");
  dlg.showModal();
  if (focusId) $(focusId).focus();
  const st = await D.claude.status();
  const box = $("claude-status");
  box.className = `status ${st.ok ? "ok" : "bad"}`;
  box.textContent = st.ok ? `${st.version}, using ${st.using}` : st.error;
  S.status = st; renderAccounts("acct");
}
function renderServers() {
  const ul = $("servers"); ul.innerHTML = "";
  for (const [name, srv] of Object.entries(S.settings.mcpServers || {})) {
    const li = h("li", "", `<b>${esc(name)}${srv.enabled === false ? ' <span class="tag">off</span>' : ""}</b>`);
    const btn = h("button", "btn sm ghost", "Test"); btn.type = "button";
    const out = h("small", "", esc(srv.url || [srv.command, ...(srv.args || [])].join(" ")));
    btn.onclick = async () => {
      btn.disabled = true; out.className = ""; out.textContent = "Connecting… (the first uvx run can take a minute)";
      const r = await D.mcp.test({ name });
      btn.disabled = false;
      out.className = r.ok ? "ok" : "bad";
      out.textContent = r.ok ? `Connected · ${r.server} ${r.version} · ${r.tools.length} tools: ${r.tools.slice(0, 8).join(", ")}${r.tools.length > 8 ? "…" : ""}` : r.error;
    };
    li.append(btn, out); ul.append(li);
  }
}
function showSec(id) {
  document.querySelectorAll("#dlg-nav button").forEach((b) => b.classList.toggle("on", b.dataset.sec === id));
  document.querySelectorAll(".dlg-body section").forEach((x) => x.classList.toggle("hidden", x.id !== id));
}
$("dlg-nav").onclick = (e) => { const b = e.target.closest("button[data-sec]"); if (b) showSec(b.dataset.sec); };
const AISTUDIO = { type: "stdio", command: "uvx", args: ["--from", "git+https://github.com/galleri5/aistudio-mcp", "aistudio-mcp"], env: {} };
const TEMPLATES = {
  aistudio: { aistudio: AISTUDIO },
  stdio: { "my-media": { type: "stdio", command: "npx", args: ["-y", "your-mcp-package"], env: {} } },
  http: { "my-media": { type: "http", url: "https://example.com/mcp", headers: {} } },
};
$("mcp-template").onchange = () => {
  const t = TEMPLATES[$("mcp-template").value];
  $("mcp-template").value = "";
  if (!t) return;
  let cur = {}; try { cur = JSON.parse($("s-mcp").value || "{}"); } catch {}
  $("s-mcp").value = JSON.stringify({ ...cur, ...t }, null, 2);
};
$("rerun-setup").onclick = () => { dlg.close(); showOnboarding(); };
async function saveSettings(patch) { S.settings = await D.settings.set(patch); S.mcpLive = null; refreshPills(); }
$("open-settings").onclick = () => openSettings();
["pill-claude", "pill-mcp"].forEach((id) => ($(id).onclick = () => openSettings()));
$("pill-gemini").onclick = () => openSettings("s-geminiKey");
$("claude-test").onclick = async () => {
  await saveSettings({ claudePath: $("s-claudePath").value.trim(), permissionMode: $("s-permissionMode").value, model: $("s-model").value.trim() });
  const box = $("claude-status"); box.className = "status"; box.textContent = "Asking Claude Code to reply…";
  const r = await D.claude.ping();
  box.className = `status ${r.ok ? "ok" : "bad"}`;
  box.textContent = r.ok ? `Connected · replied "${r.reply}"${r.model ? ` · ${r.model}` : ""}` : r.error;
};
$("mcp-save").onclick = async () => {
  try { await saveSettings({ mcpServers: JSON.parse($("s-mcp").value || "{}") }); renderServers(); }
  catch (e) { alert(`MCP JSON is not valid: ${e.message}`); }
};
$("mcp-import").onclick = async () => {
  const found = await D.mcp.importFromClaudeCode();
  let cur = {}; try { cur = JSON.parse($("s-mcp").value || "{}"); } catch {}
  $("s-mcp").value = JSON.stringify({ ...found, ...cur }, null, 2);
};
$("gemini-save").onclick = async () => {
  const patch = { geminiModel: $("s-geminiModel").value.trim() || "gemini-flash-latest" };
  if ($("s-geminiKey").value.trim()) patch.geminiKey = $("s-geminiKey").value.trim();
  await saveSettings(patch); $("s-geminiKey").value = ""; $("s-geminiKey").placeholder = S.settings.hasGeminiKey ? "•••••••• saved in keychain" : "AIza…";
  $("gemini-status").className = "status inline ok"; $("gemini-status").textContent = "Saved";
};
$("gemini-test").onclick = async () => {
  const s = $("gemini-status"); s.className = "status inline"; s.textContent = "Testing…";
  const r = await D.gemini.test();
  s.className = `status inline ${r.ok ? "ok" : "bad"}`;
  s.textContent = r.ok ? `Key works · ${r.models} models${r.hasModel ? "" : " · model name not found"}` : r.error;
};
$("gemini-clear").onclick = async () => { await saveSettings({ geminiKey: "" }); $("gemini-status").textContent = "Key removed"; $("s-geminiKey").placeholder = "AIza…"; };
$("general-save").onclick = async () => { await saveSettings({ projectsRoot: $("s-projectsRoot").value.trim(), pluginDir: $("s-pluginDir").value.trim() }); renderProjects(); };

// ── timeline editing (unlocked whenever Director is not working on this project) ──
const DOODLES = ["", "bulb", "bulbOff", "plug", "paan", "unlock", "dumbbell", "featherWeight", "coin", "camera", "chai", "sugar", "ball", "six", "tiffin", "moon", "pill",
  "heart", "star", "check", "cross", "arrowUp", "clock", "phone", "cart", "bag", "gift", "house", "car", "leaf", "sparkle", "note", "percent", "bolt", "rocket"];
const locked = () => !!(S.dir && chatCtx(S.dir).busy);
const round = (t, q = 100) => Math.round(t * q) / q;
const cuts = () => (film()?.tracks.shots || []).slice(1).map((x) => x.start);
const crosses = (c) => cuts().some((t) => t > c.t0 + 0.05 && t < c.t1 - 0.05);
const safeBody = (b) => esc(b).replace(/&lt;(\/?)(br|em|b)\s*\/?&gt;/g, "<$1$2>");
const discardOk = () => !E.dirty || confirm("Discard your unsaved timeline edits?") && ((E.dirty = false), (E.key = null), true);
function addNote(n) { const l = E.notes.get(S.dir) || []; if (!l.includes(n)) l.push(n); E.notes.set(S.dir, l); }

async function ensureCfg() {
  const f = film();
  if (!f) { E.cfg = null; E.key = null; renderInspector(); updateEditBar(); return; }
  if (E.key === f.key && E.cfg) return;
  const cfg = await D.edit.getCfg({ dir: S.dir, key: f.key });
  E.key = f.key; E.undo = []; E.dirty = false;
  E.cfg = cfg && !cfg.error ? cfg : { dur: f.filmDuration, callouts: [], cards: [] };
  E.cfg.callouts ||= []; E.cfg.cards ||= []; E.cfg.dur ||= f.filmDuration;
  if (E.sel && !E.cfg[E.sel.kind]?.[E.sel.i]) E.sel = null;
  renderInspector(); updateEditBar();
}
function snapshot() { E.undo.push(JSON.stringify(E.cfg)); if (E.undo.length > 100) E.undo.shift(); }
function changed() { E.dirty = true; updateEditBar(); renderTimeline(); renderInspector(); renderPreview(true); }
function updateEditBar() {
  const st = $("edit-state"), lk = locked();
  st.className = `edit-state ${E.dirty || E.needsRender ? "dirty" : "muted"}`;
  st.textContent = E.rendering ? "Rendering… (~40 s)" : E.dirty ? "Unsaved edits" : E.needsRender ? "Take swapped, needs a render" : "";
  $("undo").disabled = !E.undo.length || lk || E.rendering;
  $("save-render").disabled = (!E.dirty && !E.needsRender) || lk || E.rendering;
  $("add-callout").disabled = $("add-card").disabled = !film() || lk || E.rendering;
  $("lockbar").classList.toggle("hidden", !lk);
  $("timeline").classList.toggle("locked", lk);
}
function toEditView() { // edit over the clean film so the preview isn't on top of burned-in text
  if (S.variant === "with-text" && film()) { S.variant = film().outputs?.clean ? "clean" : "film"; S.rel = null; selectSource(); }
}
function select(kind, i, doSeek = true) {
  E.sel = { kind, i };
  const c = E.cfg[kind][i], t = video.currentTime || 0;
  if (doSeek && (t < c.t0 || t >= c.t1)) seek(c.t0 + Math.min(0.6, (c.t1 - c.t0) / 2));
  toEditView(); renderTimeline(); renderInspector(); renderPreview(true);
}
function dragItem(e, kind, i, el, lane) {
  e.stopPropagation();
  select(kind, i);
  if (locked()) return;
  const live = () => document.querySelector(`.item.${kind}[data-i="${i}"]`);
  el = live() || el; lane = el.parentElement || lane;
  const c = E.cfg[kind][i], r = lane.getBoundingClientRect(), dur = tlDur(), pps = r.width / dur, fd = film().filmDuration;
  const er = el.getBoundingClientRect(), x0 = e.clientX, len = c.t1 - c.t0, t0 = c.t0, t1 = c.t1, before = JSON.stringify(E.cfg);
  const mode = x0 - er.left < 7 ? "start" : er.right - x0 < 7 ? "end" : "move";
  const targets = [0, ...cuts(), fd, video.currentTime || 0];
  const snap = (t, off) => { if (off) return t; for (const s of targets) if (Math.abs(s - t) * pps < 7) return s; return t; };
  let moved = false;
  const move = (m) => {
    if (!moved && Math.abs(m.clientX - x0) < 3) return;
    moved = true;
    const dt = (m.clientX - x0) / pps;
    if (mode === "move") {
      let a = t0 + dt; const sa = snap(a, m.altKey);
      if (sa !== a) a = sa; else { const sb = snap(a + len, m.altKey); a = sb - len; }
      a = Math.max(0, Math.min(a, fd - len));
      c.t0 = round(a); c.t1 = round(a + len);
    } else if (mode === "start") c.t0 = round(Math.max(0, Math.min(snap(t0 + dt, m.altKey), c.t1 - 0.5)));
    else c.t1 = round(Math.min(fd, Math.max(snap(t1 + dt, m.altKey), c.t0 + 0.5)));
    const cur = live();
    if (cur) { cur.style.left = `${(c.t0 / dur) * 100}%`; cur.style.width = `${((c.t1 - c.t0) / dur) * 100}%`; cur.classList.toggle("warn", crosses(c)); }
    seek(mode === "end" ? c.t1 - 0.05 : c.t0 + 0.05);
    renderPreview(true);
  };
  const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); if (moved) { E.undo.push(before); changed(); } };
  addEventListener("pointermove", move); addEventListener("pointerup", up);
}

function renderInspector() {
  const box = $("inspector");
  const c = E.sel && E.cfg?.[E.sel.kind]?.[E.sel.i];
  if (!c) { box.classList.add("hidden"); box.innerHTML = ""; return; }
  box.classList.remove("hidden");
  const dis = locked() ? "disabled" : "";
  const num = (k, label, step = 1, cls = "") => `<label class="${cls}">${label}<input type="number" step="${step}" data-k="${k}" value="${k.split(".").reduce((o, p) => o?.[p], c) ?? ""}" ${dis}></label>`;
  const warn = [crosses(c) && `Crosses a shot cut (${cuts().filter((t) => t > c.t0 && t < c.t1).map(fmt).join(", ")}). Keep it inside one shot.`,
    (c.x < 96 || c.x > 1824 || c.y < 60 || c.y > 1020) && "Too close to the frame edge (keep 5% inside)."].filter(Boolean);
  if (E.sel.kind === "callouts") {
    box.innerHTML = `<div class="hd"><b>Callout ${E.sel.i + 1}</b><div class="row">${c.arrow ? `<button class="btn sm ghost" data-act="noarrow" ${dis}>Remove arrow</button>` : ""}<button class="btn sm ghost" data-act="dup" ${dis}>Duplicate</button><button class="btn sm ghost" data-act="del" ${dis}>Delete</button></div></div>
      <label class="wide">Lines, one per line<textarea data-k="lines" ${dis}>${esc((c.lines || []).join("\n"))}</textarea></label>
      ${num("t0", "Start (s)", 0.05)}${num("t1", "End (s)", 0.05)}${num("size", "Size", 2).replace('data-k="size" value=""', 'data-k="size" value="" placeholder="128"')}
      ${num("x", "X", 4)}${num("y", "Y", 4)}${num("rot", "Rotate °", 1)}
      <label>Doodle<select data-k="doodle" ${dis}>${DOODLES.map((d) => `<option value="${d}" ${(c.doodle?.name || "") === d ? "selected" : ""}>${d || "none"}</option>`).join("")}</select></label>
      ${c.doodle ? num("doodle.dx", "Doodle dx", 4) + num("doodle.dy", "Doodle dy", 4) + num("doodle.scale", "Doodle scale", 0.05) : ""}
      <label class="check"><input type="checkbox" data-k="glow" ${c.glow ? "checked" : ""} ${dis}> Glow (busy frames)</label>`;
  } else {
    box.innerHTML = `<div class="hd"><b>Card ${E.sel.i + 1}</b><div class="row"><button class="btn sm ghost" data-act="dup" ${dis}>Duplicate</button><button class="btn sm ghost" data-act="del" ${dis}>Delete</button></div></div>
      <label class="wide">Title<input data-k="title" value="${esc(c.title)}" ${dis}></label>
      <label class="wide">Body (&lt;br&gt; and &lt;em&gt; allowed)<textarea data-k="body" ${dis}>${esc(c.body)}</textarea></label>
      ${num("t0", "Start (s)", 0.05)}${num("t1", "End (s)", 0.05)}${num("x", "X", 4)}${num("y", "Y", 4)}
      <label>Slides in from<select data-k="from" ${dis}><option value="80" ${(c.from ?? 80) > 0 ? "selected" : ""}>right</option><option value="-80" ${(c.from ?? 80) < 0 ? "selected" : ""}>left</option></select></label>`;
  }
  if (warn.length) box.insertAdjacentHTML("beforeend", warn.map((w) => `<div class="note">⚠ ${esc(w)}</div>`).join(""));
}
$("inspector").addEventListener("input", (e) => {
  const k = e.target.dataset.k, c = E.sel && E.cfg[E.sel.kind][E.sel.i];
  if (!k || !c || locked()) return;
  if (!E.typing) { snapshot(); E.typing = true; }
  const v = e.target.type === "checkbox" ? e.target.checked : e.target.type === "number" || k === "from" ? parseFloat(e.target.value) : e.target.value;
  if (k === "lines") c.lines = v.split("\n").filter((l) => l.trim());
  else if (k === "doodle") { if (v) c.doodle = { dx: 300, dy: 60, scale: 0.7, ...c.doodle, name: v }; else delete c.doodle; }
  else if (k.startsWith("doodle.")) { if (!isNaN(v)) c.doodle[k.slice(7)] = v; }
  else if (typeof v === "number" && isNaN(v)) return;
  else c[k] = k === "t0" || k === "t1" ? round(v) : v;
  if (k === "glow" && !v) delete c.glow;
  E.dirty = true; updateEditBar(); renderTimeline(); renderPreview(true);
  if (k === "doodle" || e.target.type === "checkbox") { E.typing = false; renderInspector(); }
});
$("inspector").addEventListener("focusout", () => { E.typing = false; renderInspector(); });
$("inspector").addEventListener("click", (e) => {
  const act = e.target.dataset.act, list = E.sel && E.cfg[E.sel.kind];
  if (!act || !list || locked()) return;
  snapshot();
  if (act === "del") { list.splice(E.sel.i, 1); E.sel = null; }
  if (act === "dup") { const c = JSON.parse(JSON.stringify(list[E.sel.i])); c.t0 = round(c.t0 + 0.5); c.t1 = round(c.t1 + 0.5); list.push(c); E.sel = { kind: E.sel.kind, i: list.length - 1 }; }
  if (act === "noarrow") delete list[E.sel.i].arrow;
  changed();
});

// live preview of the edited callouts/cards over the clean film (dashed boxes over the burned-in version)
let pvKey = "";
function renderPreview(force) {
  const box = $("preview"), f = film();
  if (!E.cfg || !f || E.key !== f.key || video.classList.contains("hidden")) { if (box.childElementCount) box.innerHTML = ""; pvKey = ""; return; }
  const t = video.currentTime || 0, burned = !!S.shown?.includes("/with-text/");
  const act = [...E.cfg.callouts.map((c, i) => ["callouts", i, c]), ...E.cfg.cards.map((c, i) => ["cards", i, c])].filter(([, , c]) => t >= c.t0 && t < c.t1);
  const key = `${act.map(([k, i]) => k + i).join()}|${burned}|${E.sel ? E.sel.kind + E.sel.i : ""}|${box.clientWidth}x${box.clientHeight}|${locked()}`;
  if (!force && key === pvKey) return;
  pvKey = key;
  const W = box.clientWidth, H = box.clientHeight, sc = Math.min(W / 1920, H / 1080), ox = (W - 1920 * sc) / 2, oy = (H - 1080 * sc) / 2;
  box.innerHTML = "";
  for (const [k, i, c] of act) {
    const sel = E.sel?.kind === k && E.sel.i === i;
    const el = h("div", `pv ${k === "callouts" ? "txt" : "card"}${burned ? " ghost" : ""}${sel ? " sel" : ""}${locked() ? " locked" : ""}`);
    el.style.left = `${ox + c.x * sc}px`; el.style.top = `${oy + c.y * sc}px`;
    if (k === "callouts") {
      el.innerHTML = (c.lines || []).map((l) => `<div>${esc(l)}</div>`).join("");
      el.style.fontSize = `${(c.size || 128) * sc}px`;
      el.style.transform = `translate(-50%, -50%) rotate(${c.rot ?? -7}deg)`;
    } else {
      el.innerHTML = `<b>${esc(c.title)}</b><span>${safeBody(c.body)}</span>`;
      el.style.transformOrigin = "0 0"; el.style.transform = `scale(${sc})`;
    }
    el.onpointerdown = (e) => dragPos(e, k, i, el, sc);
    box.append(el);
  }
}
function dragPos(e, kind, i, el, sc) {
  e.stopPropagation(); e.preventDefault();
  E.sel = { kind, i }; renderTimeline(); renderInspector();
  document.querySelectorAll(".pv.sel").forEach((x) => x.classList.remove("sel")); el.classList.add("sel");
  if (locked()) return;
  const c = E.cfg[kind][i], x0 = e.clientX, y0 = e.clientY, cx = c.x, cy = c.y, l0 = parseFloat(el.style.left), t0 = parseFloat(el.style.top), before = JSON.stringify(E.cfg);
  let moved = false;
  const move = (m) => {
    const dx = m.clientX - x0, dy = m.clientY - y0;
    if (!moved && Math.hypot(dx, dy) < 3) return;
    moved = true;
    c.x = Math.round(Math.max(0, Math.min(1920, cx + dx / sc))); c.y = Math.round(Math.max(0, Math.min(1080, cy + dy / sc)));
    el.style.left = `${l0 + (c.x - cx) * sc}px`; el.style.top = `${t0 + (c.y - cy) * sc}px`;
  };
  const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); if (moved) { E.undo.push(before); changed(); } };
  addEventListener("pointermove", move); addEventListener("pointerup", up);
}

function addItem(kind) {
  const f = film();
  if (!f || !E.cfg || locked()) return;
  snapshot();
  const t = round(Math.min(video.currentTime || 0, f.filmDuration - 1.5));
  E.cfg[kind].push(kind === "callouts"
    ? { t0: t, t1: round(Math.min(f.filmDuration, t + 2)), x: 1500, y: 300, rot: -7, lines: ["New", "callout!"] }
    : { t0: t, t1: round(Math.min(f.filmDuration, t + 2.5)), x: 1200, y: 120, title: "Notification ✓", body: "Product moment<br><em>goes here</em>" });
  E.sel = { kind, i: E.cfg[kind].length - 1 };
  toEditView(); changed();
}
$("add-callout").onclick = () => addItem("callouts");
$("add-card").onclick = () => addItem("cards");
function undo() { if (!E.undo.length || locked()) return; E.cfg = JSON.parse(E.undo.pop()); if (E.sel && !E.cfg[E.sel.kind][E.sel.i]) E.sel = null; changed(); }
$("undo").onclick = undo;
document.addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || dlg.open) return;
  if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
  else if ((e.key === "Backspace" || e.key === "Delete") && E.sel && !locked()) { e.preventDefault(); snapshot(); E.cfg[E.sel.kind].splice(E.sel.i, 1); E.sel = null; changed(); }
  else if (e.key === "Escape" && E.sel) { E.sel = null; renderTimeline(); renderInspector(); renderPreview(true); }
});
$("save-render").onclick = async () => {
  const f = film();
  if (!f || !E.cfg || locked()) return;
  E.rendering = true; updateEditBar();
  let r = E.dirty ? await D.edit.saveCfg({ dir: S.dir, key: f.key, cfg: E.cfg }) : { ok: true };
  if (r?.ok !== false) r = await D.edit.render({ dir: S.dir, key: f.key });
  E.rendering = false;
  if (r?.ok === false) { updateEditBar(); $("edit-state").textContent = "Render failed"; alert(r.error); return; }
  if (E.dirty) addNote(`I edited the callouts/cards of ${f.key} in the timeline (overlay/cfg/${f.key}.json) and re-rendered out/with-text/${f.key}.mp4.`);
  E.dirty = false; E.needsRender = false; E.undo = [];
  S.bust = Date.now(); S.variant = "with-text"; S.rel = null;
  await loadTimeline(false); updateEditBar();
  $("edit-state").textContent = "Saved and rendered ✓";
};

// ── Claude account: API from the environment, the Claude Code login, or a key stored in Director ──
function renderAccounts(boxId) {
  const box = $(boxId), st = S.status;
  if (!box || !st?.ok) return;
  const sel = S.settings.authResolved;
  const opts = [
    st.envProvider && { id: "env", title: "API from my environment", desc: `${st.envProvider.label} (${st.envProvider.var}), the same setup your terminal uses` },
    { id: "login", title: "My Claude account", desc: st.account ? `Your Claude Code login, ${st.account}` : "Your Claude Code login. Not signed in yet: run claude in a terminal and use /login." },
    { id: "apikey", title: "Anthropic API key", desc: S.settings.hasAnthropicKey ? "Using the key saved in your macOS keychain" : "Paste a key from console.anthropic.com. It's kept in your macOS keychain." },
  ].filter(Boolean);
  box.innerHTML = `<div class="acct-label">Which Claude account should Director use?</div>` +
    opts.map((o) => `<label class="acct-opt${o.id === sel ? " on" : ""}"><input type="radio" name="${boxId}-mode" value="${o.id}"${o.id === sel ? " checked" : ""}><span><b>${esc(o.title)}</b><small>${esc(o.desc)}</small></span></label>`).join("") +
    (sel === "apikey" ? `<div class="row acct-key"><input type="password" placeholder="${S.settings.hasAnthropicKey ? "Saved. Paste a new key to replace it" : "sk-ant-…"}" autocomplete="off" data-key><button type="button" class="btn sm" data-savekey>Save key</button></div>` : "");
}
async function afterAccountChange() {
  S.settings = await D.settings.get(); S.status = await D.claude.status(); S.mcpLive = null;
  renderAccounts("acct"); renderAccounts("ob-acct"); refreshPills();
  const box = $("claude-status");
  if (box && S.status.ok) { box.className = "status ok"; box.textContent = `${S.status.version}, using ${S.status.using}`; }
  ["ob-claude-ping"].forEach((id) => ($(id).textContent = ""));
}
for (const id of ["acct", "ob-acct"]) {
  $(id).addEventListener("change", async (e) => {
    if (e.target.name !== `${id}-mode`) return;
    await D.settings.set({ authMode: e.target.value }); // restarts Director's chats on the new account
    afterAccountChange();
  });
  $(id).addEventListener("click", async (e) => {
    if (!e.target.closest("[data-savekey]")) return;
    const k = $(id).querySelector("[data-key]").value.trim();
    if (!k) return;
    await D.settings.set({ anthropicKey: k, authMode: "apikey" });
    afterAccountChange();
  });
}

// ── onboarding (first run, or Settings → General → Run setup again) ──
const OB = $("onboard");
function obStep(n) {
  OB.querySelectorAll(".ob-step").forEach((x) => x.classList.toggle("hidden", x.dataset.step !== String(n)));
  if (n === 1) obClaude();
  if (n === 2) obMedia();
}
function showOnboarding() { OB.classList.remove("hidden"); obStep(1); }
async function finishOnboarding() { await saveSettings({ onboarded: true }); OB.classList.add("hidden"); refreshPills(); $("empty-input").focus(); }
OB.addEventListener("click", async (e) => {
  const go = e.target.closest("[data-go]");
  if (go) return obStep(Number(go.dataset.go));
  const cp = e.target.closest("[data-copy]");
  if (cp) { await D.copy(cp.dataset.copy); cp.textContent = "Copied"; setTimeout(() => (cp.textContent = "Copy"), 1200); }
});
$("ob-skip").onclick = finishOnboarding;
$("ob-done").onclick = finishOnboarding;
function setRow(id, state, text) {
  const r = $(id);
  r.className = `check-row ${state}`;
  r.querySelector(".ico").style.setProperty("--i", `url(icons/${state === "ok" ? "check" : state === "bad" ? "x-circle" : "circle-notch"}.svg)`);
  r.querySelector("span").textContent = text;
}
async function obClaude() {
  setRow("ob-claude", "", "Looking for Claude Code…");
  const st = await D.claude.status();
  setRow("ob-claude", st.ok ? "ok" : "bad", st.ok ? `Found Claude Code ${st.version.replace(/\s*\(Claude Code\)/, "")}` : "Claude Code isn't installed yet. Install it, then test the connection.");
  $("ob-claude-install").classList.toggle("hidden", !!st.ok);
  S.status = st;
  if (st.ok) renderAccounts("ob-acct"); else $("ob-acct").innerHTML = "";
}
$("ob-claude-test").onclick = async () => {
  const s = $("ob-claude-ping"); s.className = "status inline"; s.textContent = "Asking Claude Code to reply…";
  const r = await D.claude.ping();
  s.className = `status inline ${r.ok ? "ok" : "bad"}`;
  s.textContent = r.ok ? `Connected, it replied "${r.reply}"` : r.error;
  if (r.ok) obClaude();
};
function optState(id, cls, text) {
  const x = $(id).querySelector("[data-state]");
  x.className = `state ${cls}`; x.textContent = text;
  $(id).classList.toggle("on", cls === "ok");
}
const remember = (name) => [...new Set([...(S.settings.mediaServers || []), name])];
function obMedia() {
  if (S.settings.mcpServers?.aistudio) aiStudioWho();
  higgsCheck(false);
}
async function aiStudioConnect() {
  optState("ob-aistudio", "", "Connecting… the first run downloads the server");
  await saveSettings({ mcpServers: { ...S.settings.mcpServers, aistudio: AISTUDIO }, mediaServers: remember("aistudio") });
  const t = await D.mcp.test({ name: "aistudio" });
  if (!t.ok) return optState("ob-aistudio", "bad", String(t.error).slice(0, 140));
  optState("ob-aistudio", "ok", `Connected, ${t.tools.length} tools`);
  aiStudioWho();
}
async function aiStudioWho() {
  const btn = $("ob-aistudio").querySelector('[data-act="signin"]');
  $("ob-aistudio").querySelector('[data-act="connect"]').classList.add("hidden");
  const w = await D.mcp.call({ name: "aistudio", tool: "whoami", timeoutMs: 120000 });
  let who = "";
  try { const j = JSON.parse(w.text); who = j.user?.email || ""; } catch {}
  if (w.ok) { optState("ob-aistudio", "ok", who ? `Signed in as ${who}` : "Connected"); btn.classList.add("hidden"); }
  else { optState("ob-aistudio", "", "Connected. Sign in to use it."); btn.classList.remove("hidden"); }
}
async function aiStudioSignIn() {
  optState("ob-aistudio", "", "Finish the Google sign-in in your browser…");
  const r = await D.mcp.call({ name: "aistudio", tool: "login" });
  if (!r.ok) return optState("ob-aistudio", "bad", String(r.error).slice(0, 140));
  aiStudioWho();
}
async function higgsConnect() {
  optState("ob-higgsfield", "", "Adding it to your Claude Code…");
  const r = await D.claude.mcpAddHttp({ name: "higgsfield", url: "https://mcp.higgsfield.ai/mcp" });
  if (r?.ok === false) return optState("ob-higgsfield", "bad", String(r.error).slice(0, 140));
  await saveSettings({ mediaServers: remember("higgsfield") });
  higgsCheck(true);
}
async function higgsCheck(wait) {
  const opt = $("ob-higgsfield");
  if (wait) optState("ob-higgsfield", "", "Checking with Claude Code…");
  const m = ((await D.claude.mcpList()) || []).find((x) => x.name === "higgsfield");
  if (!m) { if (wait) optState("ob-higgsfield", "", "Not connected"); return; }
  const ok = /^connected/i.test(m.status);
  optState("ob-higgsfield", ok ? "ok" : "", ok ? "Connected" : m.status);
  opt.querySelector('[data-act="connect"]').classList.add("hidden");
  opt.querySelector('[data-act="check"]').classList.remove("hidden");
  opt.querySelector("[data-signin]").classList.toggle("hidden", ok);
}
$("ob-aistudio").addEventListener("click", (e) => { const a = e.target.closest("[data-act]")?.dataset.act; if (a === "connect") aiStudioConnect(); if (a === "signin") aiStudioSignIn(); });
$("ob-higgsfield").addEventListener("click", (e) => { const a = e.target.closest("[data-act]")?.dataset.act; if (a === "connect") higgsConnect(); if (a === "check") higgsCheck(true); });
$("ob-custom").addEventListener("click", (e) => { if (e.target.closest('[data-act="custom"]')) openSettings("s-mcp"); });
$("ob-gemini-save").onclick = async () => {
  const k = $("ob-gemini-key").value.trim(), st = $("ob-gemini-status");
  if (!k) { st.textContent = "Paste a key first"; return; }
  await saveSettings({ geminiKey: k }); $("ob-gemini-key").value = "";
  st.className = "status inline"; st.textContent = "Testing…";
  const r = await D.gemini.test();
  st.className = `status inline ${r.ok ? "ok" : "bad"}`;
  st.textContent = r.ok ? "Key works" : String(r.error).slice(0, 160);
};

// ── home: a brief starts a project ──
$("empty-input").addEventListener("input", () => ($("empty-send").disabled = !$("empty-input").value.trim()));
$("empty-input").onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("empty-form").requestSubmit(); } };
$("chips").onclick = (e) => {
  const c = e.target.closest("[data-brief]");
  if (!c) return;
  $("empty-input").value = c.dataset.brief; $("empty-send").disabled = false; $("empty-input").focus();
};
$("empty-form").onsubmit = async (e) => {
  e.preventDefault();
  const text = $("empty-input").value.trim();
  if (!text) return;
  $("empty-send").disabled = true; $("empty-status").textContent = "Starting a project…";
  const name = text.replace(/\S*\/\S*/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 5).join(" ") || "untitled";
  const r = await D.projects.create({ name });
  if (!r?.dir) { $("empty-status").textContent = r?.error || "Could not create the project"; $("empty-send").disabled = false; return; }
  $("empty-input").value = ""; $("empty-status").textContent = "";
  await renderProjects(); await openProject(r.dir);
  $("input").value = text; send();
};

// ── boot ─────────────────────────────────────────────────────────────
$("new-project").onclick = goHome;
$("pick-project").onclick = $("empty-open").onclick = pickProject;
tick();
(async () => {
  S.settings = await D.settings.get();
  refreshPills();
  await renderProjects();
  if (!S.settings.onboarded) showOnboarding(); else $("empty-input").focus();
})();
