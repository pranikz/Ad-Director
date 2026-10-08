// The MCP "Test" button must do a real handshake: initialize → tools/list against a stdio server.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { testMcp, writeMcpConfig } = require("../lib/mcp");

const FAKE = `const rl=require("readline").createInterface({input:process.stdin});
rl.on("line",l=>{const m=JSON.parse(l);const out=r=>process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:m.id,result:r})+"\\n");
if(m.method==="initialize")out({protocolVersion:"2025-06-18",capabilities:{tools:{}},serverInfo:{name:"fake-media",version:"9.9"}});
if(m.method==="tools/list")out({tools:[{name:"generate"},{name:"get_result"}]});});`;

test("stdio handshake lists tools", async () => {
  const r = await testMcp({ type: "stdio", command: process.execPath, args: ["-e", FAKE] }, process.env);
  assert.deepStrictEqual(r, { ok: true, server: "fake-media", version: "9.9", tools: ["generate", "get_result"] });
});

test("missing command fails cleanly", async () => {
  const r = await testMcp({ type: "stdio", command: "definitely-not-a-binary-xyz", args: [] }, process.env);
  assert.strictEqual(r.ok, false);
});

test("mcp config keeps only enabled servers", () => {
  const f = path.join(os.tmpdir(), `mcp-${process.pid}.json`);
  writeMcpConfig({ a: { command: "x" }, b: { command: "y", enabled: false } }, f);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(f, "utf8")), { mcpServers: { a: { command: "x" } } });
  assert.strictEqual(writeMcpConfig({ b: { command: "y", enabled: false } }, f + "2"), null);
});
