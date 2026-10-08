// One long-lived Claude Code process per project chat, driven over stream-json (the same way the HyperFrames app
// drives the CLI): the Director plugin rides along via --plugin-dir, media MCPs via --mcp-config, and the project
// folder via --add-dir. Every stdout line is a JSON event forwarded to the window.
const { spawn } = require("node:child_process");
const { EventEmitter } = require("node:events");
const readline = require("node:readline");

class ClaudeSession extends EventEmitter {
  /** @param {{ bin: string, env: object, cwd: string, pluginDir: string, mcpConfig?: string, permissionMode: string,
   *            model?: string, resume?: string, system?: string, agent?: string }} o */
  constructor(o) {
    super();
    this.o = o;
    this.proc = null;
    this.sessionId = o.resume || null;
    this.busy = false;
  }

  args(resume) {
    const o = this.o;
    const a = ["--print", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
      "--include-partial-messages", "--plugin-dir", o.pluginDir, "--add-dir", o.cwd, "--permission-mode", o.permissionMode];
    if (o.agent) a.push("--agent", o.agent);
    if (o.system) a.push("--append-system-prompt", o.system);
    if (o.mcpConfig) a.push("--mcp-config", o.mcpConfig);
    if (o.model) a.push("--model", o.model);
    if (resume) a.push("--resume", resume);
    return a;
  }

  start(resume = this.sessionId) {
    const startedAt = Date.now();
    const proc = spawn(this.o.bin, this.args(resume), { cwd: this.o.cwd, env: this.o.env, stdio: ["pipe", "pipe", "pipe"] });
    this.proc = proc;
    let stderr = "";
    readline.createInterface({ input: proc.stdout }).on("line", (line) => {
      let ev;
      try { ev = JSON.parse(line); } catch { return; }
      if (ev.type === "system" && ev.subtype === "init" && ev.session_id) this.sessionId = ev.session_id;
      if (ev.type === "result") this.busy = false;
      this.emit("event", ev);
    });
    proc.stderr.on("data", (c) => (stderr = (stderr + c).slice(-4000)));
    proc.on("error", (err) => this.emit("event", { type: "app_error", error: `Could not start Claude Code: ${err.message}` }));
    proc.on("close", (code) => {
      if (this.proc !== proc) return;
      this.proc = null;
      this.busy = false;
      // a stale --resume id dies at once: start fresh and replay the pending message
      if (resume && code !== 0 && Date.now() - startedAt < 8000 && this.pending) {
        this.sessionId = null;
        const msg = this.pending;
        this.start(null);
        return this.write(msg);
      }
      this.emit("event", { type: "app_exit", code, stderr: code ? stderr.trim() : "" });
    });
  }

  write(text) {
    this.pending = text;
    this.busy = true;
    this.proc.stdin.write(JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text }] } }) + "\n");
  }

  send(text) {
    if (!this.proc) this.start();
    this.write(text);
  }

  stop() {
    if (this.proc) this.proc.kill("SIGTERM");
    this.proc = null;
    this.busy = false;
  }
}

module.exports = { ClaudeSession };
