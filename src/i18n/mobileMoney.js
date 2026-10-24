/**
 * Mobile money (MainMoney) payment copy. Kept out of fr.js / en.js, which are
 * at their size limit; merged into the `pay` namespace by resources.js.
 */
const mobileMoney = {
  fr: {
    pay: {
      mainmoneyClose: 'Fermer',
      mainmoneyInstructions: 'Choisissez votre opérateur (M-Pesa, Airtel, Orange), puis validez le paiement sur votre téléphone.',
      mainmoneyLoginRequired: 'Connectez-vous pour payer par Mobile Money.',
      mainmoneyName: 'Mobile Money (M-Pesa, Airtel, Orange)',
      mainmoneySecure: 'Paiement sécurisé par MainMoney.',
      mainmoneyTitle: 'Paiement Mobile Money',
      mainmoneyUnconfirmed: 'Le paiement n’est pas encore confirmé. Réessayez dans un instant.',
      mainmoneyVerifying: 'Vérification du paiement…',
    },
  },
  en: {
    pay: {
      mainmoneyClose: 'Close',
      mainmoneyInstructions: 'Pick your operator (M-Pesa, Airtel, Orange), then approve the payment on your phone.',
      mainmoneyLoginRequired: 'Sign in to pay by Mobile Money.',
      mainmoneyName: 'Mobile Money (M-Pesa, Airtel, Orange)',
      mainmoneySecure: 'Payment secured by MainMoney.',
      mainmoneyTitle: 'Mobile Money payment',
      mainmoneyUnconfirmed: 'The payment is not confirmed yet. Please try again in a moment.',
      mainmoneyVerifying: 'Checking the payment…',
    },
  },
};

export default mobileMoney;