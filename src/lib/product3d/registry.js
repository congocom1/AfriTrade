import { buildSolarPanel, buildSolarBattery } from './models/energy.js';
import {
  buildLaptopEliteBook,
  buildLaptopIdeaPad,
  buildPhoneItel,
  buildPhoneTecno,
  buildTelevision,
  buildSpeaker,
  buildBlender,
  buildFridge,
} from './models/electronics.js';
import {
  buildGenerator,
  buildWelder,
  buildMaizeSheller,
  buildWaterPump,
  buildGrindingMill,
  buildBlockMachine,
} from './models/machines.js';
import { buildTyre, buildBrakePads, buildRoofingSheet, buildCementSack, buildCarton, buildSacks } from './models/goods.js';
import {
  buildDiningSet,
  buildSofa,
  buildBasket,
  buildCushions,
  buildShirt,
  buildDress,
  buildHairOil,
  buildCreamJar,
  buildBloodPressureMonitor,
  buildOximeter,
} from './models/living.js';

const BUILDERS = {
  'solar-panel': buildSolarPanel,
  'solar-battery': buildSolarBattery,
  'laptop-elitebook': buildLaptopEliteBook,
  'laptop-ideapad': buildLaptopIdeaPad,
  'phone-itel': buildPhoneItel,
  'phone-tecno': buildPhoneTecno,
  television: buildTelevision,
  speaker: buildSpeaker,
  blender: buildBlender,
  fridge: buildFridge,
  generator: buildGenerator,
  welder: buildWelder,
  'maize-sheller': buildMaizeSheller,
  'water-pump': buildWaterPump,
  'grinding-mill': buildGrindingMill,
  'block-machine': buildBlockMachine,
  tyre: buildTyre,
  'brake-pads': buildBrakePads,
  'roofing-sheet': buildRoofingSheet,
  'cement-sack': buildCementSack,
  carton: buildCarton,
  sacks: buildSacks,
  'dining-set': buildDiningSet,
  sofa: buildSofa,
  basket: buildBasket,
  cushions: buildCushions,
  shirt: buildShirt,
  dress: buildDress,
  'hair-oil': buildHairOil,
  'cream-jar': buildCreamJar,
  'bp-monitor': buildBloodPressureMonitor,
  oximeter: buildOximeter,
};

/** Product names and categories first, then the category fallbacks. */
const MATCHERS = [
  ['solar-panel', ['solar panel', 'panneau solaire', 'monocrystalline', 'monocristallin']],
  ['solar-battery', ['deep cycle', 'solar battery', 'batterie solaire']],
  ['generator', ['generator', 'groupe electrogene', 'generatrice']],
  ['welder', ['welding', 'welder', 'soudure']],
  ['maize-sheller', ['maize sheller', 'sheller', 'egreneuse']],
  ['water-pump', ['water pump', 'pompe a eau', 'pompe']],
  ['grinding-mill', ['grinding mill', 'cassava', 'moulin']],
  ['block-machine', ['block making', 'block machine', 'parpaing']],
  ['tyre', ['tyre', 'tire', 'pneu', '265/65']],
  ['brake-pads', ['brake pad', 'brake', 'plaquette']],
  ['laptop-elitebook', ['elitebook']],
  ['laptop-ideapad', ['ideapad', 'laptop', 'notebook', 'ordinateur portable']],
  ['phone-itel', ['itel']],
  ['phone-tecno', ['tecno', 'spark']],
  ['television', ['smart led tv', 'television', 'televiseur', 'led tv']],
  ['speaker', ['partybox', 'speaker', 'enceinte']],
  ['blender', ['blender', 'mixeur']],
  ['fridge', ['fridge', 'refrigerator', 'refrigerateur']],
  ['roofing-sheet', ['roofing', 'corrugated', 'tole']],
  ['cement-sack', ['cement', 'ciment']],
  ['carton', ['carton']],
  ['sacks', ['sack', 'polypropylene', 'sac ']],
  ['dining-set', ['dining table', 'table set', 'seater dining']],
  ['sofa', ['sofa', 'canape']],
  ['basket', ['basket', 'raffia', 'panier']],
  ['cushions', ['cushion', 'coussin']],
  ['shirt', ['shirt', 'chemise']],
  ['dress', ['dress', 'robe', 'ankara']],
  ['hair-oil', ['hair oil', 'argan', 'huile']],
  ['cream-jar', ['shea butter', 'body cream', 'cream', 'karite']],
  ['bp-monitor', ['blood pressure', 'tensiometre']],
  ['oximeter', ['oximeter', 'oxymetre']],
  ['phone-itel', ['smartphone', 'dual sim', 'telephone']],

  ['laptop-ideapad', ['computers & tablets']],
  ['television', ['electronics']],
  ['sofa', ['furniture']],
  ['basket', ['home & decor']],
  ['shirt', ['fashion']],
  ['cream-jar', ['beauty & care']],
  ['solar-panel', ['solar & energy']],
  ['sacks', ['packaging supplies']],
  ['cement-sack', ['construction materials']],
  ['water-pump', ['agricultural equipment']],
  ['tyre', ['automotive parts']],
  ['generator', ['industrial equipment']],
  ['grinding-mill', ['manufacturing machinery']],
  ['bp-monitor', ['medical equipment']],
  ['phone-itel', ['smartphones']],
];

/** Picks the 3D model key for a product, or null when nothing fits. */
export function resolveProduct3D(product) {
  if (!product) return null;
  const haystack = [product.title, product.category_name].filter(Boolean).join(' ').toLowerCase();
  if (!haystack) return null;
  const match = MATCHERS.find(([, needles]) => needles.some((needle) => haystack.includes(needle)));
  return match ? match[0] : null;
}

/** Returns the builder for a model key; three.js is passed in by the viewer. */
export function getProduct3DBuilder(modelKey) {
  return BUILDERS[modelKey] || null;
}

/** Readable name per model key, used by the 3D asset showcase. */
const MODEL_LABELS = {
  'solar-panel': 'Solar panel',
  'solar-battery': 'Solar battery',
  'laptop-elitebook': 'HP EliteBook laptop',
  'laptop-ideapad': 'Lenovo IdeaPad laptop',
  'phone-itel': 'Itel smartphone',
  'phone-tecno': 'Tecno smartphone',
  television: 'Television',
  speaker: 'Party speaker',
  blender: 'Blender',
  fridge: 'Fridge',
  generator: 'Generator',
  welder: 'Welding machine',
  'maize-sheller': 'Maize sheller',
  'water-pump': 'Water pump',
  'grinding-mill': 'Grinding mill',
  'block-machine': 'Block-making machine',
  tyre: 'Tyre',
  'brake-pads': 'Brake pads',
  'roofing-sheet': 'Roofing sheet',
  'cement-sack': 'Cement sack',
  carton: 'Carton',
  sacks: 'Polypropylene sacks',
  'dining-set': 'Dining set',
  sofa: 'Sofa',
  basket: 'Raffia basket',
  cushions: 'Cushions',
  shirt: 'Shirt',
  dress: 'Ankara dress',
  'hair-oil': 'Hair oil',
  'cream-jar': 'Shea butter jar',
  'bp-monitor': 'Blood pressure monitor',
  oximeter: 'Pulse oximeter',
};

/** Every model the browser can build, for the 3D asset showcase. */
export const MODEL_KEYS = Object.keys(BUILDERS);

export const modelLabel = (modelKey) => MODEL_LABELS[modelKey] || modelKey;