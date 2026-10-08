// The Claude account choice must shape the child env exactly: login/apikey strip every API override, env keeps them.
const { test } = require("node:test");
const assert = require("node:assert");
process.env.CLAUDE_CODE_USE_FOUNDRY = "1";
process.env.ANTHROPIC_FOUNDRY_API_KEY = "test-foundry";
const { childEnv, resolveAuth } = require("../lib/system");
const apiVars = (env) => Object.keys(env).filter((k) => /^(ANTHROPIC_|CLAUDE_CODE_USE_)/.test(k));

test("login strips API variables", () => assert.deepStrictEqual(apiVars(childEnv({ auth: "login" })), []));
test("apikey strips the rest and sets only the stored key", () => {
  const env = childEnv({ auth: "apikey", apiKey: "sk-test" });
  assert.deepStrictEqual(apiVars(env), ["ANTHROPIC_API_KEY"]);
  assert.strictEqual(env.ANTHROPIC_API_KEY, "sk-test");
});
test("env keeps the shell's provider", () => assert.ok(childEnv({ auth: "env" }).CLAUDE_CODE_USE_FOUNDRY));
test("auto picks the environment's API when one exists", () => assert.strictEqual(resolveAuth("auto"), "env"));
