// Optional Google Gemini connector: a VLM second opinion on a take. Uploads the video to the Gemini Files API,
// asks for dialogue with timings plus a glitch report against the Director QA checklist, and returns JSON that the
// app writes to qa/<key>.vlm.json and qa/<key>.dialogue.json (the timeline shows both).
const fs = require("node:fs");
const path = require("node:path");

const API = "https://generativelanguage.googleapis.com";

async function api(key, url, init = {}) {
  const r = await fetch(url.startsWith("http") ? url : API + url, { ...init, headers: { "x-goog-api-key": key, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r;
}

/** Key + model check: lists the models the key can use. */
async function test(key, model) {
  try {
    const r = await (await api(key, "/v1beta/models?pageSize=200")).json();
    const names = (r.models || []).map((m) => m.name.replace("models/", ""));
    return { ok: true, models: names.length, hasModel: !model || names.includes(model) || model.endsWith("-latest") };
  } catch (e) {
    return { ok: false, error: String(e.message) };
  }
}

async function upload(key, file) {
  const size = fs.statSync(file).size;
  const start = await api(key, "/upload/v1beta/files", {
    method: "POST",
    headers: { "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start", "X-Goog-Upload-Header-Content-Length": String(size), "X-Goog-Upload-Header-Content-Type": "video/mp4", "content-type": "application/json" },
    body: JSON.stringify({ file: { display_name: path.basename(file) } }),
  });
  const url = start.headers.get("x-goog-upload-url");
  const done = await (await api(key, url, { method: "POST", headers: { "X-Goog-Upload-Command": "upload, finalize", "X-Goog-Upload-Offset": "0" }, body: fs.readFileSync(file) })).json();
  let f = done.file;
  for (let i = 0; f.state === "PROCESSING" && i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    f = await (await api(key, `/v1beta/${f.name}`)).json();
  }
  if (f.state !== "ACTIVE") throw new Error(`Gemini could not process the video (${f.state})`);
  return f;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    verdict: { type: "STRING", enum: ["pass", "fail"] },
    summary: { type: "STRING" },
    dialogue: { type: "ARRAY", items: { type: "OBJECT", properties: { start: { type: "NUMBER" }, end: { type: "NUMBER" }, speaker: { type: "STRING" }, text: { type: "STRING" } }, required: ["start", "end", "text"] } },
    issues: { type: "ARRAY", items: { type: "OBJECT", properties: { time: { type: "NUMBER" }, severity: { type: "STRING", enum: ["blocker", "major", "minor"] }, category: { type: "STRING" }, note: { type: "STRING" } }, required: ["time", "severity", "category", "note"] } },
  },
  required: ["verdict", "summary", "dialogue", "issues"],
};

function prompt(script) {
  return `You are an adversarial QA reviewer for a live-action AI-generated ad film. Watch the whole video carefully.
1. Transcribe every spoken line with start/end seconds, in its original language and native script.
2. List every problem with its timestamp:
   physics (people passing through objects, hands fusing with props, props vanishing), casting drift (faces changing,
   beautified or de-aged people, an adult who reads as a child), wardrobe drift between shots, invented text/logos/UI,
   alarming props (liquids that read as blood), unsafe or inappropriate content, garbled or missing dialogue,
   mis-spoken numbers or brand names, story not legible with sound off, no held final frame.
${script ? `3. Compare against this script and flag any missing, changed or extra lines:\n${script}\n` : ""}
verdict = "fail" if any blocker or major issue. Be specific and concise.`;
}

/** Full VLM check of one video file. */
async function vlmCheck({ key, model = "gemini-flash-latest", file, script = "" }) {
  const f = await upload(key, file);
  const r = await (await api(key, `/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ file_data: { mime_type: "video/mp4", file_uri: f.uri } }, { text: prompt(script) }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 },
    }),
  })).json();
  api(key, `/v1beta/${f.name}`, { method: "DELETE" }).catch(() => {});
  const text = r.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "{}";
  return { model, at: new Date().toISOString(), ...JSON.parse(text) };
}

module.exports = { test, vlmCheck };
