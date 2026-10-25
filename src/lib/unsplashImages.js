// Real photography backs every surface that would otherwise show an empty
// frame: department tiles, product cards, shop cards and the hero. Unsplash's
// CDN takes sizing parameters, so one photo id serves a 106px tile and a
// full-width banner without shipping another asset.

const CDN = 'https://images.unsplash.com';

export function unsplashPhoto(id, width = 800) {
  return `${CDN}/${id}?auto=format&fit=crop&w=${width}&q=70`;
}

// One photo per catalogue family. `categoryArt` decides which family a record
// belongs to, so this map only answers "what does that family look like".
const FAMILY_PHOTOS = {
  smartphones: 'photo-1592890288564-76628a30a657',
  computers: 'photo-1517336714731-489689fd1ca8',
  electronics: 'photo-1593359677879-a4bb92f829d1',
  'home-appliances': 'photo-1484154218962-a197022b5858',
  furniture: 'photo-1555041469-a586c61ea9bc',
  'home-decor': 'photo-1616486338812-3dadae4b4ace',
  fashion: 'photo-1489987707025-afc232f7ea0f',
  beauty: 'photo-1596462502278-27bfdc403348',
  'agricultural-equipment': 'photo-1500937386664-56d1dfef3854',
  'automotive-parts': 'photo-1606577924006-27d39b132ae2',
  'construction-materials': 'photo-1504307651254-35680f356dfd',
  'industrial-equipment': 'photo-1496247749665-49cf5b1022e9',
  'manufacturing-machinery': 'photo-1524514587686-e2909d726e9b',
  'medical-equipment': 'photo-1576091160399-112ba8d25d1d',
  'packaging-supplies': 'photo-1769355104335-acef3aa4c9b6',
  'solar-energy': 'photo-1509391366360-2e959784a276',
};

export function familyPhoto(family, width = 800) {
  const id = FAMILY_PHOTOS[family];
  return id ? unsplashPhoto(id, width) : null;
}

// A trading street rather than a rendered placeholder behind the hero.
export const HERO_PHOTO = unsplashPhoto('photo-1585540083814-ea6ee8af9e4f', 1200);

// Shops without a logo or banner still need a face.
export const SHOP_PHOTO = unsplashPhoto('photo-1441986300917-64674bd600d8', 400);
export const SHOP_BANNER_PHOTO = unsplashPhoto('photo-1552710307-8d1c604d6319', 1200);