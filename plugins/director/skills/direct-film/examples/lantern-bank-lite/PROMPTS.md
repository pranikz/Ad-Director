# Lantern Bank Lite Current Account (fictional example): film prompts

These are the exact prompts behind 8 shipped films for a fictional bank, Lantern Bank, and its Lite Current Account (an Auto Sweep account that moves idle balance into an FD). The brand is invented; the films, prompts and fixes are real. Each film used the same two-step pipeline.

1. **Location plate:** one still, **Nano Banana 2.1** (`google/nano-banana-2.1`), 2K, 16:9, JPEG. It has **no people in it**, which matters because Seedance rejects photoreal faces in reference images.
2. **Film:** **Seedance 2.5 Pro** (`byteplus/seedance-2.5`), 1080p, 16:9, 15 s, `generate_audio: true`. The location plate goes in `image_urls` and is referred to as *Image 1*. The cast is written out in text.

## What makes it look real
- **Cast written like a casting brief, not a model card:** age, body type (heavyset, wiry, barrel-chested, frail), skin, hair, one or two odd specifics (a gold-capped tooth, glasses on a cord, a bandaged finger, flour on the hands), and clothes worn the way people really wear them.
- **A specific, lived-in location** that names the city and neighbourhood, and the plate is generated *empty* first. The film then matches its set dressing and light.
- **Shot-by-shot blocking with timecodes** (four shots, hard cuts), and every action is physical and concrete.
- **Dialogue in Devanagari**, short, one line per beat. Spell numbers phonetically (छे, not छह).
- **The shared look block below:** observational slice-of-life, Alexa 35 and Cooke S4, handheld, practical light only, film grain, pores and sweat. No music, no beauty light, no slow motion, no on-screen text, and phone screens always face away from camera.
- **Extra rules wherever a take failed:** solid physics (nobody walks through furniture), every adult reads as an adult, kids in plain unbranded tees, no red liquid on faces, a young man who is not ripped.

## Shared LOOK block (appended to every film prompt)

```
LOOK: live-action Indian TV commercial shot as an observational slice-of-life comedy. ARRI Alexa 35 with vintage Cooke S4 lenses, handheld with gentle operator drift, natural and practical light only, realistic exposure with real shadows and soft highlight roll-off, subtle 35mm film grain, true-to-life skin with pores, sweat and blemishes. Performances understated and naturalistic, dry comic timing. Every person looks exactly as their CAST description: ordinary, real, not glamorous.
SOUND: sync-sound dialogue in Hindi with natural regional Indian accents, lips matched to speech, real location ambience. No music, no narrator.
RULES: no on-screen text, subtitles, captions, logos or watermarks. Phone screens always face away from camera or show only a soft glow. No slow motion, no beauty lighting, no lens flares, no morphing faces or bodies, natural hands. The last second of the film is a held frame with no new action.
```

## Location plate prompt prefix (Nano Banana 2.1)

```
Unretouched documentary location photograph, wide 24mm lens, eye level, real lived-in place in India, natural and practical light only, honest clutter, dust and wear, slight film grain. No people. No readable text, no brand names, no logos, no watermark. Location: <location>
```

## Casting still prompt prefix (Nano Banana 2.1, 3:4; used for the casting board, not fed into Seedance)

```
Unretouched documentary casting photograph, waist-up, subject facing camera at a slight three-quarter angle, standing against a plain weathered off-white plaster wall, soft natural window light from one side, shot on a 50mm lens at f/2.8. Real ordinary Indian person, not a model: true skin texture with pores, blemishes, uneven tone, sweat sheen, stray hairs, no makeup look, no beautification. Natural colour, slight film grain. No text, no logos, no watermark. Subject: <character>
```

---

## 01 · Current Gaya

