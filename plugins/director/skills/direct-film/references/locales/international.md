# Locale: international (index)

Read this before Phase 1 on any brief for an audience outside India. It layers international specifics on top of `storytelling.md`, `realism.md` and `qa.md`, then hands off to **one region file per market** for the calendar, language, casting, places, sensitivities and compliance. India stays the default (`india.md`); the `director-international` agent reads this file instead.

| Market | Read |
|---|---|
| United States, Canada, United Kingdom, Ireland, Australia, New Zealand | `us-uk.md` |
| European Union, plus Switzerland and Norway | `eu.md` |
| Middle East and Africa: the GCC (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman), Egypt, the Levant, Nigeria, South Africa, Kenya | `mea.md` |
| Southeast Asia: Singapore, Malaysia, Indonesia, Thailand, the Philippines, Vietnam | `sea.md` |
| A global campaign | This file plus every region it runs in. Build one master, then swap the cast, language, supers, claims and disclosures per market |

The compliance notes are a starting checklist, not legal advice. Tell the person which rules apply, and have their legal or clearance team confirm claims, disclosures and clearance before anything airs.

## 1. What works in international advertising
Effectiveness research keeps finding the same things (System1 and Orlando Wood's *Lemon* and *Look Out*; System1's yearly public tests of Cannes Lions film winners; Google's YouTube ABCDs; TikTok's creative guidance):
- **Drama beats lecture.** Ads with a character, a place and an incident build long-term memory: people talking to each other, or a shared look the audience gets. Voiceover over product shots, words on screen and wall-to-wall cutting can drive clicks this week but are forgotten. Let a scene breathe long enough for the place to land.
- **Humour is back.** Most recent US and UK Cannes film winners are funny, and funny work tests better with the public than purpose-led work. Keep it warm. Humour built on cringe or humiliation leaves a bad feeling attached to the brand.
- **Brand early and inside the story.** The product or a distinctive brand asset (a character, colour, sound or line) appears in the opening seconds as part of the action, not as a logo bolted on.
- **Hook, then pay off.** The first frame has to stop the scroll. The idea lands in the first few seconds, and the payoff arrives before the viewer can skip.
- **One clear ask.** End on one specific action, said and shown.
- **Native to the feed.** On TikTok, Reels and Shorts, real-looking people and creator-style framing beat glossy commercial polish.

Archetypes that travel (describe them; never copy a real ad or its lines):
| Archetype | Feel | Good for |
|---|---|---|
| **Absurd hero** | One heightened character talks to camera while the world around them escalates impossibly, in one unbroken flow | Personal care, snacks, soft drinks, challenger brands that need fame fast |
| **Small domestic twist** | A tiny family drama (a kid's make-believe, a parent's quiet help) where the product is the secret behind the ending | Auto, home tech, telecom, insurance, family products |
| **Problem-solved demo** | A real, slightly embarrassing everyday problem, the product doing its job on camera, the relief | D2C gadgets, apps, SaaS, health and home devices, performance social |
| **Brand-name play** | The name itself misheard, mispronounced or taken literally, run as a series | New or hard-to-say names, challengers, long-term memory |
| **Mockumentary team** | A deadpan fake documentary about a small business adopting the product | B2B SaaS, fintech, productivity tools, marketplaces |
| **Anthem montage** | Match-cuts and split screens across many people, driven by rhythm and one manifesto line | Sportswear, sponsorships, big launches; only when the brand's stance is real and long-term |
| **Collective memory** | The year's shared moments, told through everyday people's reactions and real data | Platforms, telecom, search, year-end retail |
| **Product ballet** | Fast, rhythmic, minimal close-ups and type that show many features in seconds | Tech launches, multi-feature products. On its own it fades fast, so pair it with character work |
| **Recurring character** | One character or world that comes back campaign after campaign | Long-term brand building: insurance, telecom, FMCG |
| **Creator-style** | Selfie framing, direct address, captions, a quick "three reasons" or a reaction | TikTok, Reels and Shorts performance. Always a dramatised character, never a fake customer review (section 4) |
| **Holiday short film** | A 60–120 s emotional story with a reveal and a slow cover song, released as an event | Retail, grocery and department stores at Christmas, Ramadan or Lunar New Year |

Each region file adds local archetypes, such as the UK Christmas ad, the Ramadan family film, the Thai tearjerker and the Lunar New Year reunion.

