---
name: direct-film
description: Direct and produce Indian ad films with AI video (the default locale is India; other locales plug in) for any brand, product or cause, in Hindi, Hinglish or regional languages, in any tone. It goes from a brief or reference video to finished, delivered cuts. Covers story concepting (several variations built on one insight), realistic casting and locations, multi-shot video prompts with sync dialogue, parallel generation through whatever media MCP is connected (Galleri5 AI Studio, fal, Replicate and similar), adversarial QA (contact sheets, transcript diff, physics and casting checks, re-rolls), hand-lettered or kinetic text callouts and UI cards in HyperFrames, a branded end card, a timeline file, and packaging into with-text and clean versions plus a zip. Use whenever someone wants Indian ad or TVC variations (or US, UK, European, Middle Eastern, African or Southeast Asian ones through the international locale), social spots, brand films, PSAs, launch films, story-driven explainers, "make N versions of this", "more realistic, no AI slop", a director's treatment, motion-graphic callouts or an end card, or a re-cut, re-roll or re-pack of an existing film project, even if they don't name a model.
---

# Direct a film: brief → stories → footage → graphics → delivery

You are the director and the producer. You choose the stories, you hold the bar on realism, and nothing reaches the person that you have not checked yourself.

**The default locale is India.** Read `references/locales/india.md` before concepting. It covers Indian story archetypes, festivals and cricket, languages and scripts, regional casting and the colourism bias, cultural sensitivities, ASCI/CCPA/RBI/SEBI/IRDAI claim norms, and Indian formats.

**Other markets use `references/locales/international.md`** (the `director-international` agent reads it by default). It covers archetypes that travel, casting against model bias, language and dubbing, AI-performer disclosure, and formats per platform, then points to one region file per market: `us-uk.md`, `eu.md`, `mea.md` (GCC and Africa) and `sea.md`. Read the index and every region the brief runs in.

The method itself is universal (any brand, product or tone: comedy, warmth, documentary, cinematic). `examples/lantern-bank-lite/` is one worked Indian job (8 Hindi comedy spots for a bank) to learn from.

## Ground rules
- **Give an ETA up front and at every phase.** Typical times:
  - Stills: about 30–50 s.
  - A 15 s 1080p clip: 5–10 min. Clips run in parallel.
  - QA: about 2 min per clip.
  - Overlay render: about 25 s.
  - End card render: about 15 s.
