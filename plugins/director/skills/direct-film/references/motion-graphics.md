# Motion graphics: callouts, cards and end card (HyperFrames)

Two variable-driven HyperFrames projects get copied into each project by `scripts/new_project.sh`:
- `overlay/` renders a **transparent** ProRes overlay per film (callouts and cards), which ffmpeg composites over the untouched footage.
- `endcard/` renders one end card (offer beat and packshot) from `brand.json`.

You edit JSON, never HTML. HyperFrames is pinned at `hyperframes@0.8.137`. The lint flags stacked lettering as `content_overlap`; that is expected and intentional.

## Overlay config: `overlay/cfg/<NN_slug>.json`
```json
{
  "dur": 15.08,
  "theme": { "ink": "#ffffff", "font": "Caveat Brush", "cardFont": "Plus Jakarta Sans",
             "card": { "bg": "rgba(255,255,255,.96)", "title": "#111827", "body": "#4b5563", "accent": "#ea580c", "icon": "#16a34a" } },
  "callouts": [
    { "t0": 1.0, "t1": 2.85, "x": 1380, "y": 400, "rot": -7, "size": 128, "glow": false,
      "lines": ["Current", "Gaya!"],
      "doodle": { "name": "plug", "dx": 330, "dy": 40, "scale": 0.9 },
      "arrow":  { "from": [150, 110], "to": [860, 560], "bend": -80 } }
  ],
  "cards": [
    { "t0": 7.0, "t1": 10.8, "x": 1220, "y": 400, "from": 80,
      "title": "Auto Sweep ✓", "body": "₹25,000 moved to FD<br>earning <em>up to 6% p.a.*</em>" }
  ]
}
```
- `x` and `y` give the callout centre in 1920×1080 pixels. A doodle's `dx`/`dy` are relative to that centre. An arrow's `from` is relative to the centre and its `to` is in absolute pixels.
- Callouts animate in this order: pop-in, line-by-line write-on, sparkle ticks, doodle draw-on, arrow, a gentle bob, then the exit. Everything gets a hand-drawn "boil" at 8 fps.
- Cards: `from` sets the slide direction (positive slides in from the right, negative from the left). `<em>` uses the accent colour.
- `theme` is optional; it defaults to white ink, Caveat Brush lettering and a white Plus Jakarta Sans card.
- **Fonts: any Google Font.** Set `theme.font` (callout lettering) and `theme.cardFont` (cards), or `"font"` in `brand.json` (the whole end card). `scripts/fonts.py` links the family before the render (`make_ad.sh` and `render_endcard.sh` run it) and stops with an error on a name Google doesn't have, so check the spelling on fonts.google.com. Offline, it keeps the fonts already linked.
  - Built in: Caveat Brush (marker, the default), Permanent Marker (bold marker), Kalam (handwritten, covers **Devanagari**), Bangers (comic), Plus Jakarta Sans (clean sans).
  - **Indian scripts need a font that covers them:** Devanagari: Kalam, Baloo 2, Mukta, Hind, Yatra One, Rozha One, Tiro Devanagari Hindi, Noto Sans Devanagari. Tamil: Baloo Thambi 2, Noto Sans Tamil. Bengali: Baloo Da 2, Hind Siliguri. Gujarati: Baloo Bhai 2, Shrikhand. Telugu: Baloo Tammudu 2. Kannada: Baloo Tamma 2. Malayalam: Baloo Chettan 2. Punjabi (Gurmukhi): Baloo Paaji 2. Check a frame: a font without the script falls back to a system font.
  - **A brand font that isn't on Google** (a .ttf/.otf/.woff2 the person attached): copy it into `overlay/assets/fonts/` or `endcard/assets/fonts/`, add an `@font-face` for it between the `fonts:start`/`fonts:end` comments in that `index.html`, and name the family in the config.
- **Projects made before fonts were configurable** run `scripts/new_project.sh <project> --update` once (it keeps configs, brand.json and assets).
- **Doodles:**
  - Food and drink: chai, sugar, tiffin, paan.
  - Money and shopping: coin, percent, cart, bag, gift.
  - Objects: bulb, bulbOff, plug, phone, camera, pill, house, car.
  - Sport and play: dumbbell, featherWeight, ball, six.
  - Symbols: heart, star, check, cross, arrowUp, clock, sparkle, note, bolt, rocket, unlock.
  - Nature: moon, leaf.
  - To add one, use a single-stroke path in a 200×200 box in the `D` map.

## Styles
- **Hand-lettered (playful, default):** Caveat Brush or Permanent Marker, white ink, doodles, sparkle ticks and arrows. Two lines, the second indented.
- **Kinetic sans (modern):** Plus Jakarta Sans, `"size": 96–120`, no doodles, and a brand colour as `ink` on dark frames.
- **Brand:** the brand's font and colours in `theme`, with cards styled like the product's UI.

