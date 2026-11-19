# Sources

## Chapter 1: The Island

The main source is the class reading **The Island** (Grade 8 Social Studies, *The French*), pages 1–4, which the
students already have. Every question rewords one of its ideas.

The teacher said facts from beyond the reading are welcome (2026-11-18). These are the ones used, and where they
come from:

| Fact | Where it is used | Source |
|---|---|---|
| In the spring of 1605 the Passamaquoddy came back from their winter camps to the shores of the island, and with their help the remaining French got healthier | `neighbours` stop (intro, question 2), calendar May 1605, the canoes on the island in May | NPS, Saint Croix Island "History & Culture" (nps.gov/sacr/learn/historyculture) |
| Cannon in two places: on a little islet off the south end (C) and on a platform at the north end (D) | both batteries; the island stop's cannon question | Champlain's map of the island (1613); NPS also describes the fortified islet |
| The island and the nearby mainland were cleared | no trees on the island | NPS, "Saint Croix Island Settlement" |
| Snow from October 6, 1604; ice in the river from early December | the calendar (no question asks for these months since 2026-11-18) | Champlain's account, as summarised by NPS ("snow began early") |
| Spring came in May and the sick recovered | calendar May 1605 | NPS, "Saint Croix Island Settlement" |
| A supply ship arrived on June 15, 1605 | calendar June 1605 | NPS, "Saint Croix Island Settlement" |
| In summer 1605 de Mons explored south with a guide named Panounias | calendar July 1605 | NPS, "Saint Croix Island Settlement" |
| The habitation, building by building: A de Mons's house, B the public house, C the storehouse, D the Swiss, E the forge, F the carpenters, G the well, H the bake oven, I the kitchen, L M X gardens, N the square with a tree, O the palisade, P Q R T lodgings, V the priest | the 3D habitation | Champlain's plan of the habitation (1613). The University of Maine notes the plan may be tidier than what was built. |
| The island: A habitation, B gardens, E cemetery, F chapel, G rocky shoals, H a small islet; on the mainland I the water mill de Mons began, L the charcoal place, M and N gardens west and east | the island and both shores | Champlain's map of the island (1613), fitted to the real outline by `scripts/champlain-fit.mjs` |
| "Rivière des Etechemins" (P on the map): the Etechemin were ancestors of today's Passamaquoddy | the map viewer's note | The Canadian Encyclopedia |
| Port Royal's habitation stood on the Annapolis Basin, at about 44.71° N, 65.61° W | the Port Royal markers on the two map questions | Parks Canada, Port-Royal National Historic Site |

