/**
 * Copy for the AI picture detection panel (3D asset showcase).
 * Kept beside the other newer namespaces so fr.js/en.js stay at their size.
 * Shape matches the other namespace files: { fr: { <namespace>: {...} }, en: {...} }.
 */
const fr = {
  threeDAssets: {
    detectTitle: 'Détection par IA',
    detectIntro: 'Collez le lien d’une photo de produit : l’IA reconnaît l’objet et construit la vue 3D elle-même.',
    detectUrlPlaceholder: 'https://… lien de la photo',
    detectButton: 'Détecter et construire',
    detectDetecting: 'Lecture de la photo…',
    detectUrlError: 'Entrez un lien de photo valide (https).',
    detectFailed: 'La détection a échoué. Réessayez dans un instant.',
    detectNone: 'Aucun modèle de la bibliothèque ne correspond à cette photo.',
    detectObject: 'Objet reconnu : {{name}}',
    detectModel: 'Modèle construit : {{model}}',
    detectConfidence: 'Confiance {{value}} %',
    detectColors: 'Couleurs lues sur la photo',
    detectClear: 'Revenir à la bibliothèque',
    detectBadge: 'Construit par IA',
    detectPreview: 'Photo analysée',
  },
};

const en = {
  threeDAssets: {
    detectTitle: 'AI detection',
    detectIntro: 'Paste a product photo link: the AI recognises the object and builds the 3D view on its own.',
    detectUrlPlaceholder: 'https://… photo link',
    detectButton: 'Detect and build',
    detectDetecting: 'Reading the photo…',
    detectUrlError: 'Enter a valid photo link (https).',
    detectFailed: 'Detection failed. Try again in a moment.',
    detectNone: 'No model in the library matches this photo.',
    detectObject: 'Recognised object: {{name}}',
    detectModel: 'Built model: {{model}}',
    detectConfidence: 'Confidence {{value}}%',
    detectColors: 'Colours read from the photo',
    detectClear: 'Back to the library',
    detectBadge: 'AI built',
    detectPreview: 'Photo analysed',
  },
};

export default { fr, en };