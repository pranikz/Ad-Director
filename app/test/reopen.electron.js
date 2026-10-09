// macOS: closing the window keeps the app alive; a Dock click ("activate") opens a new one.
// That must not re-register IPC handlers, and the new window must still reach main. Run: npm run test:reopen
const os = require("os"), fs = require("fs"), path = require("path");
process.env.DIRECTOR_USER_DATA = fs.mkdtempSync(path.join(os.tmpdir(), "director-reopen-"));
process.env.DIRECTOR_SNAPSHOT = "1"; process.env.DIRECTOR_WAIT = "99999"; // hidden windows, no capture before we exit
require("../main.js");
const { app, BrowserWindow } = require("electron");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  try {
    for (let i = 0; i < 2; i++) {
      await wait(800);
      BrowserWindow.getAllWindows().forEach((w) => w.destroy());
      await wait(200);
      app.emit("activate");
    }
    await wait(1500);
    const wins = BrowserWindow.getAllWindows();
    const r = await wins[0].webContents.executeJavaScript("director.settings.get().then((s) => typeof s)");
    if (wins.length !== 1 || r !== "object") throw new Error(`windows=${wins.length} settings:get=${r}`);
    console.log("ok: reopened twice, IPC still answers");
    app.exit(0);
  } catch (e) { console.error("FAIL:", e.message); app.exit(1); }
});
