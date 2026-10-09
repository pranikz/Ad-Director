// A chat whose Claude Code conversation was pruned must start fresh and resend the message, not look finished.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { ClaudeSession } = require("../lib/claude");

// a fake `claude`: with --resume it does what claude 2.1.x does for a missing conversation (an error result, exit 0)
const FAKE = `#!/usr/bin/env node
const a = process.argv.slice(2), out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
if (a.includes("--resume")) { out({ type: "result", subtype: "error_during_execution", is_error: true, num_turns: 0, duration_ms: 0 }); process.stderr.write("No conversation found with session ID: " + a[a.indexOf("--resume") + 1]); process.exit(0); }
require("readline").createInterface({ input: process.stdin }).on("line", (l) => {
  out({ type: "system", subtype: "init", session_id: "fresh-1" });
  out({ type: "result", is_error: false, num_turns: 1, result: "echo " + JSON.parse(l).message.content[0].text });
});`;

test("a pruned --resume session starts fresh and resends the message", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-fake-")), bin = path.join(dir, "claude");
  fs.writeFileSync(bin, FAKE, { mode: 0o755 });
  const s = new ClaudeSession({ bin, env: process.env, cwd: dir, pluginDir: dir, permissionMode: "default", resume: "gone-123" });
  const events = [];
  const done = new Promise((resolve) => s.on("event", (ev) => { events.push(ev); if (ev.type === "result" && !ev.is_error) resolve(); }));
  s.send("hi");
  await done;
  s.stop();
  assert.deepStrictEqual(events.filter((e) => e.type === "result").map((e) => e.result), ["echo hi"]); // the doomed error result never reached the window
  assert.strictEqual(s.sessionId, "fresh-1");
});

test("stop() tells the window the run ended", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-fake-")), bin = path.join(dir, "claude");
  fs.writeFileSync(bin, "#!/bin/sh\nsleep 30\n", { mode: 0o755 });
  const s = new ClaudeSession({ bin, env: process.env, cwd: dir, pluginDir: dir, permissionMode: "default" });
  const events = [];
  s.on("event", (ev) => events.push(ev));
  s.send("hi");
  s.stop();
  assert.deepStrictEqual(events.map((e) => e.type), ["app_exit"]);
});
