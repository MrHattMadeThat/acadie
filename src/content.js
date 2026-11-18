// Every stop in the experience, in order. Chapter 1 is "The Island".
//
// Source for chapter 1: the class reading "The Island" (Grade 8 Social Studies, The French), pages 1-4.
// Facts from beyond the reading are marked in a comment with where they come from. The teacher has said facts
// beyond the reading are welcome (2026-11-18). Questions are reworded from the reading's own questions on purpose.
//
// Task types (see src/tasks.js):
//   choice   one right answer; every wrong option carries a `why`
//   multi    select all that apply
//   match    give each item one of the choices; `pick` links an item to a named 3D part in the scene
//   answer3  build a three-part written answer: claim, detail, why it matters
//   when     move the calendar to a month and say "this one" (the stop must show the calendar)
//   mapfind  tap a place on a map of the Maritimes
//
// Each stop also says which month the scene shows (0 = June 1604 ... 14 = August 1605, see world.js MONTHS).

export const CHAPTERS = [
  { id: 'island', title: 'The Island', question: 'What happened when France tried to spend a winter in Wabanaki country?' },
];

// The lines over the opening flight up the river, one after another.
export const OPENING = [
  'Passamaquoddy Bay. Peskotomuhkati homeland.',
  'People have lived around this river for thousands of years.',
  'In June 1604, a French ship sailed in.',
  'The people on it planned to stay the winter.',
];

