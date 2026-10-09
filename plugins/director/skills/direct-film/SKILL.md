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
**A reference video is optional.** Most jobs start from a brief alone. Starting points:
- **A brief, however short** (the normal case), e.g. "15s Diwali spot for a kirana delivery app, Hinglish, funny". Fill the gaps with the defaults below and list your assumptions in one line. Ask only when a gap changes the work: exact claims, offers or legal lines are never guessed.
- **A product or brand link:** read the page to get the product, its claims (verbatim), audience, tone and brand colours; then treat it as a brief.
- **A vague idea** ("something for our app this festive season"): propose 3 directions in a short table, then continue with the one picked.
- **A reference ad:** keep its device and mandatories and change everything else (step 2 below).
- **Reference images or decks:** use them for brand look, product shape and claims, never as people references.

**Defaults when the brief doesn't say:** India; Hindi or Hinglish; 4 concepts; a 15 s film plus a 10 s end card; 16:9 (add 9:16 if it's for social); observational comedy; and an end card built from the brand name and colours. Without a logo file, set the brand name as a clean wordmark, and say so.

1. Collect what's missing (ask once, briefly):
   - the brand or subject, the product or message, and the **exact claims and mandatories**;
   - the audience and market (default India; which states or cities; for other markets, the countries and regulators), the **language and register** (Hindi, Hinglish, regional; or the market's language and dialect), the **tone**;
   - how many variations, the length (default: a 15 s film plus a 10 s end card), and the aspect ratios (16:9, 9:16, 1:1);
   - brand assets (logo, colours, fonts), any owned VO or music, and the do-nots.
2. **If there is a reference film (optional):**
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
1. Pick a style: hand-lettered marker (playful), kinetic sans (modern) or a brand font. Fonts can be **any Google Font** (`theme.font` for callouts, `theme.cardFont` for cards); for Indian scripts pick one that covers the script (motion-graphics.md lists them). The person can also change fonts in the Director app's inspector.
2. Per film, plan about 2 callouts on the spoken key lines and 1 UI/product card at the product beat.
3. Each callout sits inside one shot (use the `.cuts` file), clear of faces, at least 5% inside the edges, with `glow` on busy frames.
4. Write `overlay/cfg/<NN_slug>.json`.
5. `scripts/make_ad.sh <project> <NN_slug>` builds the overlay, the composite and the end card.
6. Look at frames at every callout, then fix and re-run.

## Phase 7: End card
Every ad can end differently. The end card is the brand's moment, so let the person shape it.
1. **Ask before you build** (one short message, your recommendation filled in, so "go" works):
   - **The look:** one of the styles in motion-graphics.md (offer-led, packshot, kinetic type, product hero, festive, app/UI), or **"match my reference"** if they attach an image of an end card or brand page they like;
   - the **font** (any Google Font, or their brand font file), **colours**, the **logo file** and any **product or pack shots**;
   - the **CTA line** and any **offer, claims and disclaimer** (exact, from the brief), the length (default 10 s) and the VO or music.
   Skip what the brief or the attachments already answer. Never wait on it twice: if they say "you pick", pick and say why.
2. **A reference image** (attached as `Attached: <path>`): match its layout, type hierarchy, palette, density and motion feel. Never copy its brand, logo, words or claims. Use their own assets (logo, packshots, font) from the attachments.
3. **Build:** if the template covers the look, fill `endcard/brand.json` (colours, `font`, logo, offer, chips, tagline, packshot lines timed to the VO, brand lines, disclaimer). If it doesn't, write a **custom `endcard/index.html`** to the contract in motion-graphics.md (same file, same render command).
4. Render with `scripts/render_endcard.sh <project>`, then check frames every 0.5 s (`scripts/frames_at.sh`): legibility, logo sharpness, nothing overlapping, the disclaimer readable long enough.
5. Put the VO or music in `audio/tail.m4a`, or leave the tail silent. If the brief has no offer, leave the offer beat out.

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
- `scripts/`: `run.py`, `qa_sheet.sh`, `frames_at.sh`, `transcribe.py`, `timeline.py`, `new_project.sh` (`--update` refreshes an older project's templates), `make_ad.sh`, `render_endcard.sh`, `fonts.py` (links any Google Font a config names; both build scripts run it), `package.sh`.
- `templates/text-overlay/`, `templates/endcard/`: variable-driven HyperFrames projects. Edit the JSON config, not the HTML; the one exception is a custom end card (Phase 7).
- `examples/lantern-bank-lite/`: one complete worked job (prompts, overlay configs, brand.json).
