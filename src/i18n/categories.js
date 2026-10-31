// Copy for the departments / categories surfaces.
//
// fr.js and en.js are at their size limit, so this namespace lives in its own
// module and is merged in resources.js. Lingala and Kiswahili fall back to the
// French copy.
const en = {
  count_one: '{{count}} product',
  count_other: '{{count}} products',
  empty: 'No departments published yet',
  emptyHint: 'Departments appear here as soon as the catalogue is published.',
  subtitle: 'Every department on AfriTrade, from phones and appliances to building materials and solar kits.',
  title: 'All departments',
};

const fr = {
  count_one: '{{count}} produit',
  count_other: '{{count}} produits',
  empty: 'Aucun rayon publié pour le moment',
  emptyHint: 'Les rayons apparaissent ici dès que le catalogue est publié.',
  subtitle: 'Tous les rayons d’AfriTrade, du téléphone et de l’électroménager aux matériaux de construction et aux kits solaires.',
  title: 'Tous les rayons',
};

export default { fr: { categories: fr }, en: { categories: en } };