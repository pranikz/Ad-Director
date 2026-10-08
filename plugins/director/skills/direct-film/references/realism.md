# Realism: casting, plates, prompts, look

The target is footage that reads as a real shoot: ordinary people, lived-in places and motivated light. It should never look like stock or AI gloss. Every rule here exists because a take failed without it.

## Casting briefs (text only; never photoreal face references)
Many video models (Seedance 2.5 among them) reject jobs whose reference images contain a photoreal face; AI Studio refunds them. So people are **written**, not referenced.

A brief is one paragraph with:
- **name, age, role, origin:** "Harbhajan Singh, 58, heavyset Sikh electrical-goods shopkeeper from Old Delhi"; "Marta, 41, broad-shouldered fishmonger from Lisbon";
- **a specific body:** heavyset, wiry, barrel-chested, frail and stooped, short and plump, lanky and bony, pregnant, uses a cane;
- **skin, hair and face specifics:** a mole, grey stubble, freckles, cauliflower ears, gap teeth, braces, a scar;
- **one or two odd, true details:** glasses on a cord, pens in the shirt pocket, a gold-capped tooth, a bandaged finger, flour on the hands, paint on the cuffs;
- **clothes as people really wear them:** faded, rolled-up, mismatched, work-worn;
- **an expression or attitude:** unhurried, frazzled, stern but quick to laugh.

Across a set, vary age, body, skin tone, gender and background. Avoid stereotypes: give people real jobs and dignity. Never write handsome, beautiful, fit, perfect or model.

**Model biases to counter explicitly:**
| Bias | Counter-text |
|---|---|
| Young men come out toned and handsome | "plainly NOT fit: lanky and bony, thin arms, narrow sloping shoulders, no muscle definition, a soft little belly, ordinary plain face" + EXTRA RULE "do not give him muscles, abs or a model face" |
| Women get beautified and de-aged | State the age twice, add "visible laugh lines, uneven skin, no makeup look" |
| A short, round adult woman reads as a child | "a grown woman of 24 with a clearly adult face and adult proportions" + EXTRA RULE "every person is an adult" |
| Kids end up shirtless or in branded jerseys | "fully dressed in plain faded T-shirts with no prints, numbers, logos or text" + a colour per kid |
| Skin gets lightened or features westernised (common with Indian casts) | Write the skin tone in every brief (deep brown, dusky, wheatish) + EXTRA RULE "keep every skin tone exactly as described — no skin lightening" |
| Everyone is the same age | Write ages 19–75 across the cast and name the age gaps |

**Casting-board stills** (optional, for approval only, never sent to the video model). Use any strong photoreal image model (AI Studio: Nano Banana 2.1, 3:4, 2K) with:
```
Unretouched documentary casting photograph, waist-up, subject facing camera at a slight three-quarter angle, standing against a plain weathered off-white plaster wall, soft natural window light from one side, shot on a 50mm lens at f/2.8. Real ordinary person, not a model: true skin texture with pores, blemishes, uneven tone, sweat sheen, stray hairs, no makeup look, no beautification. Natural colour, slight film grain. No text, no logos, no watermark. Subject: <character brief>
```

## Location plates (people-free, become Image 1)
Use AI Studio Nano Banana 2.1 (`google/nano-banana-2.1`), 16:9, 2K, JPEG, about 7 credits and 30 s each, or the equivalent in another backend. Prefix:
```
Unretouched documentary location photograph, wide 24mm lens, eye level, real lived-in place in India, natural and practical light only, honest clutter, dust and wear, slight film grain. No people. No readable text, no brand names, no logos, no watermark. Location: <location>
```
Name the city and neighbourhood, the time of day and season, and 5–8 concrete props. Say "no readable labels" for shops, pharmacies and supermarkets. For 9:16, generate the plate at 9:16.