**Location plate (Image 1):** a tiny 8x10 ft electrical goods shop in Bhagirath Palace, Old Delhi, at dusk. Walls stacked floor to ceiling with plain cardboard switch boxes, coils of red and yellow wire, circuit breakers, hanging LED bulbs; a glass display counter with a steel glass of chai and a wooden stool behind it; a framed devotional picture; through the open shutter a narrow lane with a dense tangle of overhead electric wires and other cramped shops glowing with tube lights.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: "Current Gaya" — 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the tiny electrical goods shop in Old Delhi's Bhagirath Palace at dusk with the tangled overhead wires in the lane outside. Match its set dressing, layout and light exactly.
CAST (play them exactly as described, keep each identical in every shot):
- BHAJI: Harbhajan Singh, 58, heavyset Sikh electrical-goods shopkeeper from Old Delhi with a big round belly, grey-white beard neatly rolled under the chin, small navy blue turban, thick reading glasses hanging on a black cord around his neck, half-sleeve cream terry-cotton shirt with two pens in the pocket, steel kara on wrist, a mole on his left cheek, deep laugh lines, tired kind eyes, unhurried calm expression.
- CHHOTU: Chhotu, 19, very skinny shop helper from Bihar, dark skin, sharp cheekbones, patchy thin moustache, oiled side-parted hair, oversized faded maroon T-shirt with a cracked blank print, a cloth bandage on one finger, anxious wide-eyed expression.

SHOT 1 (0-3s): Wide, handheld, from inside the lane at dusk: cramped electrical shops glowing with tube lights and hanging bulbs, overhead wire tangle. A loud CLUNK and the entire lane blacks out at once. A collective groan. A neighbouring shopkeeper off-screen shouts: "लो, फिर करंट गया!"
SHOT 2 (3-7s): Medium inside Bhaji's shop, near-dark. Chhotu fumbles his phone torch on, the beam swinging over wire coils, panicking: "भाजी, सब बंद हो गया!" Behind the counter Bhaji sits unbothered on his stool, his face lit only by the soft glow of his own phone.
SHOT 3 (7-11s): Close-up on Bhaji. A soft notification ping. The corners of his moustache lift slightly. Without looking up he says, calm: "सब बंद नहीं होता, छोटू। करंट अकाउंट चालू है... कमा भी रहा है।"
SHOT 4 (11-15s): Wide from the lane looking into the shop: a generator coughs to life next door and the tube lights flicker back on one by one down the lane. Chhotu stares at Bhaji, confused: "ये कौन सा अकाउंट है?" Bhaji sips chai from a steel glass and says: "लाइट वाला।" Hold on Bhaji, deadpan.
```

---

## 02 · Light Le

**Location plate (Image 1):** a traditional textile wholesale shop in Surat during Diwali season. White mattress gaddi floor seating with round bolsters, shelves of saree and fabric bolts in every colour stacked to the ceiling, marigold torans over the entrance, a small brass diya on a low wooden counter, tube lights and a ceiling fan, cardboard parcels tied with twine on the floor.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: "Light Le" — 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the traditional Surat textile wholesale shop in Diwali season: white gaddi floor seating, fabric bolts to the ceiling, marigold torans. Match its set dressing, layout and light exactly.
CAST (play them exactly as described, keep each identical in every shot):
- MEENAL: Meenal Shah, 33, Gujarati textile shop owner, short and plump, dusky wheatish skin with dark under-eye circles, round face, thick black-rimmed spectacles, hair in a messy bun with a pencil stuck through it, small nose pin, faded mustard cotton kurta with sleeves pushed up, holding a cheap grey calculator, stressed but sharp expression.
- MUNIM-JI: Pareshbhai, 74, frail thin old munim (shop accountant), bald head with a fringe of white hair, large ears, very thick black-framed glasses, white khadi kurta, lips faintly reddish from paan (dry, no liquid, nothing on chin or mouth corners), sitting cross-legged holding a red cloth-bound ledger, dry unimpressed expression.
A third character with no reference: the SUPPLIER, a lanky impatient man in his forties with a pencil moustache and a faded checked shirt.

SHOT 1 (0-4s): Medium, festive rush in the shop, customers and parcels around. The Supplier slaps an invoice on the low counter in front of Meenal: "दिवाली है, बेन। पूरा पेमेंट आज ही।" Meenal freezes, calculator in hand, and turns to Munim-ji: "पैसा तो FD में पड़ा है..."
SHOT 2 (4-7s): Close-up on Munim-ji sitting cross-legged on the white gaddi, jaw working slowly on paan, mouth clean and dry, eyes never leaving his red ledger. A beat of silence, then he says clearly and flatly, loud enough to cut through the shop noise: "लाइट ले।"
SHOT 3 (7-11s): Insert-to-medium: Meenal taps her phone twice, screen facing away from camera. A beat later the Supplier's phone pings in his shirt pocket. He checks it, eyebrows rise, and he grudgingly folds his hands: "हो गया।"
SHOT 4 (11-15s): Two-shot, Meenal and Munim-ji. Meenal exhales and laughs in relief. Munim-ji turns a ledger page and, deadpan without looking up: "FD में था... फँसा थोड़ी था।" Hold on Munim-ji.

EXTRA RULE: no blood-red liquid, drips or stains on any face.
```

