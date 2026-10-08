# QA: adversarial review of every take

Assume each take is broken until you have looked. Most failures are visible only on a dense sheet or in the transcript.

## Commands
```bash
scripts/qa_sheet.sh films/takes/<name>.mp4 qa/      # 4 fps 8x8 gridded sheet + qa/<name>.cuts
scripts/frames_at.sh <take> qa/<name>_zoom.jpg 11.5 12.8 13.6   # zoom any suspicious moment
```
For the transcript, use the video-trim MCP `transcribe_and_plan(video_path)` when it is connected; otherwise `uv run --with google-genai python scripts/transcribe.py <take>` (needs GEMINI_API_KEY). Read it against the script line by line.

## Checklist (fail on any)
1. **Physics:** people passing through desks, benches or racks; hands fusing with props; props vanishing mid-move; impossible pours.
2. **Casting drift:** a young man beautified or toned; an adult who reads as a child; age or weight drifting between shots; the hero's face changing.
3. **Wardrobe drift:** track pants turning into trousers between shots, or a missing turban, glasses or helmet. Minor drift can ship; note it.
4. **Fake text or logos:** jersey crests, sponsor text, shop signs, phone UI. Video-model text is always slop.
5. **Bad props and liquids:** paan, tea or sauce reading as blood; dangerous handling; cruelty.
6. **Dialogue:**
   - every scripted line present and in order;
   - **numbers exact** (six vs four);
   - the pun word audible;
   - a quiet line counts as missing if the transcript drops it, so check the raw clip at that time;
   - no extra invented brand claims.
7. **Children:** fully clothed, playing (not working), never in peril.
8. **Story legibility:** can you follow it with the sound off? Does the payoff land in shot 4 with a held final second?

Minor issues the person may accept (say so when shipping): small wardrobe drift, a background extra's hand, a line paraphrased without changing its meaning.

## Failure → EXTRA RULE table
| Failure seen | Fix to add before re-roll |
|---|---|
| Walked through a desk | Re-block shot 4 "on the open floor … no desk or furniture between anyone" + "solid physics: nobody walks through a desk, bench, rack or any object" |
| Young man toned or handsome | Rewrite the brief as plainly not fit (see realism.md) + "do not give him muscles, abs or a model face" |
| Adult woman reads as a child | "a grown woman of 24 with a clearly adult face and adult proportions" + "every person in this film is an adult" |
| Wrong number spoken | Phonetic spelling plus a gloss "(the number six, not four)" + "the number spoken is six (छे), never four" |
| Kids shirtless or in branded jerseys | "fully dressed in plain faded cotton T-shirts … no prints, numbers, logos or text" + colours per kid |
| Paan reads as blood | "lips faintly reddish … dry, no liquid, nothing on chin" + "no blood-red liquid, drips or stains on any face" |
| Key line too quiet or dropped | "says clearly and flatly, loud enough to cut through …" and give that line its own beat |
| Job rejected: real-person likeness | Remove the people from the image refs. Cast in text, keep only the people-free plate |

Re-roll at most twice per film, and keep every take in `films/takes/` (the rejected ones go into `04_alt-takes/` with the reason).

## Optional: Gemini VLM pass
If the person set a Gemini key, ask Gemini for a glitch report as a second opinion (`scripts/transcribe.py` with a custom instruction, or the desktop app's "VLM check" button). Treat its findings as leads and confirm them on the sheet yourself.