**Removed 2026-11-18 (couldn't be proven):** the chapter used to say that in March 1605 Peskotomuhkati canoes brought
fresh meat to the island and traded it for bread. No page we could read backs the month or the meat: the NPS
"Saint Croix Island Settlement" page puts the meat-for-bread trade at Port Royal the next winter (which the `leaving`
stop still teaches, with the Mi'kmaq), and NPS "History & Culture" says only that the Passamaquoddy returned in the
spring of 1605 and helped. The Canadian Encyclopedia article and the NPS timeline once cited for it could not be
read. The teacher's rule: if we can't prove it, it goes. Bring the March visit back only with Champlain's own words.

Still to confirm against a primary source: the exact dates of first snow and first ice (Champlain's *Voyages*),
and whether the March 1605 visitors are best called Passamaquoddy or Etchemin (the sources use both).

**Not sourced, on purpose:** the month-by-month counts of sick and dead men on the calendar card. Only two numbers
are known (79 men at the start, 35 dead by spring), so the card shows dots growing through the winter and only
states numbers at the start and once spring comes. The families' positions on the Peskotomuhkati side are the
seasonal round in general terms, not a record of particular families.

The Peskotomuhkati summer camp on the west shore is a representative spot, not a known site.

## Champlain's two maps

Both come from Champlain's *Les Voyages* (1613) and are in the public domain. The copies in `public/maps/` are the
ones the teacher uses in class (2026-11-18): the island map is the Gallica scan (Source gallica.bnf.fr / BnF) with
the class's A–F / 1–4 grid drawn on it; the plan of the habitation is a scan from the same book.

How they were used:

- **The island's shape** (2026-11-18, round 3) comes from two outlines, checked against Champlain's map and the
  teacher's photos of the island at mid and low tide (an aerial photo shows the same at another angle):
  - the mid-tide shore, traced from air photos (Esri World Imagery; Esri allows tracing from it) into
    `data/island-trace.png`, 1 m a pixel: the long narrow island, the sand spit at the south end, and the two little
    islets the spit runs toward;
  - OSM's coastline for the island, which is drawn at about low water: it takes in the rock aprons and the rock
    ledge south-east of the island.
  From the teacher: at high tide you cannot walk to the two little islets; at low tide you can walk out to the big
  rock ledge. The ground is set so the game's tide does the same (spit crest +1.5 m, ledge top about +1.9 m, low-water
  line -1.9 m; the water runs ±2.2 m). The island's height (about 13 m on top) follows the elevation tiles.
- **The island map** has north to the right (the fleur-de-lis on its compass) and west at the top. Fitted onto the
  mid-tide outline from two points (the north tip and the south end of the main body), his island is about 40%
  bigger than his own toise bar says (0.46 m a pixel by the fit, 0.64 m by the bar). Fitted onto the low-water
  outline the two agreed (0.68). So he may have drawn the island at low water, or the island may have lost ground
  since; we don't know which. His north is turned about 30 degrees from true north.
- His river is drawn far narrower than it is, so the mainland sites (I, L, M, N) are placed on the real shores in the
  directions he shows. The water mill (I) sits at the mouth of Beaver Brook, the stream on that shore.
- **C, the cannon islet:** his C sits on the sand running south to a line of rocks. It is placed on the little islet
  the sand spit runs to (the south-west one), which is cut off at high tide.
- **The habitation's place:** the real north end is only 30-60 m across, narrower than Champlain draws it, so the
  compound (about 65 by 78 m at 0.1 m a plan pixel) sits just south of it, where the island is about 110 m wide.
  The kitchen (I), which he draws on the bank by the water, comes a little nearer the houses to stay on the bank.
  The cemetery (E), gardens (B) and chapel (F) follow his map south of the houses: E toward the west shore, B toward
  the east, F south of both.
- **The plan's gardens L, M and X** (2026-11-19) are moved off the banks. The real island is narrower than the plan,
  so at the plan's spots M ran down the west bank into the river and L down the east bank. M now stands with the
  island's gardens (B) on the flat ground south of the houses, L is smaller and sits on the flat east of the
  lodgings, and X is a little smaller. A judgment call, not a source: no garden may sit on more than about 1.3 m of
  slope.
- **The storehouse (C)** (2026-11-19) stands inland beside the Swiss quarters (D), facing the square. At the
  plan's spot it hung over the west bank on 10 m of slope. A judgment call, not a source.
- **H, Little Dochet Island:** OSM has only its name, so it is raised from the elevation tiles.
- **The plan's orientation** is not stated. It is drawn with its top to the west, like the island map: then its
  gardens fall on the south side as the island map shows (B), and its kitchen (I) sits on the bank.
- **The well (G):** the plan shows one. The reading says the fresh water was on the shores, so no answer says there
  was no water on the island; the well is a good discussion point.

## Map data

- Ground: AWS Terrain Tiles (Terrarium), zoom 14, downloaded 2026-11-18 into `data/raw/terrarium/`.
- Coastline, islets and place names: © OpenStreetMap contributors (ODbL), Overpass, 2026-11-18, `data/raw/osm.json`.
- The river bed is made up: OSM has no depths. Flats come out at low tide, then a channel.
- The map card uses Natural Earth (public domain), from `src/map-data.js` (copied from the Open Path).

## Models

The birch canoe, wigwam, fish rack, shore rocks, driftwood, paddle and porpoise models were copied from the Open
Path (`wabanaki-wampum-review/public/models`) on 2026-11-18. Everything French (ship, shallop, buildings,
palisade, gardens, cannon, trade goods) is a procedural stand-in in `src/french.js`.

## Free roam: building cards and scenes (`src/stories.js`, 2026-11-18)

In free roam, students click a building for a short card, or click people to watch a little scene with speech
bubbles. **The words people say are made up; the facts under them are not.** Each card and scene names its source
in the game. Short names:

| Short name | Source |
|---|---|
| PLAN | Champlain's plan of the habitation (1613), letters as labelled by Parks Canada, "A French Colony in Acadie" (parks.canada.ca/lhn-nhs/nb/stcroix/culture/colonie-colony) |
| MAP | Champlain's map of the island (1613), as labelled by Parks Canada, "A Place to Settle" (parks.canada.ca/lhn-nhs/nb/stcroix/culture/etablir-settle) |
| NPS | National Park Service, "Saint Croix Island Settlement" (nps.gov/articles/000/saint-croix-island-settlement.htm) |
| NPSH | National Park Service, "Saint Croix Island: Historical Context" (nps.gov/articles/000/saint-croix-island-historical-context.htm) |
| PC | Parks Canada, Saint Croix Island International Historic Site, "Culture and history" pages (colony, settle, winter) |
| READ | the class reading, *The Island* |

New facts these add:

| Fact | Where | Source |
|---|---|---|
| The men first made a little islet ready to defend "in a very short time," though the mosquitoes gave them "great annoyance" (Champlain, quoted) | scene "Mosquitoes!", the south battery card | NPS |
| Some buildings came from France as ready-made frames | scene "Frames from France", carpenters card | PC (colony) |
| Grinding wheat with the hand mill "gave much trouble and labour ... a painful task" (Champlain, as Parks Canada gives it) | scene "The hand mill", oven card | PC (colony) |
| Champlain mapped the inlets and harbours of the coast in summer 1604, back around the end of September | scene "Champlain's maps", his house card | NPS |
| At low tide, plenty of shellfish around the settlement: clams, mussels, sea urchins, snails (Champlain) | scene "Low tide" | PC (settle) |
| The Passamaquoddy hunted seal and porpoise, fished, made maple sugar; their name for the island is thought to be Muttoneguis | scene "Fish drying in the sun", camp card | NPSH |
| The cider froze and was given out by the pound; the men drank Spanish wine and melted snow | scenes "Cider by the pound", "Snow for water"; storehouse and well cards | NPS |
| The river filled with ice cakes; nobody could cross; a shortage of drinking water and firewood | scenes "The ice", "Snow for water"; woodpile card | NPS |
| The 79 who wintered included noblemen, artisans, labourers, Catholic and Protestant clerics, surgeons and soldiers | Swiss quarters card | PC (colony) |
| A Catholic priest and a Protestant minister; a sizeable number of Huguenots | priest's house card | NPS |
| Five ships; left France in March 1604; Passamaquoddy Bay at the end of June | ship card | NPS |
| Burials studied by archaeologists: men of about 17 to 45 | cemetery card | PC (winter) |

Champlain's own words above are as the NPS and Parks Canada pages print them, translated from the 1613 French.

Project Gutenberg's English *Voyages* (Otis translation) could not be reached on 2026-11-18; check the exact
wording there before quoting him anywhere else.

Not acted out, on purpose: the sickness and the deaths. The cemetery card says it plainly; no scene shows it.

## The island's small things (`src/island-detail.js`, 2026-11-19)

Scenery, not facts the game teaches. Two rest on sources above:

| What | Source |
|---|---|
| Tree stumps across the island's open ground: the island was cleared | NPS (table above, "cleared") |
| The woodpiles behind the houses shrink through the winter: a shortage of firewood | NPS |

The rest is ordinary scenery of the time and place, with no claim behind it: the carpenters' work yard north of the
square, barrels by the storehouse, benches by some doors, a wheelbarrow by the gardens, long grass on
the banks, driftwood and a line of dried rockweed at high water, gulls, snowdrifts against the houses and paths
trodden through the snow. In free roam the shallop lies on the beach below the landing, and in summer a
Peskotomuhkati (Passamaquoddy) canoe goes up and down the channel, as the traders' canoe does on the first stop.
