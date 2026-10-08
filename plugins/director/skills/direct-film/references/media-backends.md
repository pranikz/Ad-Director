# Media backends: any media MCP (AI Studio MCP and Higgsfield MCP are documented here)

## 1. Discover what's connected
Look at the connected MCP tools before planning. You need up to four capabilities:
| Need | Look for | Used for |
|---|---|---|
| Text → image (photoreal) | `generate`/`text-to-image` tools; model lists with "image" | People-free location plates, optional casting board |
| Reference/image → video **with native audio**, multi-shot, 10–30 s | "reference-to-video", "image-to-video", `generate_audio`, `duration` up to 15+ | The films |
| TTS / music (optional) | "tts", "music", "voice" | End-card VO and score when the client has none |
| Transcription / VLM (optional) | video-trim `transcribe_and_plan`, Gemini | QA |

If a server exposes a model catalog (`find_models`, `list_models`), read it, compare costs, and say which model you'll use and why. When the person has named a model or said "let it rip", go ahead; otherwise ask once.

**Picking the film model.** Rank by: native sync dialogue in the target language, multi-shot within one generation, 15 s or more at 1080p, reference-image support, realism, then cost.
- **Shipped and proven:** Seedance 2.5 Pro (`byteplus/seedance-2.5` on AI Studio). It covers 4–30 s, 1080p, `image_urls` refs, `generate_audio`, and Hindi dialogue that is close to word-perfect.
- **Alternatives:**
  - Kling V3 Pro t2v: multi-shot, audio, up to 15 s.
  - Veo 3.1: very good dialogue, but 8 s maximum, so stitch two shots.
  - Wan 3.0 reference: up to 30 s.
  - MiniMax H3 Max reference: cheap, 5–15 s.
- **If no model can do dialogue:** generate silent, then add TTS. Lip-sync stays loose, so prefer voice-over-led stories.

## 2. AI Studio MCP (Galleri5 AI Studio; MCP `aistudio`, package `galleri5/aistudio-mcp`, needs an account)
**Models used on the shipped job:**
| Use | Model path | Settings | Cost |
|---|---|---|---|
| Location plate / casting still | `google/nano-banana-2.1` | 16:9 (plates), 3:4 (cast), 2K, jpeg | 7 cr, ~30 s |
| Film | `byteplus/seedance-2.5` | `ratio 16:9`, `resolution 1080p`, `duration 15`, `generate_audio true`, `image_urls [plate]` | 834 cr per 15 s, 5–10 min |

Other text-to-image options on AI Studio: Ideogram 4.5 (best for text, but text belongs in post anyway), GPT Image 2.5, Z-Image Turbo (1 cr, drafts).

**Parallel runner.** Use this rather than MCP calls for batches, because `get_result(wait=…)` blocks the single MCP process:
```bash
uv run --with "git+https://github.com/galleri5/aistudio-mcp" python scripts/run.py jobs.json OUTDIR --quote   # price only
uv run --with "git+https://github.com/galleri5/aistudio-mcp" python scripts/run.py jobs.json OUTDIR           # spend + download
```
- A field value of `"@plate_name"` chains an earlier job's output URL, so no upload is needed.
- Up to about 12 jobs ran concurrently in practice (stills about 30 s, films 5–10 min each).

**Pitfalls:**
- **Auth/host.** Tokens live in `~/.aistudio-mcp.json`, one per org. If calls 401 with "Invalid or revoked API token", check whether `AISTUDIO_API` points at a preview backend; prod is the default. The runner inherits the shell's environment, not the MCP's.
- **Likeness filter.** "Your request was flagged — real person's likeness" means a photoreal face is in the refs. Remove the people and cast in text. The job is refunded.
- **Never combine** `first_frame_image` with `ratio` (that returns a 400).
- **Spending is real.** `generate` needs `confirm_credits` equal to the quote, and the runner does that per job. Show the batch total from `--quote` first.

## 3. Higgsfield MCP (hosted, OAuth)
- **Setup:** `claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp`. Sign in once from Claude Code: run `claude`, type `/mcp` and choose higgsfield. The Director app's onboarding does the add step and shows the status from `claude mcp list`.
- **Tools** (per Higgsfield's docs at the time of writing; confirm with the server's own tool list):
  - `generate_image`, `generate_video`;
  - `create_character` and `list_characters` for consistent recurring people;
  - `get_generation_status`.
- **Models** include Soul (character consistency), Veo, Kling, Seedance, Nano Banana and Flux. Pick per film from what the server reports.
- **Casting:** consistent characters (`create_character`) are the natural way to keep a hero identical across takes. Still write the casting brief in text, and never build a character from a real person's photos.
- **Sign-in:** if a call fails with an auth error, ask the person to re-run `/mcp` in Claude Code to sign in. You cannot complete OAuth for them.
- **Credits:** pricing and free-tier credits change, so quote from the server or Higgsfield's pricing page, never from memory.

## 4. Other media MCPs (fal, Replicate, Runway, Luma, …)
Follow the same flow:
1. List models.
2. Read the input schema.
3. Quote (if the server can price).
4. Submit in parallel tool calls.
5. Poll with the server's status tool.
6. Download into `films/takes/`.

Map the fields: prompt goes to `prompt`; the plate goes to its image-reference field; set duration, aspect and resolution, and the audio flag if one exists. Keep job names `NN_slug_vK` so the timeline and package steps find them.

## 5. Gemini (optional VLM and transcription)
`scripts/transcribe.py` (`uv run --with google-genai`, needs `GEMINI_API_KEY`) returns timestamped dialogue in its native script. The desktop app adds a "VLM check" that asks Gemini for glitches, casting drift, invented text and a script diff. Either is a second opinion: the primary check is Claude looking at the contact sheet.
