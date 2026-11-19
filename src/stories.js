// Free roam: what students find when they click around the island (explore.js shows it).
//
// INFO: a card for each building or place you can click. SCENES: little moments acted out by the people of the
// settlement, with speech bubbles. The words people say are made up, but every fact under them has a source, given
// in each card's `source` (and in docs/SOURCES.md). Ground rules carried over from the chapter: the sickness and the
// deaths are told plainly and quietly, never acted out; the Peskotomuhkati are shown living their own year.
//
// Sources, short names used below:
//   PLAN   Champlain's plan of the habitation (1613), letters as Parks Canada labels them ("A French Colony in Acadie")
//   MAP    Champlain's map of the island (1613), as Parks Canada labels it ("A Place to Settle")
//   NPS    National Park Service, "Saint Croix Island Settlement"
//   NPSH   National Park Service, "Saint Croix Island: Historical Context"
//   PC     Parks Canada, Saint Croix Island International Historic Site, "Culture and history" pages
//   READ   the class reading, "The Island"

export const INFO = {
  demons_house: { letter: 'A', title: 'The house of the Sieur de Mons', source: 'PLAN; READ',
    text: 'Pierre Dugua, Sieur de Mons, led the colony. The King of France promised him control of the fur trade here, if he could make the colony work.' },
  public_house: { letter: 'B', title: 'The public building', source: 'PLAN',
    text: 'Champlain’s plan calls it the building “where we spent time when it rained.” With 79 men on a small island, everyone needed somewhere dry.' },
  storehouse: { letter: 'C', title: 'The storehouse', source: 'PLAN; NPS',
    text: 'The food and supplies from France were kept here. In the winter the cider froze in its barrels and had to be handed out by the pound.' },
  swiss_quarters: { letter: 'D', title: 'Quarters for the Swiss', source: 'PLAN; PC',
    text: 'Champlain marked this house for “the Swiss.” The men who wintered here included noblemen, craftsmen, labourers, soldiers, surgeons and two clergymen.' },
  forge: { letter: 'E', title: 'The blacksmith shop', source: 'PLAN; MAP',
    text: 'A blacksmith made and mended iron tools here. Over on the west shore, men made charcoal (L on the island map), which burns hotter than wood.' },
  carpenters: { letter: 'F', title: 'The carpenters', source: 'PLAN; PC',
    text: 'Where the carpenters lived. Some of the buildings came from France as ready-made frames, to be put together on the island.' },
  lodging_p: { letter: 'P', title: 'Champlain’s house', source: 'PLAN; NPS',
    text: 'Champlain lived here with d’Orville and Champdoré. In the summer of 1604 he was away for weeks, mapping the inlets and harbours of the coast.' },
  lodging_q: { letter: 'Q', title: 'Houses of the craftsmen', source: 'PLAN',
    text: 'Boulay and other craftsmen lived in this row. The colony needed people who could build, mend and make things, far from any shop.' },
  lodging_r: { letter: 'R', title: 'Houses of Genestou and Sourin', source: 'PLAN',
    text: 'Genestou, Sourin and more craftsmen lived here.' },
  lodging_t: { letter: 'T', title: 'Houses of Beaumont, la Motte and Fougeray', source: 'PLAN',
    text: 'Beaumont, la Motte and Fougeray lived in this row. Champlain wrote down who lived in nearly every house.' },
  cure: { letter: 'V', title: 'The priest’s house', source: 'PLAN; NPS',
    text: 'The colony had a Catholic priest and a Protestant minister, and many of the men were Protestants (Huguenots).' },
  bakehouse: { letter: 'H', title: 'The bake oven', source: 'PLAN; PC',
    text: 'The oven where bread was made. The wheat was ground by hand in a hand mill first. Champlain called that “a painful task.”' },
  kitchen: { letter: 'I', title: 'The kitchen', source: 'PLAN',
    text: 'The kitchen stood on the bank, by the water, a little apart from the houses.' },
  well: { letter: 'G', title: 'The well', source: 'PLAN; NPS',
    text: 'Champlain marked a well on his plan. In the winter, cut off from the shore, the men melted snow to drink.' },
  square: { letter: 'N', title: 'The square', source: 'PLAN',
    text: 'An open square with a tree in the middle, at the heart of the habitation.' },
  gardens: { letter: 'L M X', title: 'Gardens', source: 'PLAN; MAP',
    text: 'The French planted gardens around the houses, south of them on the island, and on both shores of the river.' },
  gardens_mainland: { letter: 'M N', title: 'Gardens on the shore', source: 'MAP',
    text: 'Gardens on the mainland, across the water from the island. Easy to reach by boat in summer.' },
  chapel: { letter: 'F', title: 'The chapel', source: 'MAP',
    text: 'The chapel, south of the houses on Champlain’s map of the island.' },
  cemetery: { letter: 'E', title: 'The cemetery', source: 'MAP; NPS; PC',
    text: '35 of the 79 men who spent the winter here died of scurvy. They were buried on the island. Archaeologists think they were between about 17 and 45 years old.' },
  battery_south: { letter: 'C', title: 'The cannon on the little islet', source: 'MAP; NPS',
    text: 'One of the first things the French built: a barricade and a cannon on the little islet off the south end. Ships coming up the river had to pass it.' },
  battery_north: { letter: 'D', title: 'The cannon platform', source: 'MAP',
    text: 'A platform with cannon at the north end of the island, facing up the river.' },
  flake: { letter: '', title: 'A drying rack for cod', source: 'READ',
    text: 'Salted cod dried in the sun on racks like this. Dried cod kept for months. It is what French fishermen had crossed the ocean for, for a hundred years.' },
  woodpile: { letter: '', title: 'The woodpile', source: 'NPS; READ',
    text: 'In summer, firewood was a short boat ride away on the shores. In winter the ice cut the island off, and the woodpile was all they had.' },
  mill: { letter: 'I', title: 'The water mill', source: 'MAP',
    text: 'On the mainland, where a brook comes down to the river, de Mons began building a water mill to grind wheat.' },
  charcoal: { letter: 'L', title: 'Where they made charcoal', source: 'MAP',
    text: 'Wood was slowly burned under a mound of earth to make charcoal, which a blacksmith needs for a hot fire.' },
  ship: { letter: '', title: 'A French ship', source: 'NPS',
    text: 'De Mons hired five ships. They left France in March 1604 and reached Passamaquoddy Bay at the end of June.' },
  camp: { letter: '', title: 'A Peskotomuhkati summer camp', source: 'NPSH; READ',
    text: 'In summer, Peskotomuhkati (Passamaquoddy) families camped by the coast. They fished and hunted seal and porpoise. In winter they moved inland, near firewood and game.' },
};