export const STOPS = [
  {
    id: 'trade',
    chapter: 'island',
    title: 'Cod and beaver',
    place: 'The St. Croix River, June 1604',
    month: 0,
    intro:
      'A French ship has anchored in the river. French fishermen had been crossing the ocean to this coast for about ' +
      'a hundred years. Look at what is on the deck, and what has come out to meet it.',
    tasks: [
      {
        type: 'choice',
        prompt: 'What two things brought the French 5,000 kilometres across the Atlantic to this coast?',
        options: [
          { text: 'Fish and fur', correct: true },
          { text: 'Gold and silver', why: 'Not here. The riches of this coast were in the water and in the forest.' },
          { text: 'Farmland and timber', why: 'Farms came later, with families. The first French came for two other things.' },
          { text: 'Whales and seals', why: 'Close, but no. Think of what dries on racks, and what made hats.' },
        ],
        explain: 'Cod and beaver fur. Fishermen came for cod. Traders came for beaver.',
      },
      {
        type: 'match',
        prompt: 'A trade is happening beside the ship. Who brought each thing?',
        items: [
          { id: 'pelts', label: 'Beaver pelts', pick: 'pelts', answer: 'w' },
          { id: 'kettle', label: 'Iron kettle', pick: 'trade_kettle', answer: 'f' },
          { id: 'axe', label: 'Axe', pick: 'axe', answer: 'f' },
          { id: 'cloth', label: 'Cloth', pick: 'cloth', answer: 'f' },
        ],
        choices: [
          { id: 'w', label: 'Wabanaki traders' },
          { id: 'f', label: 'French traders' },
        ],
        explain: 'Wabanaki traders had the beaver. The French had iron kettles, axes, knives and cloth. Trading furs for European goods is called the fur trade.',
      },
      {
        type: 'choice',
        prompt: 'Why was salted, dried cod worth so much back in France?',
        options: [
          { text: 'It kept for months, and fed people on the many fast days when eating meat was not allowed', correct: true },
          { text: 'Only kings were allowed to eat it', why: 'No. Cod fed ordinary people. Think about religious days.' },
          { text: 'It was used to pay taxes', why: 'The reading doesn’t say that. What does salting and drying do to fish?' },
          { text: 'It was the only fish that could cross the ocean alive', why: 'The fish didn’t cross alive. They were salted and dried first.' },
        ],
        explain: 'Salted and dried, cod kept for months. On the many religious fast days, people in France ate fish instead of meat.',
      },
      {
        type: 'choice',
        prompt: 'Why did Europeans want beaver fur so badly?',
        options: [
          { text: 'Hats made from beaver felt were in fashion, and Europe’s own beavers were nearly gone', correct: true },
          { text: 'They needed warm coats for the winter', why: 'The reading points to one thing people wore. It wasn’t coats.' },
          { text: 'Beaver fur made boats waterproof', why: 'No. Think about fashion.' },
          { text: 'It was used as money in France', why: 'No. People wanted to wear it.' },
        ],
        explain: 'Beaver-felt hats were in fashion in Europe, and Europe’s beavers had been hunted almost to nothing. The Wabanaki had beaver.',
      },
    ],
  },

  {
    id: 'plan',
    chapter: 'island',
    title: 'A plan to stay',
    place: 'On the ship, June 1604',
    month: 0,
    intro:
      'Fishermen came every summer and sailed home every fall. A French nobleman, Pierre Dugua, Sieur de Mons, came ' +
      'with a different plan. With him came a mapmaker, Samuel de Champlain, who wrote down almost everything that happened.',
    tasks: [
      {
        type: 'choice',
        prompt: 'What was new about de Mons’s plan?',
        options: [
          { text: 'His people would stay here all year round', correct: true },
          { text: 'He would fish all summer and sail home in the fall', why: 'That is what fishermen had done for a hundred years. His plan was different.' },
          { text: 'He would only trade, never land', why: 'No. He meant to build, and to stay.' },
          { text: 'He would map the coast and leave', why: 'Champlain did map the coast, but the plan was to stay.' },
        ],
        explain: 'De Mons wanted a colony: French people living here all year, still under the King of France.',
      },
      {
        type: 'match',
        prompt: 'Match each key word to what it means.',
        items: [
          { id: 'colony', label: 'Colony', answer: 'colony' },
          { id: 'fur', label: 'Fur trade', answer: 'fur' },
          { id: 'champlain', label: 'Champlain', answer: 'champlain' },
        ],
        choices: [
          { id: 'colony', label: 'A settlement in a new land where people live all year, still ruled by their home country' },
          { id: 'fur', label: 'Trading furs, mostly beaver, for kettles, axes, knives and cloth' },
          { id: 'champlain', label: 'The mapmaker who wrote down almost everything that happened' },
        ],
        explain: 'A colony stays all year. The fur trade paid for it. Champlain wrote it all down, which is why we know the story.',
      },
      {
        type: 'choice',
        prompt: 'The King of France made de Mons a promise if he could make the colony work. What was it?',
        options: [
          { text: 'Control of the fur trade here', correct: true },
          { text: 'A castle in Paris', why: 'No. The promise was about money to be made here.' },
          { text: 'Gold from the king’s treasury', why: 'No. The colony had to pay for itself.' },
          { text: 'A title as King of Acadie', why: 'No. Think about what was worth the most here.' },
        ],
        explain: 'The king promised de Mons control of the fur trade. Whoever controlled the beaver trade could get rich.',
      },
    ],
  },

  {
    id: 'island',
    chapter: 'island',
    title: 'Choosing the island',
    place: 'St. Croix Island, summer 1604',
    month: 1,
    intro:
      'In June 1604, de Mons chose a small island in the middle of the river. His men built houses, a storehouse and ' +
      'gardens. Champlain drew a plan of it, printed in 1613. This is that plan, in 3D.',
    tasks: [
      {
        type: 'multi',
        prompt: 'In June, the island looked like a smart choice. Why? Pick the two reasons from the reading.',
        options: [
          { text: 'Easy to defend from attack', correct: true },
          { text: 'Close to the sea', correct: true },
          { text: 'Plenty of firewood close by', why: 'Look across the water. The forest is on the shores.' },
          { text: 'Fresh water on the island', why: 'The fresh water was on the shores too.' },
          { text: 'Sheltered from winter storms', why: 'It was out in the middle of the river, open to the wind.' },
        ],
        explain: 'Water all around made it easy to defend, and the sea was close for the ships. Nobody was thinking about winter yet.',
      },
      {
        type: 'match',
        prompt: 'Find these on Champlain’s plan. What was each one for?',
        items: [
          { id: 'storehouse', label: 'The storehouse', pick: 'storehouse', answer: 'store' },
          { id: 'garden', label: 'The gardens', pick: 'gardens', answer: 'garden' },
          { id: 'palisade', label: 'The palisade', pick: 'palisade', answer: 'palisade' },
          { id: 'cannon', label: 'The cannon', pick: 'cannon', answer: 'cannon' },
        ],
        choices: [
          { id: 'store', label: 'Kept the food and supplies' },
          { id: 'garden', label: 'Grew vegetables' },
          { id: 'palisade', label: 'A wall of pointed stakes, for defence' },
          { id: 'cannon', label: 'Guarded the river from ships' },
        ],
        // The cannon on a little islet beside the island: NPS, "Saint Croix Island Settlement" (nps.gov).
        explain: 'Everything was built to keep the colony safe and fed, the French way. Notice what is missing: nothing here is about getting through a winter.',
      },
      {
        type: 'choice',
        prompt: 'Look across the water. Where were the firewood and the fresh water?',
        options: [
          { text: 'On the shores, across the river', correct: true },
          { text: 'On the island', why: 'The island had been cleared to build. Look at the shores.' },
          { text: 'On the ship', why: 'The ship carried some water and wood, but not enough for a whole winter.' },
          { text: 'There was none anywhere nearby', why: 'There was lots. It just wasn’t on the island.' },
        ],
        explain: 'Firewood and fresh water were on the shores. In summer, a short boat trip. Keep that in mind for the winter.',
      },
    ],
  },

  {
    id: 'winter',
    chapter: 'island',
    title: 'Two calendars',
    place: 'The St. Croix River, 1604–1605',
    month: 6,
    calendar: true,
    intro:
      'Winter came early and hard. Move through the months with the slider. Watch both sides: the French on the island, ' +
      'and the Peskotomuhkati families who lived here.',
    tasks: [
      {
        type: 'when',
        prompt: 'Move through the months. Stop on the month the first snow fell, then press “This month”.',
        answer: [4],
        hints: { early: 'Not yet. Keep going.', late: 'The snow came before that. Go back a little.' },
        // Champlain: snow from October 6, 1604. NPS says snow began early.
        explain: 'The first snow fell in October. Champlain wrote: “There are six months of winter in that country.”',
      },
      {
        type: 'when',
        prompt: 'Now find the month the river ice cut the island off from both shores.',
        answer: [6],
        hints: { early: 'The river is still open. Keep going.', late: 'The island was already cut off by then. Go back.' },
        // Champlain: ice in the river from early December 1604.
        explain: 'By December, chunks of ice filled the river and moved with the tide. Boats could not cross to either shore.',
      },
      {
        type: 'choice',
        prompt: 'What kept the men from getting to firewood and fresh water?',
        options: [
          { text: 'Ice moving in the river with the tide', correct: true },
          { text: 'An attack from the shore', why: 'There was no attack. Something in the river stopped the boats.' },
          { text: 'A forest fire', why: 'No. Look at the river in the winter months.' },
          { text: 'Their ships sank', why: 'No. The ships were fine. The river was the problem.' },
        ],
        explain: 'The tide pushed the ice up and down the river twice a day. No boat could get through it.',
      },
      {
        type: 'choice',
        prompt: 'With no way to the shore, what did the men drink?',
        options: [
          { text: 'Melted snow', correct: true },
          { text: 'Sea water', why: 'Salt water makes you thirstier and sicker. They melted something else.' },
          { text: 'Cider, as much as they liked', why: 'The cider froze solid. It was handed out by the pound.' },
          { text: 'Water from a stream on the island', why: 'There was no fresh water on the island.' },
        ],
        explain: 'They melted snow. Their cider froze solid and had to be handed out by the pound, like cheese.',
      },
    ],
  },

  {
    id: 'sickness',
    chapter: 'island',
    title: 'The sickness',
    place: 'St. Croix Island, February 1605',
    month: 8,
    intro:
      'Then the men started getting sick. Their gums swelled and their teeth came loose. Their legs swelled until they ' +
      'could not stand. Nobody knew why.',
    tasks: [
      {
        type: 'choice',
        prompt: 'Today we call this sickness scurvy. What causes it?',
        options: [
          { text: 'Going months without fresh food', correct: true },
          { text: 'Being very cold', why: 'The cold made everything worse, but it isn’t the cause. Think about food.' },
          { text: 'Drinking melted snow', why: 'Snow water is safe to drink. Think about what they were eating.' },
          { text: 'A sickness caught from other people', why: 'No. You can’t catch scurvy from anyone. It comes from what you eat, or don’t.' },
        ],
        explain: 'Scurvy comes from going months without fresh food. The men lived on salted and stored food all winter.',
      },
      {
        type: 'choice',
        prompt: 'Seventy-nine men spent the winter on the island. How many died?',
        options: [
          { text: '35', correct: true },
          { text: '5', why: 'Five is the next winter, at Port Royal.' },
          { text: '79', why: 'Not all of them. Some lived to tell the story.' },
          { text: '12', why: 'It was far more than that.' },
        ],
        explain: '35 of the 79 died, and about 20 more came close. That is almost half.',
      },
      {
        type: 'choice',
        prompt: 'Why didn’t the men on the island have fresh food?',
        options: [
          { text: 'They lived on salted and stored food, and were trapped on the island', correct: true },
          { text: 'There was no food anywhere around the river in winter', why: 'The Peskotomuhkati found food all winter. It just wasn’t on a small island.' },
          { text: 'They didn’t like the taste of the local food', why: 'No. They couldn’t get to it.' },
          { text: 'The Peskotomuhkati refused to trade', why: 'No. In March, Peskotomuhkati people came to trade. You’ll see at the next stop.' },
        ],
        explain: 'The French brought what worked in France: stored food, and a fort on an island. Here, it left them trapped and hungry for fresh food.',
      },
    ],
  },

  {
    id: 'neighbours',
    chapter: 'island',
    title: 'The people who lived here',
    place: 'Peskotomuhkati homeland, March 1605',
    month: 9,
    intro:
      'The Peskotomuhkati (Passamaquoddy) had lived around this river for thousands of years. Winter was hard for them ' +
      'too, but they knew how to live through it. In March, two canoes came out to the island.',
    tasks: [
      {
        type: 'match',
        prompt: 'Two ways of getting through the same winter. Whose way was each?',
        items: [
          { id: 'a', label: 'Stayed all winter on a small island', answer: 'f' },
          { id: 'b', label: 'Moved inland to sheltered winter camps', answer: 'p' },
          { id: 'c', label: 'Camped where firewood was close', answer: 'p' },
          { id: 'd', label: 'Ate salted food from barrels', answer: 'f' },
          { id: 'e', label: 'Hunted for fresh meat all winter', answer: 'p' },
        ],
        choices: [
          { id: 'f', label: 'The French on the island' },
          { id: 'p', label: 'Peskotomuhkati families' },
        ],
        explain: 'Wabanaki families moved to where the food, shelter and firewood were. Nobody who knew this place would spend the winter trapped on a small island.',
      },
      {
        type: 'choice',
        // Beyond the reading: NPS timeline (nps.gov, Saint Croix Island) and The Canadian Encyclopedia,
        // "Île Ste-Croix: the birth of Acadia": in March 1605 the Passamaquoddy brought fresh game to trade.
        prompt: 'In March 1605, Peskotomuhkati people came out to the island. What did they bring to trade?',
        options: [
          { text: 'Fresh meat from their hunting', correct: true },
          { text: 'Gold', why: 'No. They brought exactly what the sick men needed.' },
          { text: 'Barrels of cider', why: 'Cider was French. Think about what the sick men were missing.' },
          { text: 'Nothing. They came to attack', why: 'No. They came to trade.' },
        ],
        explain: 'They brought fresh game and traded it for bread and other goods. Fresh food was exactly what the sick men were missing.',
      },
      {
        type: 'answer3',
        prompt: 'The big question: why did so many Frenchmen die on the island, when the people who lived here got through the winter?',
        steps: ['Part 1 · Pick a reason. Any of these can work.', 'Part 2 · Which detail backs it up?', 'Part 3 · Why does that detail matter?'],
        claims: [
          {
            claim: 'The French chose a place that was wrong for winter',
            detail: 'Ice in the river cut the island off from the firewood and fresh water on the shores.',
            why: 'With no wood or water close by, the men spent the winter cold, thirsty and weak.',
          },
          {
            claim: 'The French had no fresh food',
            detail: 'They lived on stored food all winter, and scurvy comes from months without fresh food.',
            why: 'Scurvy is what killed 35 of the 79 men.',
          },
          {
            claim: 'The Peskotomuhkati moved with the seasons',
            detail: 'In winter, families moved to where the food, shelter and firewood were.',
            why: 'They never tried to winter in a place that couldn’t keep them alive.',
          },
        ],
        wrongDetails: ['The Peskotomuhkati attacked the island in the winter.'],
        explain: 'The French brought what worked in France, and it did not work here.',
      },
    ],
  },

  {
    id: 'leaving',
    chapter: 'island',
    title: 'Starting over',
    place: 'St. Croix Island, August 1605',
    month: 14,
    intro:
      'In August 1605, the survivors took their buildings apart, loaded the boards onto their ships, and sailed across ' +
      'the Bay of Fundy to a sheltered harbour they named Port Royal.',
    tasks: [
      {
        type: 'choice',
        prompt: 'What did the French do with their buildings when they left?',
        options: [
          { text: 'Took them apart and carried the boards away on their ships', correct: true },
          { text: 'Burned them', why: 'No. Boards were too useful to burn. Watch the island.' },
          { text: 'Left them standing for next winter', why: 'Nobody wanted another winter on that island.' },
          { text: 'Sold them to English traders', why: 'No. They took them along.' },
        ],
        explain: 'They took the buildings apart board by board. Only the stone footings stayed behind.',
      },
      {
        type: 'mapfind',
        prompt: 'Port Royal is across the Bay of Fundy, on the far shore. Find it on the map.',
        target: { at: [-65.52, 44.73], r: 0.35, label: 'Port Royal' },
        start: { at: [-67.134, 45.128], label: 'St. Croix Island' },
        hint: 'Cross the Bay of Fundy to the south-east, to the shore of what is now Nova Scotia.',
        explain: 'Port Royal is on the Nova Scotia side of the Bay of Fundy, in a sheltered harbour.',
      },
      {
        type: 'choice',
        prompt: 'The next winter, at Port Royal, five men died instead of 35. What helped?',
        options: [
          { text: 'A milder winter, and fresh meat traded from the Mi’kmaq for French bread', correct: true },
          { text: 'They brought a doctor who knew how to cure scurvy', why: 'Nobody knew the cause yet. Fresh food made the difference.' },
          { text: 'They spent the winter on their ship', why: 'No. They lived in the new settlement.' },
          { text: 'They went home to France for the winter', why: 'No. They stayed. That was the whole plan.' },
        ],
        explain: 'The winter was milder, and the Mi’kmaq who lived nearby traded them fresh meat for French bread.',
      },
      {
        type: 'choice',
        prompt: 'What was the first lesson the French learned about this place?',
        options: [
          { text: 'They could not do it alone', correct: true },
          { text: 'Islands are the safest place to spend a winter', why: 'The island nearly killed them all.' },
          { text: 'Winters here are just like winters in France', why: 'St. Croix Island is about as far north as Bordeaux, in the south of France. The French expected French weather. They were wrong.' },
          { text: 'Nobody else lived here', why: 'People had lived here for thousands of years. That was the lesson.' },
        ],
        // Beyond the reading: St. Croix Island is at about 45.1° N; Bordeaux is at about 44.8° N.
        explain: 'They could not do it alone. They needed the knowledge, the trade and the help of the people who already lived here.',
      },
    ],
  },

  {
    id: 'acadie',
    chapter: 'island',
    title: 'Welcome to Acadie',
    place: 'The 1600s',
    month: 13,
    intro:
      'The French had a name for the whole region around the Bay of Fundy: Acadie (ah-kah-DEE). In English, Acadia. ' +
      'St. Croix Island and Port Royal were both in Acadie. So is St. George.',
    tasks: [
      {
        type: 'mapfind',
        prompt: 'The French called the Bay of Fundy the Baye Françoise, the French Bay. Find it on the map.',
        target: { at: [-65.95, 45.0], r: 0.5, label: 'Baye Françoise (Bay of Fundy)' },
        hint: 'It is the long bay between New Brunswick and Nova Scotia.',
        explain: 'The Bay of Fundy sits right in the middle of Acadie. Most Acadian villages grew up around its shores.',
      },
      {
        type: 'mapfind',
        prompt: 'Now find where St. George would be.',
        target: { at: [-66.83, 45.13], r: 0.18, label: 'St. George' },
        start: { at: [-67.134, 45.128], label: 'St. Croix Island' },
        hint: 'Start at St. Croix Island and go a little east, along the New Brunswick shore.',
        explain: 'St. George is only about 25 km east of St. Croix Island. This story happened in our own backyard.',
      },
      {
        type: 'multi',
        prompt: 'Which of these were part of Acadie? Pick four.',
        options: [
          { text: 'Nova Scotia', correct: true },
          { text: 'New Brunswick', correct: true },
          { text: 'Prince Edward Island', correct: true },
          { text: 'Part of Maine', correct: true },
          { text: 'Québec', why: 'Québec was New France too, but not Acadie.' },
          { text: 'Newfoundland', why: 'Not part of Acadie.' },
        ],
        explain: 'Acadie covered today’s Nova Scotia, New Brunswick, PEI and part of Maine.',
      },
      {
        type: 'choice',
        prompt: 'For the next hundred years, what happened to Acadie?',
        options: [
          { text: 'France and England went back and forth: forts were burned, and Acadie was taken, traded and handed back', correct: true },
          { text: 'France ruled it in peace', why: 'England wanted this coast too.' },
          { text: 'England bought it from France', why: 'It changed hands many times, and not by a simple sale.' },
          { text: 'Everyone left after the St. Croix winter', why: 'No. The French stayed, at Port Royal and beyond.' },
        ],
        explain: 'It was a tug of war. Acadie was taken, traded and handed back again and again.',
      },
      {
        type: 'multi',
        prompt: 'A fur trader planned to go home. A family planned to stay. Pick three things a family needed that a trader didn’t.',
        options: [
          { text: 'Farmland to grow food', correct: true },
          { text: 'A house built to last every winter', correct: true },
          { text: 'A village, with neighbours and a church', correct: true },
          { text: 'A ship to sail home every fall', why: 'That is the trader. The family wasn’t going home.' },
          { text: 'Iron kettles to trade for furs', why: 'That is the trader’s business.' },
        ],
        explain: 'In the 1630s the first French families came. They built farms and villages around the Bay of Fundy, had children, and stayed.',
      },
      {
        type: 'choice',
        prompt: 'What made someone Acadian, instead of French?',
        options: [
          { text: 'Growing up here, never seeing France, with this as their only home', correct: true },
          { text: 'Speaking French', why: 'People in France spoke French too. Acadians spoke French, but that isn’t what made them different.' },
          { text: 'Going to a Catholic church', why: 'Most people in France were Catholic too.' },
          { text: 'Being born on a ship', why: 'No. Think about where their home was.' },
        ],
        explain: 'Their children grew up never having seen France. This was their only home, their neighbours and allies were the Mi’kmaq, and over time they stopped thinking of themselves as French. They were Acadians.',
      },
    ],
  },
];

