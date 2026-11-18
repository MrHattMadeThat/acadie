# Sources

## Chapter 1: The Island

The main source is the class reading **The Island** (Grade 8 Social Studies, *The French*), pages 1–4, which the
students already have. Every question rewords one of its ideas.

The teacher said facts from beyond the reading are welcome (2026-11-18). These are the ones used, and where they
come from:

| Fact | Where it is used | Source |
|---|---|---|
| In March 1605, Passamaquoddy people brought fresh game to the island and traded it for bread and other goods | `neighbours` question 2, calendar March 1605 | NPS, Saint Croix Island timeline; The Canadian Encyclopedia, "Île Ste-Croix: the birth of Acadia" |
| Cannon in two places: on a little islet off the south end (C) and on a platform at the north end (D) | both batteries; the island stop's cannon question | Champlain's map of the island (1613); NPS also describes the fortified islet |
| The island and the nearby mainland were cleared | no trees on the island | NPS, "Saint Croix Island Settlement" |
| Snow from October 6, 1604; ice in the river from early December | the calendar, the two `when` questions | Champlain's account, as summarised by NPS ("snow began early") |
| Spring came in May and the sick recovered | calendar May 1605 | NPS, "Saint Croix Island Settlement" |
| A supply ship arrived on June 15, 1605 | calendar June 1605 | NPS, "Saint Croix Island Settlement" |
| In summer 1605 de Mons explored south with a guide named Panounias | calendar July 1605 | NPS, "Saint Croix Island Settlement" |
| The habitation, building by building: A de Mons's house, B the public house, C the storehouse, D the Swiss, E the forge, F the carpenters, G the well, H the bake oven, I the kitchen, L M X gardens, N the square with a tree, O the palisade, P Q R T lodgings, V the priest | the 3D habitation | Champlain's plan of the habitation (1613). The University of Maine notes the plan may be tidier than what was built. |
| The island: A habitation, B gardens, E cemetery, F chapel, G rocky shoals, H a small islet; on the mainland I the water mill de Mons began, L the charcoal place, M and N gardens west and east | the island and both shores | Champlain's map of the island (1613), fitted to the real outline by `scripts/champlain-fit.mjs` |
| "Rivière des Etechemins" (P on the map): the Etechemin were ancestors of today's Passamaquoddy | the map viewer's note | The Canadian Encyclopedia |
| St. Croix Island is at about 45.1° N; Bordeaux is at about 44.8° N | `leaving` question 4, a wrong answer's explanation | Geography |

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

- **The island map** has north to the right (the fleur-de-lis on its compass) and west at the top. Fitted onto the
  real outline from two points (the north tip and the south end of the main body), its own scale bar agrees: 0.68 m
  a pixel by the fit, about 0.64 m by his toise bar. His north is turned about 27 degrees from true north.
- His river is drawn far narrower than it is, so the mainland sites (I, L, M, N) are placed on the real shores in the
  directions he shows. The water mill (I) sits at the mouth of Beaver Brook, the stream on that shore.
- **C, the cannon islet:** OSM joins the island's southern tail to the island; following Champlain, the neck is
  lowered below high water so the tail stands apart (`scripts/build-terrain.mjs`).
- **H, Little Dochet Island:** OSM has only its name, so it is raised from the elevation tiles.
- **The plan's orientation** is not stated. It is drawn with its top to the west, like the island map: then its
  gardens fall on the south side as the island map shows (B), and its kitchen (I) sits on the bank.
- **The cemetery (E)** is drawn about 20 m nearer the chapel than the fit puts it, so both fit one view.
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