---

## 03 · Light Weight

**Location plate (Image 1):** a cramped basement gym in East Delhi with a low ceiling, buzzing tube lights, rusty iron weight plates, home-welded benches and a squat rack, cracked mirrors with peeling stickers, faded posters of wrestlers, a wooden front desk with a thick register book and a plastic stool, a small Hanuman picture, worn rubber floor mats.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: "Light Weight" — 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the cramped East Delhi basement gym: low ceiling, buzzing tube lights, rusty plates, cracked mirrors, wooden front desk. Match its set dressing, layout and light exactly.
CAST (play them exactly as described, keep each identical in every shot):
- PEHALWAN-JI: Balwant Yadav, 63, ex-akhada wrestler who now owns a basement gym, short and barrel-chested with a big round belly and thick hairy forearms, cauliflower ears, shaved head with grey stubble, huge white handlebar moustache, white sleeveless cotton vest, maroon track pants, red sacred thread on wrist, thin gold chain, amused squinting expression.
- ROHIT: Rohit, 22, a nervous first-week gym beginner who is plainly NOT fit: lanky and bony with thin arms, narrow sloping shoulders, no muscle definition at all, a soft little belly, ordinary plain face, pale wheatish skin with acne on his cheeks, gelled spiky hair, oversized neon green stringer vest hanging off bony shoulders, wired earphones around his neck, nervous strained expression.
A third character with no reference: the SPOTTER, a beefy trainer in his late twenties in a tight black T-shirt.

SHOT 1 (0-4s): Side-on at bench height: Rohit lies on the bench, thin arms shaking, pressing a bar with two small plates straight up above his chest (the bar stays above his chest, never near his face) while the Spotter stands behind his head yelling: "उठा! लाइट वेट है!" The bar wobbles.
SHOT 2 (4-7s): Medium at the front desk: Pehalwan-ji counts a fat rubber-banded bundle of membership cash, glances over at Rohit and slowly shakes his head. His phone on the desk pings and glows; he looks at it and a grin spreads under the moustache.
SHOT 3 (7-11s): Rohit racks the bar with a clang, gasping, sits up and calls across the gym: "पहलवान जी, आप भी कुछ उठाओगे?"
SHOT 4 (11-15s): Wide on the open gym floor beside the plate rack, with no desk or furniture between anyone: Pehalwan-ji is already standing next to the rack. He bends, casually picks up a 20 kg plate from the floor with one hand and hangs it on the rack peg, saying: "बेटा, मेरा बैलेंस लाइट है... कमाई हैवी।" Rohit, sitting on the bench nearby, stares with his jaw dropped. Hold on Rohit.