## Film prompt template (Seedance 2.5 Pro shown: 15 s, 1080p, generate_audio true)
```
FILM: "<Title>" — <15> seconds, <16:9>, <four> shots joined by hard cuts.
REFERENCE: Image 1 = the location, <one-line location>. Match its set dressing, layout and light exactly.
CAST (play them exactly as described, keep each identical in every shot):
- <NAME>: <casting brief>
- <NAME>: <casting brief>
A third character with no reference: <brief>.        (background people are fine)

SHOT 1 (0-3s): <framing>, <physical action>. <NAME> says: "<line in native script>"
SHOT 2 (3-7s): ...
SHOT 3 (7-11s): <the product/message beat: phone pings, payment lands, the gift is opened…; screens face away>
SHOT 4 (11-15s): <payoff>. Hold on <NAME>.

<LOOK block for the tone, below>
EXTRA RULE: <one per known risk>
```
Keep it under 5,000 characters; most run 2,000–3,500. Scale the shot count with length: 3–4 for 10–15 s, 5–7 for 20–30 s. With reference images, never also send a first frame.

## LOOK blocks (paste one verbatim; set the language and region)
Every block ends with the same SOUND and RULES lines:
```
SOUND: sync-sound dialogue in <LANGUAGE> with natural <REGION> accents, lips matched to speech, real location ambience. No music, no narrator.
RULES: no on-screen text, subtitles, captions, logos or watermarks. Phone screens always face away from camera or show only a soft glow. No slow motion, no beauty lighting, no lens flares, no morphing faces or bodies, natural hands. The last second of the film is a held frame with no new action.
```
**Comedy (observational slice-of-life; used for the worked example):**
```
LOOK: live-action TV commercial shot as an observational slice-of-life comedy. ARRI Alexa 35 with vintage Cooke S4 lenses, handheld with gentle operator drift, natural and practical light only, realistic exposure with real shadows and soft highlight roll-off, subtle 35mm film grain, true-to-life skin with pores, sweat and blemishes. Performances understated and naturalistic, dry comic timing. Every person looks exactly as their CAST description: ordinary, real, not glamorous.
```
**Warm (heartfelt / emotional):**
```
LOOK: live-action film shot as an intimate observational drama. ARRI Alexa Mini LF with vintage Cooke Panchro lenses, mostly handheld close and medium shots, soft window and practical light, gentle contrast, subtle 35mm grain, true-to-life skin with pores and texture. Performances restrained: small gestures, held looks, nothing pushed. Every person looks exactly as their CAST description: ordinary, real, not glamorous.
```
**Documentary (vérité):**
```
LOOK: vérité documentary footage. Handheld 16mm-style camera that reacts late to action, available light only, slightly imperfect focus pulls, natural grain, honest colour, true-to-life skin. People behave as if no one is filming. Every person looks exactly as their CAST description: ordinary, real, not glamorous.
```
**Cinematic (premium brand film, still real):**
```
LOOK: cinematic live-action brand film. ARRI Alexa 65 with anamorphic lenses, motivated practical light with deep but natural shadows, controlled slow camera moves (dolly, slider), shallow depth of field, fine film grain, true-to-life skin with pores. Performances naturalistic and specific. Every person looks exactly as their CAST description: real, not glamorous.
```
Warm and cinematic films often need music. Keep the film's SOUND line "No music" and add the score in post, so the edit stays flexible.

## Dialogue in any language
- Write lines in the language's **native script** (Devanagari, Tamil, Arabic, Cyrillic, Japanese…). Keep brand and product names in the script they are spoken in.
- One short line per beat, 4–6 lines per 15 s, no more than about 8 words each. The key word must be spoken plainly.
- **Numbers drift** (on the worked example, "छह" came out as "चार"). Spell numbers phonetically and gloss them: "छे (the number six, not four)". Add EXTRA RULE "the number spoken is six, never four".
- A quiet key line needs "says clearly, loud enough to cut through the noise".
- Dialogue claims stay soft and true. Exact numbers go on the end card with the asterisk.
- English or no-dialogue films follow the same rules. For no dialogue, write the sound beats instead: the clunk of a power cut, a phone ping.

## Physics, props and wardrobe
- Block movement in open space: "on the open floor … with no furniture between anyone" + EXTRA RULE "solid physics: nobody walks through a desk, bench, rack or any object".
- Paan, tea, wine and sauces can read as blood. Write "dry, no liquid on the face" + EXTRA RULE "no blood-red liquid on any face".
- Products: describe them physically (shape, colour, material). The real pack shot or logo goes in post or on the end card.
- Phones and screens face away. The UI is a card added in post.
- End every film on a held frame for the overlay and end-card cut.