## 2. Casting across markets (what the models get wrong)
Video models default to a narrow look: young, thin, white or white-adjacent, conventionally attractive, in American suburbia. Counter it in every brief:
- **Write ethnicity, skin tone, age, body type and hair for every character,** and add EXTRA RULE "keep every skin tone, age and body exactly as described — no lightening, slimming, de-ageing or beautifying".
- **Name the community, not the continent.** Write "Korean-American, 40s", "Yoruba Nigerian, 60s", "Emirati, 30s" or "Visayan Filipina, 20s", never "Asian", "African" or "Arab". Models blend Chinese, Japanese and Korean cues, and Gulf, Levantine and North African dress.
- **No tokenism.** A line-up with one of each looks like stock photography. Cast the people who would really be in that place, then vary age, body, ability and the hero's gender across the set.
- **Disability** is under-shown, and models render aids badly (wheelchairs, prostheses and hearing aids drift). Describe the aid exactly, check it in QA, and give the character agency.
- **Older people** get rendered frail or as the joke. Cast them active and in charge.
- **No one plays another race:** no darkened skin, no prosthetic features.
- **Never reproduce real people.** No celebrity faces, voices or soundalikes. US likeness and digital-replica laws and the UK's ban on implied endorsement both apply.
- **Wrong-country details are casting errors too.** Models put American cars, plugs and houses everywhere. Write the driving side, the plugs, the housing and the street furniture into the plate and the shot, and check them in QA.

## 3. Language, dubbing and supers
- **Write dialogue in the audience's language and dialect, in its native script:** US or UK English, Latin-American or Castilian Spanish, Gulf or Egyptian Arabic, Quebec or France French.
- **Seedance sync dialogue is proven in Hindi only.** Every other language is untested, so transcript QA is mandatory. Keep a fallback: little or no dialogue, a native VO and supers.
- **Generate rather than dub when you can.** With AI it is often cheaper to re-generate a film per language than to dub one. If you must dub, avoid close-up lip sync on lines that will be versioned.
- **Build every master for versioning:** a clean (textless) version, a music-and-effects stem and the VO stem. Leave room for longer text, because German, French and Spanish supers run longer than English.
- **Right-to-left scripts** (Arabic, Hebrew, Urdu): set `dir="rtl"` in the overlay, mirror the motion so text enters from the right, use a real Arabic font, and check the numerals.
- **Disclaimers go in the language of the claim.** The FTC expects a Spanish ad to carry Spanish disclosures, and most regulators think the same way.
- **Plates:** in the plate template in `realism.md`, replace "in India" with the city and country.

## 4. AI-generated people: disclosure (check per market)
Director's films use synthetic performers, so this applies to every international job:
- **EU:** the AI Act's transparency duty (Article 50) has applied since 2 August 2026. Realistic AI-generated or manipulated images, audio or video of people, places or events ("deepfakes") must be disclosed as such. For evidently creative or fictional work the disclosure can be light, but it has to be there.
- **New York:** since June 2026, an ad that knowingly uses a "synthetic performer" (an AI-made person who looks real) must disclose it conspicuously.
- **UK:** there is no AI-label rule, but the ASA's 2026 guidance says the existing rules apply in full. A label does not fix a misleading ad, and AI must not exaggerate what a product does.
- **US (FTC):** fake reviews and testimonials are banned, AI-generated ones included. A synthetic person must never be presented as a real customer giving a real review.
- **Platforms:** Meta, TikTok and YouTube each ask advertisers to label realistic AI content, with stricter rules for political and social-issue ads. Their rules differ and change often, so check the live policy.
- **Default:** for every non-Indian market, plan an "AI-generated" or "Created with AI" super in the market's language (on the end card, or small and persistent) and confirm the wording with the person. Never let the AI cast give testimonials ("I tried it and…") as if they were real customers; play them as characters in a story.

## 5. Sensitivities everywhere (fail QA on any of these)
- Nationality, accent, religion, gender, body or class as the punchline. Humour punches up.
- Religious symbols, scripture or places of worship in product or comic contexts.
- **Maps and borders:** never show a map with borders, because disputed borders anger whole countries. Show flags only when they are exact and treated with respect.
- Children: playing, fully dressed, never in danger, and never pestering parents to buy. Nothing aimed at children for age-restricted products or for foods high in fat, sugar or salt.
- Alcohol, gambling, tobacco and vapes, weight loss, finance and health each need the brief's explicit OK and the market's rules.
- Body image: no idealised-body pressure, and no filters or AI that exaggerate a cosmetic result.
- Green claims: no vague "eco", "green" or "carbon neutral" without proof (now banned outright in the EU).
- Real wars, disasters, tragedies and protests are never a backdrop or a joke.
- Wrong-country details (section 2) and invented text or logos.