EXTRA RULE: Rohit must stay skinny, untoned and un-handsome in every shot; do not give him muscles, abs or a model face.
EXTRA RULE: solid physics: nobody walks through a desk, bench, rack or any object; people move around furniture.
```

---

## 04 · Light Kam Hai

**Location plate (Image 1):** a North Indian wedding lawn late at night after the guests have left: canopy of marigold strings and warm fairy lights, round tables with crumpled white covers, scattered plastic chairs, an ornate floral stage, a DJ console with speakers, paper plates and petals on the grass, some lights still on.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: "Light Kam Hai" — 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the wedding lawn with its marigold and fairy-light canopy, round tables, floral stage and DJ console (full of guests in shots 1-2, emptied out in shots 3-4). Match its set dressing, layout and light exactly.
CAST (play them exactly as described, keep each identical in every shot):
- BUNTY: Bunty, 38, wedding photographer, very tall and wiry, long black hair with grey streaks in a low ponytail, goatee, deep-set tired eyes, sweaty forehead, black polo shirt and black cargo trousers, two DSLR cameras crossed on body straps, gaffer tape wrapped on his wrist, frazzled half-grin.
- PINKY: Pinky, a grown woman of 24 with a clearly adult face and adult proportions, wedding photographer's assistant, short and round, dark curly hair tied up messily, metal braces on her teeth, oversized black hoodie with sleeves rolled, gripping a big LED light panel on a stand, energetic expression.
A third character with no reference: CHACHA, a large jolly moustached uncle in a gold sherwani and safa, slightly tipsy.

SHOT 1 (0-4s): Handheld into a packed North Indian wedding dance floor at night, dhol pounding, marigolds and fairy lights, guests dancing. Bunty shoots, squinting at his camera's display, and yells over the noise: "पिंकी! लाइट कम है! लाइट!" Pinky sprints through the crowd with the LED panel.
SHOT 2 (4-7s): Chacha grabs Bunty by the shoulders, beaming: "पेमेंट कल ले लेना, आज नाच!" and drags him onto the dance floor; Bunty dances awkwardly, clutching both cameras.
SHOT 3 (7-11s): 3 a.m., the same lawn now empty: crumpled table covers, scattered plastic chairs, petals on the grass, a few fairy lights still on. Bunty sits on a DJ speaker eating a cold jalebi from a paper plate. His phone pings; its soft glow lights his tired face and he smiles.
SHOT 4 (11-15s): Pinky slumps down next to him, hugging the LED panel: "सर, पेमेंट आया?" Bunty, mouth full, shrugs: "आज लाइट कम थी... कमाई नहीं।" Pinky laughs. Hold on the two of them.

EXTRA RULE: every person in this film is an adult; Pinky looks like a 24-year-old woman, never like a child.
```

---

## 05 · Light Chai

**Location plate (Image 1):** a roadside chai tapri on a corner of a Mumbai bus depot at dawn: dented aluminium kettles on a kerosene stove, glass tumblers in a wire rack, unlabelled glass biscuit jars, a cracked wooden bench, a wet road, sodium streetlight fading into blue dawn, steam.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the dawn chai tapri at the Mumbai bus depot. Match its set dressing, layout and light exactly.
CAST:
- ANNA: Murugan, 56, Tamil tea-stall owner in Mumbai, wiry and very dark-skinned, grey stubble, thick grey moustache, three stripes of vibhuti on his forehead, checked lungi folded up at the knee, faded white vest, a towel over one shoulder, one gold-capped front tooth, fast sure hands.
- AUTO-WALA: a chubby young auto-rickshaw driver with a bushy beard in a khaki uniform.
- GIRL: a tall lean college student with short cropped hair, a nose ring and a backpack.
- UNCLE: a bony old man in a monkey cap and a sweater vest.

SHOT 1 (0-4s): Dawn rush at the tapri, steam everywhere. The Auto-wala leans in: "अन्ना, एक लाइट चाय!" The Girl right behind him: "मेरी शक्कर लाइट!"
SHOT 2 (4-8s): The Uncle, sheepish, holding out his glass: "अन्ना, कल का उधार... लाइट ले ना।" Anna laughs and does the long show-off pour, tea arcing a metre from kettle to glass.
SHOT 3 (8-11s): Close on Anna: the phone in his vest pocket pings and glows through the cloth. He glances down, and the gold tooth flashes in a grin.
SHOT 4 (11-15s): Anna wipes a glass with his towel, unhurried, and says: "यहाँ सब लाइट चलता है... बस कमाई फुल।" Hold on Anna.
```

---

## 06 · Bad Light

**Location plate (Image 1):** a narrow Mumbai chawl courtyard at dusk: three-storey chawl with long balconies and laundry lines, a chalk-drawn wicket on the wall, a plastic chair, a tiny sports-goods shop at the corner with bats and tennis balls hanging, tube lights just flickering on.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the Mumbai chawl courtyard at dusk. Match its set dressing, layout and light exactly.
CAST:
- KAKA: Vasant, 61, owner of the corner sports-goods shop who umpires the evening gully cricket, very short and plump with a round belly, bald on top with white hair at the sides, thick black-framed spectacles, white half-sleeve shirt tucked into grey trousers, a whistle on a string around his neck.
- THE BOYS: five neighbourhood boys aged about 12-14, all fully dressed in plain faded cotton T-shirts and shorts with no prints, numbers, logos or text: one scrawny with oversized glasses and a gap tooth holding the bat (plain blue T-shirt), one tall and gangly bowler (plain yellow T-shirt), one round-faced (plain grey T-shirt).

SHOT 1 (0-3s): The gangly boy runs in to bowl a tennis ball; Kaka, standing as umpire, throws both arms up and blows his whistle: "बैड लाइट! मैच ख़त्म!"
SHOT 2 (3-7s): The boys crowd him, protesting in chorus: "काका, अभी तो छे भी नहीं बजे! (six o'clock — the number six, not four)"
SHOT 3 (7-11s): Kaka's phone pings in his shirt pocket. He looks at it, pushes his glasses up, and smiles: "छे बजे न बजे... मेरा पैसा तो छक्के मार रहा है। (again the number six)"
SHOT 4 (11-15s): Behind his back the scrawny boy whacks the ball high over the balconies; the boys scream "छक्का!" and Kaka turns, shaking his head, grinning. Hold on Kaka.

EXTRA RULE: every child is fully clothed in plain unbranded clothes; the number spoken is six (छे), never four.
```

