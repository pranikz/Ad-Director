# Director app

A desktop studio for **Director**, an AI ad-film director agent for Claude Code. It drives **your own Claude Code**, and adds onboarding, media connections, a viewer and an editable timeline around it. The look is monochrome and follows the system light or dark theme.

```bash
npm install
npm start            # run from source
npm run dist         # build dist/Director-darwin-arm64/Director.app (plugin bundled inside)
npm run check        # syntax + MCP handshake tests
```

## What it does
- **Onboarding** (first run, or Settings, then General, then Run setup again):
  - It checks your Claude Code: install, version and a live reply test, then asks **which Claude account to use**: the API from your environment (detected: Microsoft Foundry, Amazon Bedrock, Google Vertex or `ANTHROPIC_API_KEY`), your Claude Code login (claude.ai), or an Anthropic API key kept in the macOS keychain. The default is the environment's API when there is one; you can change it any time in Settings, and each chat shows which account it runs on.
  - It connects a media MCP. **AI Studio MCP** runs locally over stdio, is handshake-tested and signs in with Google from the app. **Higgsfield MCP** is registered with your Claude Code (`claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp`), which handles its OAuth sign-in; its status comes from `claude mcp list`. Any other server can be added in Settings.
  - It adds an optional Gemini key.
- **Home composer:** type a brief and Director creates the project and starts on it.
- **Chat with Director.** Each project gets one long-lived `claude` process (stream-json) with:
  - `--plugin-dir` set to the Director plugin, and `--agent director:director`;
  - `--add-dir` for the project folder;
  - `--mcp-config` for your media MCPs.
  
  You get your own login, plugins, skills and MCPs. Conversations resume per project.
- **Connections** (Settings):
  - **Claude Code:** auto-detects your CLI and shows the version and signed-in account, with a live "Test connection". Optional: ignore `ANTHROPIC_*`/Bedrock/Vertex/Foundry env vars so it uses your Claude login.
  - **Media MCPs:** any server, stdio or HTTP, in Claude Code's `mcpServers` format. AI Studio is pre-filled. "Import from Claude Code" pulls in the servers you already have, and "Test" runs a real `initialize` → `tools/list` handshake. After the first message, live status comes from Claude's own init event.
  - **Google Gemini (optional):** the key is stored in the macOS keychain (safeStorage). "VLM check" uploads the film in the viewer, gets dialogue timings plus a glitch report, and writes `qa/<film>.vlm.json` and `qa/<film>.dialogue.json`; both show on the timeline. The key is also passed to Director as `GEMINI_API_KEY`.
- **Viewer and timeline.** There are three versions per film (With text, Clean, Film), with tracks for Shots (cut detection), Dialogue, Callouts, Cards, QA and End card. Click or drag to scrub. Everything is read from `timeline.json`.
- **Editable once Director is done.** Editing locks while the agent is working on the project.
  - Drag callouts and cards to move them, and drag their edges to retime. They snap to cuts, the playhead and the ends; hold ⌥ to disable snapping. A red edge means the item crosses a cut.
  - The inspector edits text, size, rotation, doodle, glow and card copy.
  - Drag the dashed box on the video to position an item. The lettering previews live over the Clean film.
  - "+ Callout" and "+ Card" add items at the playhead. Duplicate, Delete, ⌘Z undo and Esc are all supported.
  - **Save & render** writes `overlay/cfg/<film>.json` and runs `make_ad.sh` (about 30–40 s).
  - **Use** on a take swaps it in as `films/<film>.mp4`; the old film is kept in `films/takes`.
  - Your edits are summarised to Director in your next message, so it builds on them instead of overwriting them.
- **Projects.** New (scaffolds via the plugin's `new_project.sh`) or Open any folder. The media panel and timeline live-refresh as Director writes files.

## Layout
`main.js` (settings, projects, the `media://` byte-range protocol confined to the open project, IPC) · `lib/claude.js` (CLI session) · `lib/mcp.js` (MCP config, import and handshake) · `lib/gemini.js` (VLM check) · `lib/system.js` (login-shell env, Claude detection) · `preload.js` · `renderer/` (UI) · `test/`.

## Dev self-check
`DIRECTOR_SNAPSHOT=out.png DIRECTOR_OPEN=<project> DIRECTOR_JS='…' npm start` opens a project, runs JS in the window, saves a screenshot and quits.

## License
MIT, see [LICENSE](../LICENSE).