export const SOURCES = {
  PLAN: 'Champlain’s plan of the habitation, 1613 (Parks Canada)',
  MAP: 'Champlain’s map of the island, 1613 (Parks Canada)',
  NPS: 'National Park Service, “Saint Croix Island Settlement”',
  NPSH: 'National Park Service, “Saint Croix Island: Historical Context”',
  PC: 'Parks Canada, Saint Croix Island International Historic Site',
  READ: 'The class reading, “The Island”',
};

// A scene: where it happens (`at`: plan pixels [px, py], or world metres with `world: true`), who is in it (`cast`:
// offsets in metres from `at`, east +x and north -z), props, and the beats it plays through.
// A beat: who speaks (`who`, `say`), and what anyone does as it starts (`do`: { id: { act, tool, face, to } }).
// `face` is another cast id, or 'east' / 'west' / 'north' / 'south'. `to` walks someone to a new offset.
export const SCENES = [
  {
    id: 'mosquitoes', season: 'summer', title: 'Mosquitoes!', at: [-14, 105], world: true, offset: [-3, -3],
    cast: {
      a: { at: [-1.2, 0], face: 'b', act: 'strike', tool: 'sledge', hat: 'monmouth' },
      b: { at: [1.4, 0.4], face: 'a', act: 'swat', hat: 'felt' },
    },
    props: [{ kind: 'stakes', at: [-1.2, 1.1] }],
    beats: [
      { who: 'a', say: 'Drive the stakes in deep. This islet has to be ready to defend.' },
      { who: 'b', say: 'I’d work faster if these mosquitoes would stop biting!' },
      { who: 'a', say: 'Ow! Keep going. The cannon goes in here when we’re done.', do: { a: { act: 'swat', tool: null } } },
      { who: 'b', say: 'At this rate the mosquitoes will be the ones defending it.', do: { b: { act: 'laugh' } } },
    ],
    note: 'Champlain wrote that the men made this little islet ready to defend “in a very short time,” though the mosquitoes gave them “great annoyance.” A cannon stood on it: C on his map.',
    source: 'NPS; MAP',
  },
  {
    id: 'frames', season: 'summer', title: 'Frames from France', at: [20, -119], world: true,
    cast: {
      a: { at: [-1, 0], face: 'b', act: 'idle', hat: 'monmouth' },
      b: { at: [1.2, 0.6], face: 'a', act: 'chat', hat: 'felt' },
    },
    beats: [
      { who: 'a', say: 'These frames came all the way from France, in pieces.' },
      { who: 'b', say: 'Then let’s put them together the right way round this time.' },
      { who: 'a', say: 'Ha! Grab the other end.', do: { a: { act: 'laugh' } } },
      { who: 'b', say: 'Up the hill to the carpenters. Watch your feet.', do: { a: { act: 'shoulder', tool: 'plank', to: [-9, -2] }, b: { act: 'shoulder', tool: 'plank', to: [-7, -1] } } },
    ],
    note: 'Some of the buildings came from France as ready-made frames, to be put together on the island.',
    source: 'PC',
  },
  {
    id: 'handmill', season: 'summer', title: 'The hand mill', at: [945, 785],
    cast: {
      a: { at: [0, 0.8], face: 'north', act: 'turn', hat: 'monmouth' },
      b: { at: [3, 3], face: 'a', act: 'idle', hat: 'felt', tool: 'sack' },
    },
    props: [{ kind: 'quern', at: [0, -0.1] }],
    beats: [
      { who: 'a', say: 'Round and round and round. My arms are going to fall off.' },
      { who: 'b', say: 'More wheat. The baker wants flour for tomorrow’s bread.', do: { b: { act: 'shoulder', to: [1.2, 1.4] } } },
      { who: 'a', say: 'Grinding wheat by hand is the worst job on this island.', do: { b: { act: 'idle', tool: null } } },
      { who: 'b', say: 'That’s why we take turns. Next turn: you again!', do: { b: { act: 'laugh' } } },
    ],
    note: 'Champlain wrote that the hand mill for grinding their wheat “gave much trouble and labour.” It was “a painful task.” De Mons began a water mill on the mainland (I on the island map).',
    source: 'PC; MAP',
  },
  {
    id: 'champlain', season: 'summer', title: 'Champlain’s maps', at: [520, 668],
    cast: {
      c: { name: 'Champlain', at: [0, 0], face: 'b', act: 'study', tool: 'cloth', hat: 'felt', beard: true },
      b: { at: [1.6, 1], face: 'c', act: 'idle', hat: 'monmouth' },
    },
    beats: [
      { who: 'b', say: 'Drawing the island again, Monsieur Champlain?', do: { b: { act: 'chat' } } },
      { who: 'c', say: 'The island, the river, all of it. Soon I sail south to map the coast.' },
      { who: 'b', say: 'How long will you be gone?' },
      { who: 'c', say: 'A few weeks. I’ll be back by the end of September.', do: { c: { act: 'chat' } } },
      { who: 'b', say: 'Bring back a good map!', do: { b: { act: 'wave' } } },
    ],
    note: 'In the summer of 1604 Champlain mapped the inlets and harbours of the coast, and came back around the end of September. His maps of the island and the habitation were printed in 1613: press Maps to see them.',
    source: 'NPS; PLAN',
  },
  {
    id: 'shellfish', season: 'summer', title: 'Low tide', at: [34, -60], world: true,
    cast: {
      a: { at: [0, 0], face: 'east', act: 'pry', tool: 'bucket', hat: 'monmouth' },
      b: { at: [2, 1.5], face: 'a', act: 'reach', tool: 'basket', hat: 'felt' },
    },
    beats: [
      { who: 'a', say: 'Clams, mussels, sea urchins… the beach is full of them at low tide!' },
      { who: 'b', say: 'Fill the bucket. It makes a change from what’s in the barrels.' },
      { who: 'a', say: 'Watch the tide, though. It comes back in fast here.', do: { a: { act: 'point', tool: null } } },
    ],
    note: 'Champlain wrote that around the settlement, at low tide, there were plenty of shellfish: clams, mussels, sea urchins and snails.',
    source: 'PC',
  },
  {
    id: 'camp', season: 'summer', title: 'Fish drying in the sun', at: [1162, -616], world: true,
    cast: {
      w: { side: 'pk', kind: 'woman', at: [0, 0], face: 'north', act: 'reach' },
      k: { side: 'pk', kind: 'boy', at: [2.2, 1.2], face: 'w', act: 'idle' },
      m: { side: 'pk', at: [-2, 2], face: 'w', act: 'idle' },
    },
    beats: [
      { who: 'w', say: 'Turn the fish over. The sun has to reach every side.' },
      { who: 'k', say: 'The French are still building out on the island.', do: { k: { act: 'point', face: 'west' } } },
      { who: 'm', say: 'Muttoneguis. They plan to stay out there all winter.', do: { m: { act: 'chat' } } },
      { who: 'w', say: 'We’ll be inland by then, near the firewood and the hunting.', do: { k: { act: 'idle', face: 'w' } } },
    ],
    note: 'Peskotomuhkati (Passamaquoddy) families had lived around this river for thousands of years. In summer they camped by the coast, fished, and hunted seal and porpoise. In winter they moved inland, near firewood, shelter and game. Their name for the island is thought to be Muttoneguis.',
    source: 'NPSH; READ',
  },
  {
    id: 'cider', season: 'winter', title: 'Cider by the pound', at: [835, 275],
    cast: {
      a: { at: [0, 0], face: 'east', act: 'idle', tool: 'axe', hat: 'monmouth' },
      b: { at: [2.2, 0.6], face: 'a', act: 'shiver', hat: 'felt' },
      c: { at: [3.4, -1], face: 'a', act: 'shiver', hat: 'monmouth' },
    },
    props: [{ kind: 'barrel', at: [-0.6, 1.2] }, { kind: 'ciderBlock', at: [0.6, 0.6] }],
    beats: [
      { who: 'b', say: 'One cider, please. It’s freezing out here.' },
      { who: 'a', say: 'So is the cider. Frozen solid, right in the barrel.', do: { a: { act: 'chop', face: 'east' } } },
      { who: 'a', say: 'There you go. One pound of cider.', do: { a: { act: 'idle' } } },
      { who: 'b', say: 'A pound? It’s a drink, not a cheese!' },
      { who: 'c', say: 'Suck on it slowly. It has to last.', do: { c: { act: 'laugh' } } },
    ],
    note: 'That winter the cider froze in the barrels and had to be handed out by the pound. The men drank Spanish wine and melted snow.',
    source: 'NPS; READ',
  },
  {
    id: 'snow', season: 'winter', title: 'Snow for water', at: [960, 480],
    cast: {
      a: { at: [4, 2], face: 'b', act: 'carry', tool: 'bucket', hat: 'monmouth' },
      b: { at: [0, 0], face: 'a', act: 'shiver', hat: 'felt' },
    },
    props: [{ kind: 'kettleFire', at: [0.2, -1.1] }],
    beats: [
      { who: 'a', say: 'More snow for the pot.', do: { a: { to: [1.2, 0.6] } } },
      { who: 'b', say: 'Good. Melted snow is all the water we have now.', do: { a: { act: 'idle' } } },
      { who: 'a', say: 'The good water is across the river. So is the firewood.' },
      { who: 'b', say: 'And the ice won’t let anybody cross.', do: { b: { act: 'point', face: 'east' } } },
    ],
    note: 'Cut off from the shore by the ice, the men ran short of drinking water and firewood. They melted snow to drink.',
    source: 'NPS; READ',
  },
  {
    id: 'ice', season: 'winter', title: 'The ice', at: [22, -112], world: true,
    cast: {
      a: { at: [0, 0], face: 'east', act: 'point', hat: 'felt' },
      b: { at: [-1.4, 1], face: 'east', act: 'shiver', hat: 'monmouth' },
    },
    beats: [
      { who: 'a', say: 'Look at that ice. The tide pushes it up the river, then drags it back down.' },
      { who: 'b', say: 'So nobody rows over for firewood today.', do: { a: { act: 'idle' } } },
      { who: 'a', say: 'Not today. Maybe not for weeks.', do: { a: { face: 'b' } } },
      { who: 'b', say: 'Then we burn what’s left in the pile, and hope it lasts.' },
    ],
    note: 'Before long the river filled with dangerous chunks of ice, and nobody could cross. The tide carried the ice up and down the river.',
    source: 'NPS; READ',
  },
];