---

## 07 · Light Lunch

**Location plate (Image 1):** a cramped home kitchen in an old Pune wada run as a tiffin service at noon: stacks of steel tiffin carriers, a big pressure cooker on a gas stove, chapati dough on a steel plate, cloth delivery bags, window light on a worn stone floor.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the Pune wada tiffin kitchen at noon. Match its set dressing, layout and light exactly.
CAST:
- TAI: Sushma, 64, Maharashtrian home-tiffin business owner, tall and big-boned with strong arms, grey hair in a tight bun, a large round red bindi, nine-yard cotton saree tucked at the waist, reading glasses pushed up on her head, flour on her hands, a stern face that cracks into a big laugh.
- RAJU: her delivery man, 30, short and stocky with a round face, still wearing his scooter helmet, out of breath.

SHOT 1 (0-4s): Noon chaos, the pressure cooker whistles. Tai rolls chapatis at speed while her phone on speaker plays a young man's voice: "ताई, आज से मेरा लंच लाइट भेजना... डाइट पे हूँ।"
SHOT 2 (4-7s): Tai rolls her eyes, says "डाइट! हुं।" and pointedly slaps two extra chapatis into his tiffin.
SHOT 3 (7-11s): Raju bursts in: "ताई, पेट्रोल के पैसे?" Tai taps her phone once with a floury finger; Raju's phone pings; he nods: "आ गए।"
SHOT 4 (11-15s): Tai snaps the tiffin shut and says, dry: "लंच लाइट हो सकता है... कमाई नहीं।" Raju laughs. Hold on Tai.
```

---

## 08 · Light Sleep

**Location plate (Image 1):** a narrow 24-hour medical store in Lucknow at 3 a.m.: glass-fronted shelves of medicine boxes with no readable labels, a folding canvas cot behind the counter, a single tube light, a bell button beside the half-open shutter, a steel water bottle, a curl of mosquito-coil smoke.

**Seedance prompt** (the shared LOOK block is appended after this):

```
FILM: 15 seconds, 16:9, four shots joined by hard cuts.
REFERENCE: Image 1 = the location, the 24-hour medical store in Lucknow at 3 a.m.. Match its set dressing, layout and light exactly.
CAST:
- DADA: Mr. Dutta, 67, Bengali chemist who runs a 24-hour medical store, very thin and slightly stooped, long face, big ears, white hair combed back, half-moon reading glasses, a monkey cap pushed up on his head, a grey cardigan over a kurta.
- FATHER: a frantic young father, 28, lanky, in a vest and pyjamas with uncombed hair, holding a crumpled prescription.

SHOT 1 (0-3s): 3 a.m. Dada sleeps on the folding cot behind the counter, glasses on his chest, snoring softly. The shop bell buzzes once.
SHOT 2 (3-7s): Dada is instantly upright, glasses on, already reaching to the shelf. The Father at the counter: "दादा, बच्चे को बुखार है..." Dada hands over a box: "ये लो। दो चम्मच, सुबह फिर आना।"
SHOT 3 (7-11s): The Father, amazed: "दादा, आप सोते भी हो?" Dada, deadpan: "मेरी नींद लाइट है।"
SHOT 4 (11-15s): Dada lies back down on the cot. On the shelf his phone pings and glows; eyes closed, he smiles: "पैसा तो गहरी नींद में भी कमाता है।" Hold on Dada.
```
