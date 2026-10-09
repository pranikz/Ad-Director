const { contextBridge, ipcRenderer } = require("electron");

const call = (ch) => (arg) => ipcRenderer.invoke(ch, arg);
const on = (ch) => (fn) => {
  const h = (_e, d) => fn(d);
  ipcRenderer.on(ch, h);
  return () => ipcRenderer.removeListener(ch, h);
};

contextBridge.exposeInMainWorld("director", {
  settings: { get: call("settings:get"), set: call("settings:set") },
  claude: { status: call("claude:status"), ping: call("claude:ping"), mcpList: call("claude:mcpList"), mcpAddHttp: call("claude:mcpAddHttp") },
  mcp: { test: call("mcp:test"), call: call("mcp:call"), importFromClaudeCode: call("mcp:import") },
  copy: (text) => ipcRenderer.invoke("clipboard:write", { text }),
  gemini: { test: call("gemini:test") },
  projects: {
    list: call("projects:list"), create: call("projects:create"), pick: call("projects:pick"), open: call("projects:open"),
    files: call("projects:files"), timeline: call("projects:timeline"), reveal: call("projects:reveal"), remove: call("projects:remove"), openFolder: call("projects:openFolder"), setMarket: call("projects:setMarket"),
  },
  menu: call("menu"),
  tools: { check: call("tools:check"), install: call("tools:install") },
  chat: { send: call("chat:send"), stop: call("chat:stop"), reset: call("chat:new"), onEvent: on("chat:event") },
  vlm: { check: call("vlm:check") },
  edit: { getCfg: call("cfg:get"), saveCfg: call("cfg:save"), render: call("render"), useTake: call("take:use") },
  onProjectChanged: on("project:changed"),
  openExternal: call("open:external"),
  about: call("app:about"),
  pickFiles: call("pick:files"),
  revealPlugin: call("app:revealPlugin"),
});