// What each side of the river was doing, month by month (0 = June 1604). Shown on the two-calendar card.
// French side: the reading, plus NPS "Saint Croix Island Settlement" for the supply ship (June 15, 1605), spring in May,
// and de Mons's trip south with the guide Panounias. Snow from October 6 and ice from December are Champlain's.
// Peskotomuhkati side: the seasonal round, in general terms, as taught in the Wabanaki unit and the reading.
// `wood`, `water`, `fresh` are 0..1 (how easy each is to get); `well`, `sick`, `dead` count the 79 men and are
// illustrative between the reading's two fixed points (79 at the start, 35 dead by spring).
export const CALENDAR = [
  { fr: 'The French arrive and choose the island. They start building.', pk: 'Summer by the coast: fishing, clams, berries. Canoes everywhere.', wood: 1, water: 1, fresh: 0.7, sick: 0, dead: 0, camp: 'coast' },
  { fr: 'Houses, a storehouse and gardens go up on the island.', pk: 'Summer by the coast: fishing, clams, berries.', wood: 1, water: 1, fresh: 0.7, sick: 0, dead: 0, camp: 'coast' },
  { fr: 'The houses are finished. Some ships sail home to France.', pk: 'Late summer by the coast. Food is dried and stored for later.', wood: 1, water: 1, fresh: 0.6, sick: 0, dead: 0, camp: 'coast' },
  { fr: 'Champlain sails along the coast, mapping it.', pk: 'Families start moving up the rivers, inland.', wood: 0.9, water: 0.9, fresh: 0.5, sick: 0, dead: 0, camp: 'moving' },
  { fr: 'The first snow falls, early, in October.', pk: 'Families head for their winter hunting grounds inland.', wood: 0.7, water: 0.8, fresh: 0.3, sick: 0, dead: 0, camp: 'inland' },
  { fr: 'Cold sets in. Wood and water come from the shore by boat.', pk: 'Winter camps in the shelter of the forest, close to firewood.', wood: 0.5, water: 0.6, fresh: 0.15, sick: 2, dead: 0, camp: 'inland' },
  { fr: 'Ice fills the river and moves with the tide. Boats can’t cross. The island is cut off.', pk: 'Hunting on snowshoes, travelling by toboggan.', wood: 0.15, water: 0.1, fresh: 0.05, sick: 8, dead: 1, camp: 'inland' },
  { fr: 'They melt snow to drink. The cider freezes and is handed out by the pound.', pk: 'Winter camps inland: fresh meat, shelter, firewood.', wood: 0.1, water: 0.1, fresh: 0, sick: 20, dead: 6, camp: 'inland' },
  { fr: 'Men are sick: swollen gums, loose teeth, swollen legs. Many die.', pk: 'Winter camps inland: fresh meat, shelter, firewood.', wood: 0.1, water: 0.1, fresh: 0, sick: 34, dead: 18, camp: 'inland' },
  { fr: 'Peskotomuhkati people come to the island with fresh meat to trade.', pk: 'Some come out to the island to trade fresh game for bread.', wood: 0.15, water: 0.15, fresh: 0.3, sick: 30, dead: 28, camp: 'visit' },
  { fr: 'The ice breaks up. Spring is late.', pk: 'Families come back down the rivers as the ice goes out.', wood: 0.5, water: 0.6, fresh: 0.3, sick: 22, dead: 34, camp: 'moving' },
  { fr: 'Spring comes. With fresh food, the sick start to get better.', pk: 'Fish run up the rivers. Families return to the coast.', wood: 0.9, water: 1, fresh: 0.7, sick: 12, dead: 35, camp: 'coast' },
  { fr: 'A supply ship arrives from France, on June 15.', pk: 'Summer by the coast again.', wood: 1, water: 1, fresh: 0.8, sick: 4, dead: 35, camp: 'coast' },
  { fr: 'De Mons sails south along the coast, with a guide named Panounias, looking for a better place.', pk: 'Summer by the coast.', wood: 1, water: 1, fresh: 0.8, sick: 0, dead: 35, camp: 'coast' },
  { fr: 'They take the buildings apart and sail for Port Royal.', pk: 'Summer by the coast. The French are leaving.', wood: 1, water: 1, fresh: 0.8, sick: 0, dead: 35, camp: 'coast' },
];
