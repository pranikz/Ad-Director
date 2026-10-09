// Chat history per project, so the conversation is still on screen after a restart.
// Claude Code keeps its own context (--resume); this only keeps what the chat panel draws.
const fs = require("node:fs");
const path = require("node:path");

const list = (x) => (Array.isArray(x) ? x : []);
const cut = (v) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s && s.length > 2000 ? `${s.slice(0, 2000)}…` : s; };

// the slice of a stream-json event the panel renders: text, tool labels and outcomes, run totals (no file contents, no tool output)
function compact(ev) {
  if (ev.type === "assistant") {
    const content = list(ev.message?.content).flatMap((b) =>
      b.type === "text" ? [{ type: "text", text: b.text }]
      : b.type === "tool_use" ? [{ type: "tool_use", id: b.id, name: b.name, input: Object.fromEntries(Object.entries(b.input || {}).map(([k, v]) => [k, cut(v)])) }]
      : []);
    return content.length ? { type: "assistant", message: { id: ev.message.id, content } } : null;
  }
  if (ev.type === "user") {
    const content = list(ev.message?.content).filter((b) => b.type === "tool_result").map((b) => ({ type: "tool_result", tool_use_id: b.tool_use_id, is_error: !!b.is_error }));
    return content.length ? { type: "user", message: { content } } : null;
  }
  if (ev.type === "system" && ev.subtype === "init") return { type: "system", subtype: "init", model: ev.model, mcp_servers: ev.mcp_servers };
  if (ev.type === "result") return { type: "result", is_error: ev.is_error, duration_ms: ev.duration_ms, total_cost_usd: ev.total_cost_usd };
  if (ev.type === "app_user") return { type: "app_user", text: ev.text };
  if (ev.type === "app_exit" || ev.type === "app_error") return { type: ev.type, error: cut(ev.error), stderr: cut(ev.stderr) };
  return null; // stream deltas: the final assistant event carries the whole text
}

function append(file, ev) {
  const c = compact(ev);
  if (!c) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(c)}\n`);
}

function read(file) {
  let text = "";
  try { text = fs.readFileSync(file, "utf8"); } catch { return []; }
  return text.split("\n").flatMap((l) => { try { return l ? [JSON.parse(l)] : []; } catch { return []; } }); // a line cut off by a crash is skipped, not the whole history
}

module.exports = { compact, append, read };
