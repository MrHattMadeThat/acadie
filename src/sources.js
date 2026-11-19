// The sources behind the chapter, to read for yourself (source-viewer.js shows them).
//
// PRIMARY: Champlain's own book, Les Voyages du sieur de Champlain (Paris, 1613). Page images are McGill University
// Library's copy (Lande collection), scanned for the Internet Archive; public domain. For each passage:
//   fr     the French as Champlain printed it, from C.-H. Laverdière's edition (Œuvres de Champlain, Quebec, 1870,
//          Project Gutenberg #17258). Laverdière kept the 1613 spelling but printed v for u and added some accents.
//   en     the English of Charles Pomeroy Otis (Voyages of Samuel de Champlain, vol. 2, Prince Society, Boston,
//          1878; Project Gutenberg #6749). Public domain.
//   plain  our own retelling in today's words, for Grade 8. Nothing is added that the passage does not say.
//   pages  the page scans, with `marks`: [top%, bottom%] bands that show where the passage is on the page.
// "..." marks words left out. Champlain's account of the surgeons opening the bodies is left out on purpose.
//
// SECONDARY: what historians and historic sites say today. National Park Service pages are works of the U.S.
// government (public domain). Parks Canada pages are quoted briefly, with credit, for classroom use.
//
// The page numbers are the ones printed on the 1613 pages. Fetched and checked 2026-11-19.

const IA = 'https://archive.org/details/McGillLibrary-rbsc_lande_00116_c2-19950';
const page = (name, label, marks = [], n) => ({ src: `sources/champlain-1613-${name}.webp`, label, marks, link: `${IA}/page/n${n}/mode/1up` });

export const DOCS = {
  champlain: {
    kind: 'primary',
    title: 'Les Voyages du sieur de Champlain',
    who: 'Samuel de Champlain',
    when: 'Printed in Paris, 1613',
    about: 'Champlain’s own book about his voyages to Acadie, 1604 to 1607. He was on the island the whole winter and saw everything he describes.',
    credit: 'Page images: McGill University Library (Lande collection), via the Internet Archive. French text: Laverdière, 1870. English: C. P. Otis, 1878.',
    link: IA,
    linkText: 'The whole 1613 book',
  },
  nps: {
    kind: 'secondary',
    title: 'Saint Croix Island International Historic Site',
    who: 'U.S. National Park Service',
    when: 'Web pages, 2021 to today',
    about: 'The park on the American side of the river. Park historians wrote these pages from Champlain and other sources.',
    credit: 'Public domain (U.S. government).',
  },
  pc: {
    kind: 'secondary',
    title: 'Saint Croix Island International Historic Site',
    who: 'Parks Canada',
    when: 'Web pages, 2022 to 2024',
    about: 'The lookout and trail on the New Brunswick side, across from the island.',
    credit: '© Parks Canada. Quoted for classroom use.',
  },
};