## 6. Claims (every market, then the region file)
- Substantiate before you claim. The evidence comes from the brief; never invent a statistic or a test result.
- Exact figures, prices and legal lines go on the end card only, character for character, in the market's language, legible and on screen long enough to read. Where the claim is spoken, many markets expect the disclosure spoken too.
- Comparative claims are allowed in the US, UK and EU when truthful, verifiable and like for like. Elsewhere, check before naming a rival.
- Dialogue keeps claims soft and true, as in the Indian method.

## 7. Formats and deliverables
| Placement | Shape | Length | Notes |
|---|---|---|---|
| YouTube in-stream | 16:9 | Skippable (any length): hook and brand in the first 5 s. Non-skippable: 15 s. Bumper: 6 s | Watched mostly with sound on |
| YouTube on TV screens (CTV) | 16:9 | 15–30 s | Lean-back viewing: let scenes breathe and keep supers large |
| YouTube Shorts | 9:16 | 10–30 s | Same rules as TikTok |
| TikTok | 9:16 full bleed, at least 720p | 9–30 s | Sound on. Hook in the first seconds, the proposition within about 3 s. Keep text inside the Ads Manager safe zone. TikTok suggests 3–5 creatives per ad group, so make hook variants |
| Meta Reels and Stories | 9:16, 1080×1920 | 15–30 s | Caption every line for sound-off viewers. Keep text and logos out of the top band and the bottom third (exact safe zone in Ads Manager) |
| Meta and LinkedIn feed | 4:5 or 1:1 | 6–30 s | Sound-off first, burned-in captions |
| Linear TV and streaming ad tiers | 16:9 | 30, 20, 15 and 10 s | Broadcast clearance per market (region files). Loudness: EBU R128 (−23 LUFS) in the UK and EU, ATSC A/85 (−24 LKFS) in the US |
| Cinema and long-form brand films | 16:9 or scope | 60–180 s | Holiday and launch films, cut down to 30 and 15 s |

Deliver per market: the master and its cutdowns (60 → 30 → 15 → 6), each aspect ratio, with-text and clean versions, supers and disclaimers in the market's language, the AI-disclosure version where needed, caption files (`.srt`), stems for versioning, and the claim substantiation the clearance body will ask for.

## 8. Worked example
There is no international worked job yet. `../../examples/lantern-bank-lite/` (8 Hindi comedy spots for an Indian bank) shows the full method; swap in the region file's cast, places, language and compliance.

## Sources (checked October 2026; re-check before relying on any rule)
- Storykit, "10 creative video advertising examples" (storykit.io/blog/video-advertising-examples).
- System1 and Orlando Wood on right-brain features (character, place, dialogue), and System1's analyses of Cannes Lions film winners (humour in most 2024 US/UK winners; craft, humour and story topped the 2026 tests).
- Google, "Creative best practices for YouTube ads" (the ABCDs). TikTok Ads, "Creative best practices for performance ads". Meta Ads Manager specs for Reels safe zones.
- FTC Endorsement Guides (2023) and the Rule on Consumer Reviews and Testimonials (2024). New York General Business Law §396-b (synthetic performers, in force June 2026).
- ASA/CAP guidance on AI-generated content (2026), the harmful gender stereotypes rule (2019), and the UK less-healthy food advertising restrictions (in force 5 January 2026).
- EU AI Act Article 50 (applies from 2 August 2026, unchanged by the Digital Omnibus, Regulation (EU) 2026/1744). Directive (EU) 2024/825 on empowering consumers for the green transition (applies from 27 September 2026).
- UAE Media Council Advertiser Permit (2025); Saudi GAMR Mawthooq licence; SAMA rules for financial advertising; ARCON (Nigeria) directive on foreign models and voice-overs (2022).
- ASAS (Singapore Code of Advertising Practice), Ad Standards Council (Philippines), BPOM Regulation 7/2026 (Indonesia), Vietnam's Law on Advertising (2012).