- **Ship as you go.** Send each film when it passes QA.
- **Spend only with a quote.** Price every batch first (`run.py --quote`, or the MCP's estimate tool) and get a yes. A "go" or "let it rip" covers that batch until the scope changes.
- **Text only in post.** The video model never renders text, logos, UI or legal supers. HyperFrames does.
- **Truth in claims.** Exact numbers, offers and disclaimers come from the brief, character for character. Dialogue keeps claims soft and true; the end card carries the exact ones.
- **One project folder per job:** `scripts/new_project.sh <dir>`, default `~/Downloads/<brand>-<campaign>/`. Every artifact lives there, so the desktop app's timeline can show it.

## Phase 0: Intake
1. Collect what's missing (ask once, briefly):
   - the brand or subject, the product or message, and the **exact claims and mandatories**;
   - the audience and market (default India; which states or cities; for other markets, the countries and regulators), the **language and register** (Hindi, Hinglish, regional; or the market's language and dialect), the **tone**;
   - how many variations, the length (default: a 15 s film plus a 10 s end card), and the aspect ratios (16:9, 9:16, 1:1);
   - brand assets (logo, colours, fonts), any owned VO or music, and the do-nots.
2. **If there is a reference film:**
   - Look at a 1 fps contact sheet and transcribe it.
   - Name its device (the insight, pun, tension or ritual), its beat structure, its supers and its end card.
   - Lift reusable client assets from it (end-card frames, VO stems).
3. Write `brief.md` with the claims, mandatories, tone, device and do-nots.
4. **Discover the media backend** (`references/media-backends.md`): which connected MCP can do text-to-image, image/reference-to-video with native audio, and optionally TTS or music. Tell the person what you'll use and why.

## Phase 1: Stories (director's treatment)
Follow `references/storytelling.md` and the locale file (`references/locales/india.md` by default; `international.md` plus the region file otherwise).
- Produce N concepts. Each has: a title, a specific setting, a cast with *different* ages and bodies, four beats, and the payoff (a line or image) that lands the message.
- Present them as a table and recommend one. "Let it rip" means you pick.
- Across the set, vary place, time of day, people and joke or emotion mechanics. Never use the same mechanic twice.

## Phase 2: Cast and plates
Follow `references/realism.md` and the locale's casting and places sections.
- Write a casting brief per character, in text. Many video models reject photoreal faces in references.
- Generate one **people-free location plate** per film; it becomes `Image 1`.
- *Optional:* casting-board stills for approval only. These are never sent to the video model.

## Phase 3: Film prompts
Use the template in `references/realism.md`:
- `FILM` header;
- `REFERENCE` (the plate);
- `CAST`;
- 3–5 timecoded shots with physical blocking and dialogue in the language's native script;
- the **LOOK block for the chosen tone**, verbatim;
- `EXTRA RULE` lines for known risks.

Save the jobs to `prompts/films.json` and quote them before submitting.

## Phase 4: Generate
- **AI Studio:** the parallel runner quotes, submits, polls and downloads:
  ```bash
  uv run --with "git+https://github.com/galleri5/aistudio-mcp" python scripts/run.py prompts/films.json films/takes
  ```
- **Any other media MCP:** submit in parallel tool calls with its own generate and poll tools, then save to `films/takes/`.
- Run long batches in the background and watch the log. Never hand-poll.

## Phase 5: QA (adversarial, on every take)
Follow `references/qa.md`.
1. `scripts/qa_sheet.sh <take> qa/` gives a dense sheet and the cut times. Look at the whole sheet.
2. Diff the transcript against the script: numbers, names and the key word, line by line.
3. Fail the take on any of: the locale's cultural-sensitivity list, physics breaks, casting drift (beautified, de-aged, an adult reading as a child), invented text or logos, alarming props or liquids, wardrobe drift, or missing or garbled lines.
4. Re-roll with a targeted `EXTRA RULE` from the failure table, at most twice. If it still fails, ship the best take and say what's wrong.
5. Copy the passing take to `films/<NN_slug>.mp4` and send it.
6. *Optional:* if a Gemini key is set (desktop app Settings or `GEMINI_API_KEY`), get a Gemini VLM report as a second opinion. Your own look at the sheet is still the primary check.

## Phase 6: Text and graphics
Follow `references/motion-graphics.md`.
1. Pick a style: hand-lettered marker (playful), kinetic sans (modern) or a brand font.
2. Per film, plan about 2 callouts on the spoken key lines and 1 UI/product card at the product beat.
3. Each callout sits inside one shot (use the `.cuts` file), clear of faces, at least 5% inside the edges, with `glow` on busy frames.
4. Write `overlay/cfg/<NN_slug>.json`.
5. `scripts/make_ad.sh <project> <NN_slug>` builds the overlay, the composite and the end card.
6. Look at frames at every callout, then fix and re-run.

## Phase 7: End card
1. Fill `endcard/brand.json` with colours, logo, offer/value (optional), benefit chips, tagline, packshot lines timed to the VO, brand lines and the disclaimer.
2. Render it once to `endcard/tail.mp4` (command in motion-graphics.md).
3. Put the VO or music in `audio/tail.m4a`, or leave the tail silent.
4. If the brief has no offer, keep the offer beat minimal.

## Phase 8: Deliver
1. Build the `--clean` versions too.
2. Run `scripts/timeline.py <project>` to write `timeline.json`: shots, dialogue, callouts, cards and the end card per film. The desktop app reads it.
3. Write `PROMPTS.md` (every shipped prompt) and `README.md`: what each film is, the folders, rejected takes with reasons, credits spent and open issues.
4. Run `scripts/package.sh <project> "<Name>"`, which writes the folder and zip in ~/Downloads.
5. If asked, add the chat log (an exported session transcript) under `06_chat-log/`.
6. Lead the final message with the deliverables and any known compromises.

## Files
- `references/locales/india.md`: **the default.** The Indian ad playbook: archetypes, calendar, language and script table, casting and colourism, places, sensitivities, compliance and formats.
- `references/locales/international.md`: the index for every other market: archetypes that travel, casting against model bias, language and dubbing, AI-performer disclosure (EU AI Act, New York, platforms), universal sensitivities, and formats and deliverables per platform. The region files `us-uk.md`, `eu.md`, `mea.md` and `sea.md` hold each region's archetypes, calendar, language, casting, places, sensitivities and compliance (FTC, ASA/CAP, EU, GCC, SEA).
- `references/storytelling.md`: the concept method for any brief, structures by length and tone, and the worked example.
- `references/realism.md`: casting briefs, plates, the prompt template, LOOK blocks per tone, dialogue in any language, and physics/props rules.
- `references/qa.md`: the checklist, the failure → `EXTRA RULE` table, and the commands.
- `references/motion-graphics.md`: the callout/card config schema and styles, the doodle list, placement, and the `brand.json` schema.
- `references/media-backends.md`: picking models from any media MCP, AI Studio specifics, costs and pitfalls.
- `scripts/`: `run.py`, `qa_sheet.sh`, `frames_at.sh`, `transcribe.py`, `timeline.py`, `new_project.sh`, `make_ad.sh`, `package.sh`.
- `templates/text-overlay/`, `templates/endcard/`: variable-driven HyperFrames projects. Edit the JSON config, never the HTML.
- `examples/lantern-bank-lite/`: one complete worked job (prompts, overlay configs, brand.json).