export const EXCERPTS = {
  // ------------------------------------------------------------------ Champlain, 1613
  'ch-island': {
    doc: 'champlain', title: 'Why the island?', where: 'Book 1, chapter 3, pages 32–33',
    pages: [page('p32', 'Page 32', [[12, 75]], 71), page('p33', 'Page 33', [[9, 12.5], [68.5, 74]], 72)],
    fr: [
      'Nous y trouvasmes deux isles: l’une fort petite proche de la terre de l’ouest: & l’autre au milieu, qui peut avoir huict ou neuf cens pas de circuit, eslevée de tous costez de trois à quatre toises de rochers… L’isle est remplie de sapins, boulleaux, esrables & chesnes. De soy elle est en fort bonne situation, & n’y a qu’un costé où elle baisse d’environ 40 pas, qui est aisé à fortifier, les costes de la terre ferme en estans des deux costez esloignées de quelques neuf cens à mille pas. Il y a des vaisseaux qui ne pourroyent passer sur la riviere qu’à la mercy du canon d’icelle. Qui est le lieu que nous jugeâmes le meilleur: tant pour la situation, bon pays, que pour la communication que nous prétendions avec les sauvages de ces costes & du dedans des terres, estans au millieu d’eux: Lesquels avec le temps on esperoit pacifier, & amortir les guerres qu’ils ont les uns contre les autres, pour en tirer à l’advenir du service: & les réduire à la foy Chrestienne. Ce lieu est nommé par le sieur de Mons l’isle saincte Croix.',
      '[Up the river, at the falls:] Les sauvages s’y retirent quelquesfois cinq ou six sepmaines durant la pesche.',
    ],
    en: [
      'We found two islands: one very small near the western bank; and the other in the middle, having a circumference of perhaps eight or nine hundred paces, with rocky sides three or four fathoms high all around… The island is covered with firs, birches, maples, and oaks. It is by nature very well situated, except in one place, where for about forty paces it is lower than elsewhere: this, however, is easily fortified, the banks of the main land being distant on both sides some nine hundred to a thousand paces. Vessels could pass up the river only at the mercy of the cannon on this island, and we deemed the location the most advantageous, not only on account of its situation and good soil, but also on account of the intercourse which we proposed with the savages of these coasts and of the interior, as we should be in the midst of them. We hoped to pacify them in the course of time, and put an end to the wars which they carry on with one another, so as to derive service from them in future, and convert them to the Christian faith. This place was named by Sieur de Monts the Island of St. Croix.',
      '[Up the river, at the falls:] The savages come here sometimes five or six weeks during the fishing season.',
    ],
    plain: [
      'In the middle of the river we found an island with rocky sides all around. It was covered with fir, birch, maple and oak trees.',
      'It was easy to defend. The shore is 900 to 1,000 steps away on each side, so no ship could go up the river without passing under our cannon.',
      'We also picked it because it was in the middle of the peoples who lived on this coast and inland, and we wanted to be in contact with them. We hoped to end their wars with each other, have them work for us one day, and make them Christians.',
      'De Mons named it Sainte-Croix: Holy Cross. Up the river, at the falls, the people who live here come to fish for five or six weeks at a time.',
    ],
    note: 'Champlain gives his reasons: easy to defend, good land, and in the middle of the peoples who lived here. Notice what is missing. He says nothing about winter, firewood or fresh water.',
  },

  'ch-map': {
    doc: 'champlain', title: 'Champlain’s map of the island', where: 'Fold-out map, facing page 34',
    pages: [page('island-map', 'The map', [], 75)],
    fr: ['Les chifres montrent les brasses d’eau.', 'A Le plan de l’habitation. B Jardinages. C Petit islet servant de platte forme à mettre le canon. D Platte forme où on mettoit du canon. E Le cimetière. F La chappelle. G Basses de rochers autour de l’isle saincte Croix. H Un petit islet. I Le lieu où le sieur de Mons avoit fait commencer un moulin à eau. L Place où l’on faisoit le charbon. M Jardinages à la grande terre de l’Ouest. N Autres jardinages à la grande terre de l’Est. O Grande montaigne fort haute dans la terre. P Riviere des Etechemins passant au tour de l’isle saincte Croix.'],
    en: ['The figures indicate fathoms of water.', 'A. A plan of our habitation. B. Gardens. C. Little islet serving as a platform for cannon. D. Platform where cannon were placed. E. The Cemetery. F. The Chapel. G. Rocky shoals about the Island Sainte Croix. H. A little islet. I. Place where Sieur de Monts had a water-mill commenced. L. Place where we made our coal. M. Gardens on the western shore. N. Other gardens on the eastern shore. O. Very large and high mountain on the main land. P. River of the Etechemins flowing about the Island of St. Croix.'],
    plain: [
      'The numbers in the water are depths, in fathoms (one fathom is about 1.6 m).',
      'A the houses. B gardens. C a little islet with a cannon. D a platform with cannon. E the cemetery. F the chapel. G rocks around the island. H a little islet.',
      'On the shores: I where de Mons began a water mill. L where they made charcoal. M gardens on the west shore. N gardens on the east shore. O a big, high mountain inland. P the river of the Etechemins, flowing around the island.',
    ],
    note: 'North is to the right on this map, with west at the top. The Etechemin were ancestors of today’s Peskotomuhkati (Passamaquoddy), so Champlain named the river after them.',
  },

  'ch-fort': {
    doc: 'champlain', title: 'The cannon islet, the mosquitoes, the storehouse', where: 'Book 1, chapter 4, pages 35–36',
    pages: [page('p35', 'Page 35', [[26, 56]], 76), page('p36', 'Page 36', [[14, 40]], 77)],
    fr: [
      'N’ayant trouvé lieu plus propre que ceste Isle, nous commençâmes à faire une barricade sur un petit islet un peu separé de l’isle, qui servoit de platte-forme pour mettre nostre canon. Chacun s’y employa si vertueusement qu’en peu de temps elle fut rendue en defence, bien que les mousquittes (qui sont petites mouches) nous apportassent beaucoup d’incommodité au travail: car il y eust plusieurs de nos gens qui eurent le visage si enflé par leur piqueure qu’ils ne pouvoient presque voir.',
      '… Aprez que le sieur de Mons eut prins la place du Magazin qui contient neuf thoises de long, trois de large & douze pieds de haut, il print le plan de son logis, qu’il fit promptement bastir par de bons ouvriers, puis après donna à chacun sa place… Alors tous se mirent à deffricher l’isle, aller au bois, charpenter, porter de la terre & autres choses necessaires pour les bastimens.',
    ],
    en: [
      'Not finding any more suitable place than this island, we commenced making a barricade on a little islet a short distance from the main island, which served as a station for placing our cannon. All worked so energetically that in a little while it was put in a state of defence, although the mosquitoes (which are little flies) annoyed us excessively in our work. For there were several of our men whose faces were so swollen by their bites that they could scarcely see.',
      '… After Sieur de Monts had determined the place for the storehouse, which is nine fathoms long, three wide, and twelve feet high, he adopted the plan for his own house, which he had promptly built by good workmen, and then assigned to each one his location… Then all set to work to clear up the island, to go to the woods, to make the frame work, to carry earth and other things necessary for the buildings.',
    ],
    plain: [
      'There was no better place than this island, so we started by building a barricade on a little islet just off it, to hold our cannon.',
      'Everyone worked so hard that it was ready very quickly, even though the mosquitoes (“little flies”) bothered us badly. Some men’s faces swelled up so much from the bites that they could hardly see.',
      'De Mons chose the spot for the storehouse: about 17 m long, 6 m wide and 4 m high. Then his own house went up, and everyone got a place.',
      'Then everyone set to work: clearing the island, cutting wood in the forest, building frames, and carrying earth for the buildings.',
    ],
    note: 'The cannon islet is C on Champlain’s map. “Clear up the island” means cutting down its trees: that is why the island in the game is open ground with stumps.',
  },

  'ch-mill': {
    doc: 'champlain', title: 'The hand mill, and gardens in the sand', where: 'Book 1, chapter 4, page 37',
    pages: [page('p37', 'Page 37', [[30, 55]], 78)],
    fr: ['L’on fit aussi un four, & un moulin à bras pour moudre nos bleds, qui donna beaucoup de peine & travail à la pluspart, pour estre chose pénible. L’on fit après quelques jardinages, tant à la grand terre que dedans l’isle, où on sema plusieurs sortes de graines, qui y vindrent fort bien, horsmis en l’isle; d’autant que ce n’estoit que Sable qui brusloit tout, lors que le soleil donnoit, encore qu’on prist beaucoup de peine à les arrouser.'],
    en: ['An oven was also made, and a handmill for grinding our wheat, the working of which involved much trouble and labor to the most of us, since it was a toilsome operation. Some gardens were afterwards laid out, on the main land as well as on the island. Here many kinds of seeds were planted, which flourished very well on the main land, but not on the island, since there was only sand here, and the whole were burned up when the sun shone, although special pains were taken to water them.'],
    plain: [
      'We built an oven, and a hand mill to grind our wheat into flour. Turning it was hard, tiring work for most of us.',
      'Then we made gardens, on the shore and on the island. On the shore the seeds grew very well. On the island they did not: it was only sand, and the sun burned everything up, even though we worked hard to water it.',
    ],
    note: 'The gardens are another clue that the island was a hard place to live. Food grew on the shores, across the water.',
  },

  'ch-plan': {
    doc: 'champlain', title: 'Champlain’s plan of the habitation', where: 'Page 38',
    pages: [page('p38-plan', 'Page 38', [], 79)],
    fr: ['A Logis du sieur de Mons. B Maison publique où l’on passait le temps durant la pluie. C Le magasin. D Logement des suisses. E La forge. F Logement des charpentiers. G Le puis. H Le four où l’on faisoit le pain. I La cuisine. L Jardinages. M Autres jardins. N La place où au milieu y a un arbre. O Palissade. P Logis des sieurs d’Orville, Champlain & Chandoré. Q Logis du sieur Boulay, & autres artisans. R Logis où logeoient les sieurs de Geneston, Sourin & autres artisans. T Logis des sieurs de Beaumont, la Motte Bourioli & Fougeray. V Logement de nostre curé. X Autres jardinages. Y La riviere qui entoure l’isle.'],
    en: ['A. Dwelling of Sieur de Monts. B. Public building where we spent our time when it rained. C. The storehouse. D. Dwelling of the guard [Champlain wrote “des suisses”, of the Swiss]. E. The blacksmith shop. F. Dwelling of the carpenters. G. The well. H. The oven where the bread was made. I. Kitchen. L. Gardens. M. Other gardens. N. Place in the centre where a tree stands. O. Palisade. P. Dwellings of the Sieurs d’Orville, Champlain, and Champdoré. Q. Dwelling of Sieur Boulay, and other artisans. R. Dwelling where the Sieurs de Genestou, Sourin, and other artisans lived. T. Dwelling of the Sieurs de Beaumont, la Motte Bourioli, and Fougeray. V. Dwelling of our curate. X. Other gardens. Y. The river surrounding the island.'],
    plain: [
      'A de Mons’s house. B a shared building, for when it rained. C the storehouse. D the house of the Swiss soldiers. E the blacksmith. F the carpenters. G the well. H the bread oven. I the kitchen.',
      'L, M, X gardens. N a square with a tree in the middle. O a fence of stakes. P Champlain’s house, shared with d’Orville and Champdoré. Q, R, T houses of gentlemen and craftsmen. V the priest’s house. Y the river all around.',
    ],
    note: 'The houses in the game are laid out from this plan, letter by letter. Historians think the real settlement may have been less tidy than Champlain drew it.',
  },

  'ch-snow': {
    doc: 'champlain', title: 'Shellfish, then snow and ice', where: 'Book 1, chapter 6, page 52',
    pages: [page('p52', 'Page 52', [[44, 52.5], [53, 82]], 93)],
    fr: [
      'Autour de nostre habitation il y a de basse mer quantité de coquillages, comme coques, moulles, ourcins & bregaux, qui faisoyent grand bien à chacun.',
      'Les neges commencèrent le 6 du mois d’Octobre. Le 3 de Décembre nous vismes passer des glasses qui venoyent de quelque riviere qui estoit gellée. Les froidures furent aspres & plus excessives qu’en France, & beaucoup plus de durée: & n’y pleust presque point cest yver. Je croy que cela provient des vents du nord & norouest, qui passent par dessus de hautes montaignes qui sont tousjours couvertes de neges, que nous eusmes de trois à quatre pieds de haut, jusques à la fin du mois d’Avril.',
    ],
    en: [
      'Around our habitation there is, at low tide, a large number of shell-fish, such as cockles, muscles, sea-urchins, and sea-snails, which were very acceptable to all.',
      'The snows began on the 6th of October. On the 3d of December, we saw ice pass which came from some frozen river. The cold was sharp, more severe than in France, and of much longer duration; and it scarcely rained at all the entire winter. I suppose that is owing to the north and north-west winds passing over high mountains always covered with snow. The latter was from three to four feet deep up to the end of the month of April.',
    ],
    plain: [
      'Around our houses, at low tide, there were lots of shellfish: clams, mussels, sea urchins and snails. Everyone was glad of them.',
      'The snow started on October 6. On December 3 we saw ice floating down from a river that had frozen. The cold was harsher than in France and lasted much longer, and it hardly rained all winter. The snow was three to four feet deep (about a metre) until the end of April.',
    ],
    note: 'These are the dates the game’s calendar uses: the first snow in October, ice in the river from early December.',
  },

  'ch-scurvy': {
    doc: 'champlain', title: 'The sickness', where: 'Book 1, chapter 6, pages 53–55',
    pages: [page('p53', 'Page 53', [[15, 64]], 94), page('p54', 'Page 54', [[9, 17], [76, 82]], 95), page('p55', 'Page 55', [[8, 17]], 96)],
    fr: [
      'Durant l’yver il se mit une certaine maladie entre plusieurs de nos gens, appelée mal de la terre, autrement Scurbut, à ce que j’ay ouy dire depuis à des hommes doctes… Les dents ne leur tenoient presque point, & les pouvoit on arracher avec les doits sans leur faire douleur… Apres il leur prenoit une grande douleur de bras & de jambes, lesquelles leur demeurèrent grosses & fort dures… & ne peuvoient marcher…',
      '… de façon que de 79 que nous estions, il en moururent 35 & plus de 20. qui en furent bien prés… Nous ne pusmes trouver aucun remède pour la curation de ces maladies…',
      'Ceux qui y resterent malades furent guéris au printemps, lequel commence en ces pays là est en May. Cela nous fit croire que le changement de saison leur rendit plustost la santé que les remèdes qu’on leur avoit ordonnés.',
    ],
    en: [
      'During the winter, many of our company were attacked by a certain malady called the mal de la terre; otherwise scurvy, as I have since heard from learned men… Their teeth became very loose, and could be pulled out with the fingers without its causing them pain… Afterwards, a violent pain seized their arms and legs, which remained swollen and very hard… and they could not walk…',
      '… So that out of seventy-nine, who composed our party, thirty-five died, and more than twenty were on the point of death… We were unable to find any remedy for these maladies…',
      'Those who continued sick were healed by spring, which commences in this country in May. That led us to believe that the change of season restored their health rather than the remedies prescribed.',
    ],
    plain: [
      'In the winter many of our men caught a sickness they called “mal de la terre”, the land sickness. Learned men later told me it is called scurvy.',
      'Their teeth got so loose you could pull them out with your fingers. Their arms and legs hurt and swelled up hard, and they could not walk.',
      'Of the 79 of us, 35 died, and more than 20 others nearly died. We could not find any cure.',
      'The ones still sick got better in the spring, which comes here in May. We thought the change of season healed them, more than any medicine.',
    ],
    note: 'Champlain did not know what caused it. Today we know: scurvy comes from going without vitamin C, which is in fresh food. Spring brought fresh food back. The pages also describe what the surgeons found when they examined the men who died; we have left that part out.',
  },

  'ch-cider': {
    doc: 'champlain', title: 'Frozen cider, melted snow, and the ice', where: 'Book 1, chapter 6, pages 55–56',
    pages: [page('p55', 'Page 55', [[20, 55], [60, 71]], 96), page('p56', 'Page 56', [[9, 19]], 97)],
    fr: [
      'Durant cet yver nos boissons gelèrent toutes, horsmis le vin d’Espagne. On donnoit le cidre à la livre. La cause de ceste parte fut qu’il n’y avoit point de caves au magazin: & que l’air qui entroit par des fentes y estoit plus aspre que celuy de dehors. Nous estions contraints d’user de tresmauvaises eaux, & boire de la nege fondue, pour n’avoir ny fontaines ny ruisseaux: car il n’estoit pas possible d’aller en la grand terre, à cause des grandes glaces que le flus & reflus charioit, qui est de trois brasses de basse & haute mer.',
      'Le travail du moulin à bras estoit fort pénible: d’autant que la plus part estans mal couchez, avec l’incommodité du chauffage que nous ne pouvions avoir à cause des glaces, n’avoient quasi point de force, & aussi qu’on ne mangeoit que chair salée & légumes durant l’yver, qui engendrent de mauvais sang: ce qui à mon opinion causoit en partie ces facheuses maladies.',
      'Il estoit mal-aisé de recognoistre ce pays sans y avoir yverné, car y arrivant en été tout y est fort aggreable, à cause des bois, beaux pays & bonnes pescheries de poisson de plusieurs sortes que nous y trouvasmes. Il y a six mois d’yver en ce pays.',
    ],
    en: [
      'During this winter, all our liquors froze, except the Spanish wine. Cider was dispensed by the pound. The cause of this loss was that there were no cellars to our storehouse, and that the air which entered by the cracks was sharper than that outside. We were obliged to use very bad water, and drink melted snow, as there were no springs nor brooks; for it was not possible to go to the main land in consequence of the great pieces of ice drifted by the tide, which varies three fathoms between low and high water.',
      'Work on the hand-mill was very fatiguing, since the most of us, having slept poorly, and suffering from insufficiency of fuel, which we could not obtain on account of the ice, had scarcely any strength, and also because we ate only salt meat and vegetables during the winter, which produce bad blood. The latter circumstance was, in my opinion, a partial cause of these dreadful maladies.',
      'It would be very difficult to ascertain the character of this region without spending a winter in it; for, on arriving here in summer, every thing is very agreeable, in consequence of the woods, fine country, and the many varieties of good fish which are found there. There are six months of winter in this country.',
    ],
    plain: [
      'That winter all our drinks froze except the Spanish wine. The cider was handed out by the pound, like cheese. The storehouse had no cellar, and the wind through the cracks was colder than the air outside.',
      'We had to drink very bad water and melted snow. There were no springs or streams on the island, and we could not get to the shore: the tide, which rises and falls about 5 m, pushed big pieces of ice up and down the river.',
      'Grinding wheat in the hand mill wore us out. Most of us slept badly, we were short of firewood because of the ice, and we ate only salted meat and dried vegetables all winter. I think that food was part of the cause of the sickness.',
      'You can’t really know this country until you spend a winter in it. In summer it is lovely: woods, fine land, lots of fish. But there are six months of winter here.',
    ],
    note: 'One page, three of the chapter’s answers: the frozen cider, the melted snow, and the ice that cut the island off from firewood and fresh water. Champlain’s guess about the salted food was close to right.',
  },

  'ch-neighbours': {
    doc: 'champlain', title: 'How the people here lived through the winter', where: 'Book 1, chapter 6, pages 56–57',
    pages: [page('p56', 'Page 56', [[20, 86]], 97), page('p57', 'Page 57', [[9, 40]], 98)],
    fr: [
      'Les sauvages qui y habitent sont en petite quantité. Durant l’yver au fort de neges ils vont chasser aux eslans & autres bestes: de quoy ils vivent la pluspart du temps… Lors qu’ils ne vont à la chasse ils vivent d’un coquillage qui s’appelle coque. Ils se vestent l’yver de bonnes fourrures de castors & d’eslans. Les femmes font tous les habits, mais non pas si proprement qu’on ne leur voye la chair au dessous des aisselles, pour n’avoir pas l’industrie de les mieux accommoder.',
      'Quand ils vont à la chasse ils prennent de certaines raquettes, deux fois aussi grandes que celles de pardeçà, qu’ils s’attachent soubs les pieds, & vont ainsi sur la neige sans enfoncer, aussi bien les femmes & enfans, que les hommes, lesquels cherchent la piste des animaux; puis l’ayant trouvée ils la suivent jusques à ce qu’ils apercoivent la beste: & lors ils tirent dessus avec leur arcs… d’autant que ces animaux ne peuvent aller sur les neges sans enfoncer dedans: Et lors les femmes & enfans y viennent, & là cabannent & se donnent curée: Apres ils retournent voir s’ils en trouveront d’autres, & passent ainsi l’yver.',
      'Au mois de Mars ensuivant il vint quelques sauvages qui nous firent part de leur chasse en leur donnant du pain & autres choses en eschange. Voila la façon de vivre en yver de ces gens là, qui me semble estre bien miserable.',
    ],
    en: [
      'The savages who dwell here are few in number. During the winter, in the deepest snows, they hunt elks and other animals, on which they live most of the time… When they do not hunt, they live on a shell-fish, called the cockle. They clothe themselves in winter with good furs of beaver and elk. The women make all the garments, but not so exactly but that you can see the flesh under the arm-pits, because they have not ingenuity enough to fit them better.',
      'When they go a hunting, they use a kind of snow-shoe twice as large as those hereabouts, which they attach to the soles of their feet, and walk thus over the snow without sinking in, the women and children as well as the men. They search for the track of animals, which, having found, they follow until they get sight of the creature, when they shoot at it with their bows… as the animals cannot walk on the snow without sinking in. Then the women and children come up, erect a hut, and they give themselves to feasting. Afterwards, they return in search of other animals, and thus they pass the winter.',
      'In the month of March following, some savages came and gave us a portion of their game in exchange for bread and other things which we gave them. This is the mode of life in winter of these people, which seems to me a very miserable one.',
    ],
    plain: [
      'Not many people live here. In winter, when the snow is deepest, they hunt moose and other animals, and live mostly on that meat. When they are not hunting, they eat clams. In winter they wear warm beaver and moose furs. The women make all the clothes.',
      'To hunt, they wear snowshoes, twice as big as ours, and walk on top of the snow: women and children as well as men. They follow an animal’s tracks until they see it. The animal sinks into the deep snow, so the hunters can catch up with it. Then the women and children come, set up a shelter, and they all feast. Then they go looking for more. That is how they spend the winter.',
      'In March, some of them came to the island and shared their hunt with us, in exchange for bread and other things. Champlain ends: their way of living in winter seems “very miserable” to him.',
    ],
    note: 'Read it like a historian. Champlain calls these people “sauvages” (savages), mocks the women’s sewing, and calls their winter “miserable”. But look at what he describes: families on snowshoes eating fresh meat all winter, while his own men lived on salted food and 35 of them died. His words tell us how the French saw the people here, not only how the people lived. He does not say which people came in March.',
  },

  'ch-move': {
    doc: 'champlain', title: 'Moving to Port Royal', where: 'Book 1, chapter 10, page 95',
    pages: [page('p95', 'Page 95', [[46, 80]], 138)],
    fr: ['Le sieur de Mons se délibéra de changer de lieu & faire une autre habitation pour esviter aux froidures & mauvais yver qu’avions eu en l’isle saincte Croix. N’ayant trouvé aucun port qui nous fut propre pour lors, & le peu de temps que nous avions à nous loger & bastir des maisons à cest effect, nous fit équipper deux barques, que l’on chargea de la charpenterie des maisons de saincte Croix, pour la porter au port Royal, à 25 lieues de là, où l’on jugeoit y estre la demeure beaucoup plus douce & tempérée.'],
    en: ['Sieur de Monts determined to change his location, and make another settlement, in order to avoid the severe cold and the bad winter which we had had in the Island of St. Croix. As we had not, up to that time, found any suitable harbor, and, in view of the short time we had for building houses in which to establish ourselves, we fitted out two barques, and loaded them with the frame-work taken from the houses of St. Croix, in order to transport it to Port Royal, twenty-five leagues distant, where we thought the climate was much more temperate and agreeable.'],
    plain: [
      'De Mons decided to move and build a new settlement, to get away from the cold and the bad winter we had on Sainte-Croix.',
      'There was little time to build new houses, so we loaded two boats with the wooden frames of the houses on Sainte-Croix and took them to Port Royal, 25 leagues away (about 100 km), where we thought the weather would be much milder.',
    ],
    note: 'They took the buildings apart and carried the frames away. That is why only the stone footings stayed on the island.',
  },

  'ch-pr-winter': {
    doc: 'champlain', title: 'The next winter, at Port Royal', where: 'Book 1, chapter 10, page 101',
    pages: [page('p101', 'Page 101', [[9, 27], [51, 62]], 144)],
    fr: [
      'Nous trouvasmes de nos gens malades du mal de la terre, mais non si griefvement qu’en l’isle S. Croix, bien que de 45 que nous estions il en mourut 12 dont le mineur fut du nombre, & cinq malades, qui guérirent le printemps venant.',
      '… Le 20 Decembre il commença à neger: & passa quelques glaces par devant nostre habitation. L’yver ne fut si aspre qu’il avoit esté l’année d’auparavant, ny les neges si grandes, ny de si longue durée.',
    ],
    en: [
      'We found some of our company sick with the mal de la terre, but not so seriously as at the Island of St. Croix; although, out of our number of forty-five, twelve died, including the miner, and five were sick, who recovered the following spring.',
      '… On the 20th of December, it began to snow, and some ice passed along before our settlement. The winter was not so sharp as the year before, nor the snow so deep, or of so long duration.',
    ],
    plain: [
      'Some of our men were sick with the land sickness again, but not as badly as on Sainte-Croix. Of the 45 of us, 12 died, and five were sick and got better in the spring.',
      'The snow started on December 20. The winter was not as harsh as the year before, and the snow was not as deep and did not last as long.',
    ],
    note: 'Sources can disagree. Champlain, who was there, counts 12 dead out of 45 at Port Royal that winter. The National Park Service says five. Which would you trust more, and why?',
  },

  // ------------------------------------------------------------------ secondary: National Park Service
  'nps-expedition': {
    doc: 'nps', title: 'The king’s grant, and who came', where: '“The Saint Croix Island Settlement”',
    link: 'https://www.nps.gov/articles/000/saint-croix-island-settlement.htm',
    quote: [
      'On November 8, 1603, Henry IV of France granted Pierre Dugua, Sieur de Mons, a monopoly for the conduct of the fur trade and the title of lieutenant-governor of the territory between the 40th and 46th parallels known as La Cadie. In return, De Mons was expected to colonize the country and convert the First Peoples to Christianity. The terms of the grant described the region’s inhabitants as “men barbarous, atheists, without faith or religion”. In reality, the Passamaquoddy and the other First Peoples had a rich and elaborate set of spiritual beliefs that infused every aspect of their lives and their relationships with their environment.',
      'De Mons … recruited 120 noblemen, artisans and soldiers, and chartered five ships for the journey… De Mons also brought along a surgeon, a miner, a Roman Catholic priest and a Protestant (Huguenot) minister… The expedition sailed from Havre de Grâce (now Le Havre), France in March 1604.',
    ],
    plain: [
      'In 1603 the King of France gave de Mons the fur trade of Acadie, all to himself. In return, de Mons had to start a colony and make the people who lived there Christians.',
      'The king’s paper called those people “barbarous” and without religion. That was wrong: they had rich beliefs of their own.',
      'De Mons hired five ships and sailed from France in March 1604, with craftsmen, soldiers, a surgeon, a Catholic priest and a Protestant minister.',
    ],
    note: 'A monopoly means nobody else is allowed to do that business. That was the king’s promise to de Mons.',
  },
  'nps-summer': {
    doc: 'nps', title: 'Settling in, summer 1604', where: '“The Saint Croix Island Settlement”',
    link: 'https://www.nps.gov/articles/000/saint-croix-island-settlement.htm',
    quote: [
      'At the end of June, after exploring the mouth of the St. John River, the group arrived at Passamaquoddy Bay. Here they found an island situated inland near the confluence of three rivers. Blessed with an abundance of resources, especially herring and bass, and easily defended against possible attack, it seemed a promising site for a settlement.',
      'Following this, the men set to clearing the island and the adjacent mainland. Before long they had created a small hamlet with a storehouse, gardens, oven, hand mill for grinding wheat, and a cluster of dwellings. With work progressing well, Sieur De Mons sent Champlain off for three weeks to explore southward… Champlain returned to St. Croix Island around the end of September.',
    ],
    plain: [
      'At the end of June 1604 the French reached Passamaquoddy Bay and found the island. It had lots of fish nearby and looked easy to defend.',
      'They cleared the island and part of the shore, and soon had a storehouse, gardens, an oven, a hand mill and houses. Champlain went away for about three weeks to map the coast, and came back around the end of September.',
    ],
  },
  'nps-winter': {
    doc: 'nps', title: 'A devastating winter', where: '“The Saint Croix Island Settlement”',
    link: 'https://www.nps.gov/articles/000/saint-croix-island-settlement.htm',
    quote: [
      'Soon the snow began to fall and the early start of an unusually severe winter cut short the settlers’ preparations. Before long the river filled with treacherous ice cakes, making it impossible to cross. Cut off from the mainland, they began to suffer from a shortage of drinking water, firewood, and other hardships. The cider froze and had to be given out by the pound. The settlers were forced to drink Spanish wine and melted snow. Lacking fresh fruit and vegetables, the men fell prey to scurvy.',
      'Of the 79 men who had stayed at St. Croix for the winter, 35 died, and 20 more came close to the same fate… Spring came at last in May, and the health of the settlement was restored. On June 15, 1605, Pontgravé arrived with a ship loaded with supplies.',
    ],
    plain: [
      'Winter came early and hard. Ice filled the river, so nobody could cross. Cut off from the shore, the men ran short of drinking water and firewood. The cider froze and was handed out by the pound. They drank Spanish wine and melted snow.',
      'With no fresh fruit or vegetables, they got scurvy. Of 79 men, 35 died and 20 more nearly died. Spring came in May, and a supply ship arrived on June 15, 1605.',
    ],
  },
  'nps-portroyal': {
    doc: 'nps', title: 'The move to Port Royal', where: '“The Saint Croix Island Settlement”',
    link: 'https://www.nps.gov/articles/000/saint-croix-island-settlement.htm',
    quote: [
      'Upon their return to St. Croix in early August, De Mons gave the order to move the settlement to Port Royal. Although the task of moving the colony before winter was daunting, the settlers quickly dismantled their buildings, loaded their ships, and set sail for their new home.',
      'The move to Port Royal went well. The settlers were blessed with a much milder winter than the one before, and although scurvy again proved a problem, this time the colony lost only five of its residents to the disease. Water and game were readily available, and the local Mi’kmaq came to the settlement to trade fresh meat for French bread.',
    ],
    plain: [
      'In August 1605 de Mons ordered the move. The men quickly took their buildings apart, loaded the ships and sailed to Port Royal.',
      'The next winter was much milder. Scurvy came back, but this time five men died. Water and game were close by, and the Mi’kmaq who lived there came to trade fresh meat for French bread.',
    ],
    note: 'Champlain’s own count of the dead that winter is different. Compare his page 101.',
  },
  'nps-passamaquoddy': {
    doc: 'nps', title: 'The Passamaquoddy and the island', where: '“Saint Croix Island: Historical Context”',
    link: 'https://www.nps.gov/articles/000/saint-croix-island-historical-context.htm',
    quote: [
      'The island itself was already known and used by the Wapaponiyik (or Waponahki) First Peoples of the region who helped the French and taught them how to survive in the unfamiliar climate and territory… The original Passamaquoddy name is thought to be “Muttoneguis”.',
      'St. Croix Island itself, as well as its immediate surroundings, was home to the Passamaquoddy, or people of the Pollock. Sea mammal hunters and fishermen, they lived in small settlements during the winter and large villages in summer. Together they hunted for seals, porpoise, and fish, gathered roots and wild grapes, and made sugar from the maple trees along the shores of Passamaquoddy Bay. Passamaquoddy technology included birch bark homes, canoes, and containers, as well as the snowshoe and toboggan.',
    ],
    plain: [
      'The island was already known and used by the Wabanaki peoples, who helped the French and taught them how to survive here. The Passamaquoddy name for it is thought to be Muttoneguis.',
      'This was Passamaquoddy (Peskotomuhkati) homeland. They hunted seal and porpoise, fished, gathered roots and wild grapes, and made maple sugar. They lived in big villages in summer and small camps in winter, and made birch bark homes, canoes, snowshoes and toboggans.',
    ],
  },
  'nps-history': {
    doc: 'nps', title: 'The Passamaquoddy year, and spring 1605', where: '“History & Culture”, Saint Croix Island IHS',
    link: 'https://www.nps.gov/sacr/learn/historyculture/index.htm',
    quote: [
      'The Passamaquoddy people roamed through the area in accordance with the seasons, dictated by the availability of food. Summers would be spent around the coasts and islands of the area… With the cold weather, they moved inland and hunted bigger game for food and other materials of value for living.',
      'The Frenchmen met the Passamaquoddy who supplied the furs the French sought in exchange for hatchets, knives, glass beads, metal cookware, and other goods.',
      'In the following spring of 1605, the Passamaquoddy returned from their winter sojourn to the shores of Saint Croix Island. With their help, the health of the remaining French improved.',
    ],
    plain: [
      'The Passamaquoddy moved with the seasons, to wherever the food was. Summers on the coast and the islands. In the cold, inland, hunting bigger animals.',
      'They traded furs to the French for hatchets, knives, glass beads and metal pots.',
      'In the spring of 1605 they came back from their winter camps to the shores around the island. With their help, the French who were still alive got healthier.',
    ],
  },
  'nps-fishfur': {
    doc: 'nps', title: 'Fish and fur, before 1604', where: '“Saint Croix Island: Historical Context”',
    link: 'https://www.nps.gov/articles/000/saint-croix-island-historical-context.htm',
    quote: ['By the mid-16th century, French and Basque fishers were making annual forays to the waters off Newfoundland and Nova Scotia to satisfy the increasing European demand for fish and whale oil. As well, entrepreneurs were trading axes, knives, and glass beads with the First Peoples for furs… Still, these contacts were fleeting.'],
    plain: ['By the 1550s, French and Basque fishermen were crossing every year to fish off Newfoundland and Nova Scotia, because Europe wanted fish. Traders also swapped axes, knives and glass beads with the First Peoples for furs. But they all went home again.'],
  },

  // ------------------------------------------------------------------ secondary: Parks Canada
  'pc-colony': {
    doc: 'pc', title: 'Who wintered on the island', where: '“A French Colony in Acadie”',
    link: 'https://parks.canada.ca/lhn-nhs/nb/stcroix/culture/colonie-colony',
    quote: ['Seventy-nine men, including noblemen, artisans, labourers, Catholic and Protestants clerics, surgeons and soldiers spent the winter of 1604-05 on Saint Croix Island. The French brought with them things they considered essential, such as weapons, grains, utensils, tools, trade goods, and a few prefabricated frame buildings.'],
    plain: ['The 79 men who spent the winter were noblemen, craftsmen, labourers, a Catholic priest and a Protestant minister, surgeons and soldiers. They brought weapons, grain, tools, trade goods, and a few buildings made in France in pieces, ready to put together.'],
  },
  'pc-winter': {
    doc: 'pc', title: 'The burials', where: '“A Winter of Despair”',
    link: 'https://parks.canada.ca/lhn-nhs/nb/stcroix/culture/hiver-winter',
    quote: [
      'In 1968-69, archaeologists examined 23 burials on Saint Croix Island. The bodies were buried with the feet towards the east, as was the Christian burial practice at the time… Research in 1995 suggests that the deceased men ranged in age from about 17 to 45 years old.',
      'In December 1605, Sieur de Mons testified that: “…on the last day of March 1605… René Noël, Sieur de Bourgioly of Vitrey, Bretagne… died on Saint Croix Island of scurvy… and was buried on the island the same day he died.” (National Archives of Canada)',
    ],
    plain: [
      'In 1968–69 archaeologists studied 23 graves on the island. The men were buried facing east, the Christian way at the time. They were between about 17 and 45 years old.',
      'De Mons later swore, in an official paper, that one of his men, René Noël, died of scurvy on the island on March 31, 1605, and was buried the same day.',
    ],
    note: 'De Mons’s statement is a primary source (a paper written at the time) quoted inside a secondary one.',
  },
};

// The short names stories.js uses (`source: 'PLAN; NPS'`), for anything that has no `cite` list.
export const SHORT = {
  PLAN: ['ch-plan'], MAP: ['ch-map'], NPS: ['nps-winter'], NPSH: ['nps-passamaquoddy'], PC: ['pc-colony'],
};

// What a source's button says.
export function chipLabel(id) {
  const x = EXCERPTS[id];
  if (!x) return id;
  return x.doc === 'champlain' ? `Champlain, 1613: ${x.title}` : `${DOCS[x.doc].who}: ${x.title}`;
}
