// Machine facts the app needs: the person's login-shell environment (GUI apps on macOS start with a bare PATH, so
// claude / uv / ffmpeg / npx installed via nvm or Homebrew would be invisible), and where their Claude Code is.
const { execFileSync, execFile } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let loginEnv = null;

/** The login shell's environment merged over ours, read once. */
function getLoginEnv() {
  if (loginEnv) return loginEnv;
  const shell = process.env.SHELL || "/bin/zsh";
  try {
    // -il loads .zprofile/.zshrc (nvm, Homebrew); the marker skips anything the rc files print
    const out = execFileSync(shell, ["-ilc", "printf '__DIRECTOR_ENV__'; env -0"], { encoding: "utf8", timeout: 10000 });
    const env = {};
    for (const kv of out.split("__DIRECTOR_ENV__")[1].split("\0")) {
      const i = kv.indexOf("=");
      if (i > 0) env[kv.slice(0, i)] = kv.slice(i + 1);
    }
    loginEnv = { ...process.env, ...env };
  } catch {
    loginEnv = { ...process.env };
  }
  return loginEnv;
}

// Variables that point Claude Code at an API account instead of the person's own Claude login.
const API_ENV = /^(ANTHROPIC_|CLAUDE_CODE_USE_(BEDROCK|VERTEX|FOUNDRY)$)/;

/** Env for child processes: login env, minus nested-Claude markers, optionally minus API overrides. */
function childEnv({ ignoreApiEnv = false, extra = {} } = {}) {
  const env = { ...getLoginEnv(), ...extra };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  if (ignoreApiEnv) for (const k of Object.keys(env)) if (API_ENV.test(k)) delete env[k];
  return env;
}

/** Path to the person's claude binary: the setting, PATH, then the usual install spots. */
function findClaude(setting) {
  if (setting && fs.existsSync(setting)) return setting;
  try {
    const p = execFileSync("/usr/bin/which", ["claude"], { env: getLoginEnv(), encoding: "utf8" }).trim();
    if (p) return p;
  } catch {}
  const home = os.homedir();
  return [path.join(home, ".claude/local/claude"), path.join(home, ".local/bin/claude"), "/opt/homebrew/bin/claude", "/usr/local/bin/claude"]
    .find((p) => fs.existsSync(p)) || null;
}

/** Version + signed-in account of the person's Claude Code (the account is read from their own ~/.claude.json). */
function claudeStatus(bin, env) {
  return new Promise((resolve) => {
    if (!bin) return resolve({ ok: false, error: "Claude Code not found. Install it, or set its path in Settings." });
    execFile(bin, ["--version"], { env, timeout: 15000 }, (err, stdout) => {
      if (err) return resolve({ ok: false, path: bin, error: String(err.message || err) });
      let account = null;
      try {
        const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".claude.json"), "utf8"));
        account = cfg.oauthAccount?.emailAddress || null;
      } catch {}
      const apiMode = Object.keys(env).find((k) => /^CLAUDE_CODE_USE_(BEDROCK|VERTEX|FOUNDRY)$/.test(k)) || (env.ANTHROPIC_API_KEY ? "ANTHROPIC_API_KEY" : null);
      resolve({ ok: true, path: bin, version: stdout.trim(), account, apiMode });
    });
  });
}

/** A one-line live call through the person's Claude Code — proves login + model access. */
function claudePing(bin, env) {
  return new Promise((resolve) => {
    execFile(bin, ["-p", "Reply with exactly: OK", "--output-format", "json"], { env, timeout: 90000, cwd: os.homedir() }, (err, stdout, stderr) => {
      try {
        const r = JSON.parse(stdout);
        resolve(r.is_error ? { ok: false, error: r.result } : { ok: true, reply: String(r.result).trim(), model: Object.keys(r.modelUsage || {})[0] || null });
      } catch {
        resolve({ ok: false, error: (stderr || stdout || String(err)).trim().slice(-400) });
      }
    }).stdin?.end();
  });
}

module.exports = { getLoginEnv, childEnv, findClaude, claudeStatus, claudePing };
