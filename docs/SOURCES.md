# Sources

## Chapter 1: The Island

The main source is the class reading **The Island** (Grade 8 Social Studies, *The French*), pages 1–4, which the
students already have. Every question rewords one of its ideas.

The teacher said facts from beyond the reading are welcome (2026-11-18). These are the ones used, and where they
come from:

| Fact | Where it is used | Source |
|---|---|---|
| In March 1605, Passamaquoddy people brought fresh game to the island and traded it for bread and other goods | `neighbours` question 2, calendar March 1605 | NPS, Saint Croix Island timeline; The Canadian Encyclopedia, "Île Ste-Croix: the birth of Acadia" |
| A small islet by the island was fortified with a cannon | the cannon on the island stop. **Simplified:** it stands on the island's east bank so the camera can see it; the real battery was on a small islet beside the island | NPS, "Saint Croix Island Settlement" |
| The island and the nearby mainland were cleared | no trees on the island | NPS, "Saint Croix Island Settlement" |
| Snow from October 6, 1604; ice in the river from early December | the calendar, the two `when` questions | Champlain's account, as summarised by NPS ("snow began early") |
| Spring came in May and the sick recovered | calendar May 1605 | NPS, "Saint Croix Island Settlement" |
| A supply ship arrived on June 15, 1605 | calendar June 1605 | NPS, "Saint Croix Island Settlement" |
| In summer 1605 de Mons explored south with a guide named Panounias | calendar July 1605 | NPS, "Saint Croix Island Settlement" |
| The habitation: buildings around a square with a tree, a storehouse, gardens, an oven, a kitchen, a palisade, a chapel outside | the 3D habitation | Champlain's 1613 plan, as described by Parks Canada and Library and Archives Canada. The University of Maine notes the plan may be tidier than what was built. |
| St. Croix Island is at about 45.1° N; Bordeaux is at about 44.8° N | `leaving` question 4, a wrong answer's explanation | Geography |

Still to confirm against a primary source: the exact dates of first snow and first ice (Champlain's *Voyages*),
and whether the March 1605 visitors are best called Passamaquoddy or Etchemin (the sources use both).

**Not sourced, on purpose:** the month-by-month counts of sick and dead men on the calendar card. Only two numbers
are known (79 men at the start, 35 dead by spring), so the card shows dots growing through the winter and only
states numbers at the start and once spring comes. The families' positions on the Peskotomuhkati side are the
seasonal round in general terms, not a record of particular families.

The Peskotomuhkati summer camp on the west shore is a representative spot, not a known site.

## Map data

- Ground: AWS Terrain Tiles (Terrarium), zoom 14, downloaded 2026-11-18 into `data/raw/terrarium/`.
- Coastline, islets and place names: © OpenStreetMap contributors (ODbL), Overpass, 2026-11-18, `data/raw/osm.json`.
- The river bed is made up: OSM has no depths. Flats come out at low tide, then a channel.
- The map card uses Natural Earth (public domain), from `src/map-data.js` (copied from the Open Path).

## Models

The birch canoe, wigwam, fish rack, shore rocks, driftwood, paddle and porpoise models were copied from the Open
Path (`wabanaki-wampum-review/public/models`) on 2026-11-18. Everything French (ship, shallop, buildings,
palisade, gardens, cannon, trade goods) is a procedural stand-in in `src/french.js`.