## Placement rules
1. Read cut times from `qa/<take>.cuts`. A callout's `t0`–`t1` must sit inside one shot, starting at least 0.1 s after a cut and ending before the next one.
2. Time callouts to the spoken key line: appear on the word, hold for 1.4–3 s.
3. Pull gridded frames at the callout times with `scripts/frames_at.sh take out.jpg t1 t2 …`. In the 640 px preview each grid cell is 64×36, which is 192×108 at full size.
4. Place callouts in empty wall, sky, shelf or floor. **Never over a face.** Keep them clear of moving heads (check the start, middle and end of the window), and at least 96 px inside the edges.
5. Use `"glow": true` on busy or bright frames, such as a neon vest or a window.
6. Per 15 s: about 2 callouts and 1 card. Place the card at the phone-ping or payment beat.
7. Render, then check frames at every callout. Watch for overlaps with people who move into the text.

## Build
```bash
scripts/make_ad.sh <project> <NN_slug>          # overlay + composite + end card → out/with-text/
scripts/make_ad.sh <project> <NN_slug> --clean  # no overlay → out/clean/
```

## End card: `endcard/brand.json`
```json
{
  "colors": { "primary": "#2f4a91", "accent": "#ef4d07", "rule": "#3f7d3c", "offerBg": ["#ffffff", "#f2f7ff", "#e6efff"] },
  "offer": { "pill": "Lantern <b>Lite</b> Current Account", "toggle": "Auto Sweep",
             "eyebrow": "UP TO", "value": "6%", "suffix": "p.a.*",
             "chips": [ { "icon": "calendar", "title": "9-month", "sub": "tenure" } ],
             "tagline": "Small balance. <em>Serious returns.</em>" },
  "pack": { "logo": "assets/logo.png", "logoAlt": "Brand", "art": "assets/art.png", "hills": true,
            "lines": [ { "t": 4.25, "html": "This festive season, open a" }, { "t": 5.55, "html": "Lantern Lite Current Account", "accent": true } ],
            "rule": ["LIGHT ON BALANCE", "BRIGHT ON RETURNS"], "ruleAt": 8.1 },
  "disclaimer": "*T&amp;C apply.",
  "font": "Plus Jakarta Sans"
}
```
- Timing is fixed: the offer runs 0–3.9 s and the packshot 3.9–10 s. Packshot `lines[].t` should sync to the VO words. The toggle is optional (`""` hides it).
- Chip icons: calendar, rupee, unlock, check, clock, percent, bolt.
- `art` is optional; without it the copy centres. `hills: false` removes the hills.
- Put the logo in `endcard/assets/`. Use the client's master file, never a crop from a compressed video if you can help it.

Render the end card (fonts, variables and render in one step):
```bash
scripts/render_endcard.sh <project>   # → endcard/tail.mp4
```

### End-card styles (every ad can end differently)
Offer the look that fits the brand and the brief, or match the person's reference image:
| Style | What it is | How |
|---|---|---|
| **Offer-led** (the template) | Offer beat (value, chips, tagline) → packshot with logo and lines | `brand.json` |
| **Packshot only** | Logo, one CTA line and the product, no offer | `brand.json` with `"pill": ""`, no chips, `"value": ""` (or a custom card) |
| **Kinetic type** | Big words land on the VO beats, then the logo | custom `index.html` |
| **Product hero** | The pack or phone slides, turns or settles in with the CTA | custom `index.html` with the person's packshot in `assets/` |
| **Festive** | A frame of the festival's real motifs (diyas, rangoli, lanterns), correct for the region | custom `index.html`; follow the locale file's festival notes |
| **App / UI** | The app screen in a phone, one tap to the result | custom `index.html` |

### Custom end card contract
When the template can't make the look (or a reference image asks for a different layout), write `endcard/index.html` yourself as a HyperFrames composition and keep this contract so the build and the app keep working:
- The root is `<div id="root" data-composition-id="main" data-start="0" data-duration="<seconds>" data-width="1920" data-height="1080">` (1080×1920 for 9:16), and the GSAP timeline is registered as `window.__timelines["main"]`.
- Everything brand-specific still comes from `brand.json` through the `brand` variable (read it with `window.__hyperframes.getVariables()`), and the copy, claims and disclaimer stay character for character.
- Images and fonts come from `endcard/assets/`; Google Fonts go through `brand.json` `"font"` and the `fonts:start`/`fonts:end` comments in `<head>`.
- Keep a 5% safe margin, the disclaimer legible on screen for at least 2 s, and the logo from the master file.
- Render with `scripts/render_endcard.sh`, then QA frames every 0.5 s.
The worked brand config (the fictional Lantern Bank card and placeholder logo) is in `../examples/lantern-bank-lite/endcard/`.
