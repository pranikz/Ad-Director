const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { compact, append, read } = require("../lib/chatlog");

test("keeps what the chat panel draws, drops file contents and tool output", () => {
  const big = "x".repeat(5000);
  const a = compact({ type: "assistant", message: { id: "m1", content: [{ type: "text", text: "Hi" }, { type: "tool_use", id: "t1", name: "Write", input: { file_path: "/p/a.md", content: big } }, { type: "thinking", thinking: "…" }] } });
  assert.deepStrictEqual(a.message.content[0], { type: "text", text: "Hi" });
  assert.strictEqual(a.message.content[1].input.file_path, "/p/a.md");
  assert.ok(a.message.content[1].input.content.length <= 2001);
  assert.strictEqual(a.message.content.length, 2);
  assert.deepStrictEqual(compact({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: big, is_error: true }] } }).message.content, [{ type: "tool_result", tool_use_id: "t1", is_error: true }]);
  assert.strictEqual(compact({ type: "user", message: { content: "plain prompt" } }), null);
  assert.strictEqual(compact({ type: "stream_event", event: {} }), null);
});

test("round-trips through the file and skips a line cut off by a crash", () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "chatlog-")), "c", "x.jsonl");
  assert.deepStrictEqual(read(f), []);
  append(f, { type: "app_user", text: "make 3 reels" });
  append(f, { type: "stream_event", event: {} });
  append(f, { type: "result", is_error: false, duration_ms: 1200, total_cost_usd: 0.4, result: "final text" });
  fs.appendFileSync(f, '{"type":"assist');
  assert.deepStrictEqual(read(f), [{ type: "app_user", text: "make 3 reels" }, { type: "result", is_error: false, duration_ms: 1200, total_cost_usd: 0.4 }]);
});
