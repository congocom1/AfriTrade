/**
 * Copy for the loyalty programme.
 *
 * `fr.js` / `en.js` are at their size limit, so this namespace is kept here and
 * merged in by resources.js — the same pattern as intlShipment.js.
 *
 * `LOYALTY_TIERS[].perksKey` points at these arrays: i18next returns them with
 * `{ returnObjects: true }`, so each tier must resolve to a list, not a string.
 * Without them the tier card rendered an empty perk list.
 *
 * `rewardsCatalog` and the truncated French `customerLoyalty` strings are
 * overridden here too — the dictionaries shipped placeholder values
 * ('title' / 'desc' / 'redeem') and apostrophe-truncated French copy.
 */
const loyalty = {
  fr: {
    loyalty: {
      tierBronzePerks: ['Points sur chaque commande livrée', 'Offres réservées aux membres'],
      tierSilverPerks: ['Points sur chaque commande livrée', 'Livraison offerte dès 100 $', 'Offres réservées aux membres'],
      tierGoldPerks: ['Points sur chaque commande livrée', 'Livraison offerte dès 50 $', 'Support prioritaire', 'Retours acceptés sous 30 jours'],
      tierPlatinumPerks: ['Points sur chaque commande livrée', 'Livraison toujours offerte', 'Support dédié', 'Retours acceptés sous 45 jours'],
    },
    loyaltyTierCard: {
      availPoints: 'Points disponibles',
      maxLevel: 'Niveau maximal atteint',
      multiplier: '×{{multi}} de points',
      nextLevel: 'Prochain niveau : {{name}}',
      pendingPoints: 'Points en attente',
      pointsToGo: 'Encore {{count}} points',
      rewards: 'Récompenses accessibles',
      starter: 'Niveau de départ',
      status: 'Statut {{tier}}',
      totalSpent: 'Total dépensé',
    },
    rewardsCatalog: {
      desc: 'Échangez vos points contre des bons, la livraison offerte ou des coffrets cadeaux.',
      points: '{{count}} points',
      redeem: 'Échanger',
      title: 'Catalogue de récompenses',
    },
    customerLoyalty: {
      goodToKnowText: 'Les points suivent votre numéro de téléphone et cet appareil : renseignez le même numéro au paiement pour ne rien perdre. Les commandes annulées ou remboursées ne rapportent pas de points, et les points échangés sont déduits définitivement. Besoin d’aide avec un code ?',
      noMovements: 'Aucun mouvement pour l’instant. Vos points apparaissent dès qu’une commande est livrée.',
      redeemFailed: 'L’échange n’a pas pu être enregistré. Réessayez.',
    },
  },
  en: {
    loyalty: {
      tierBronzePerks: ['Points on every delivered order', 'Member-only offers'],
      tierSilverPerks: ['Points on every delivered order', 'Free shipping from $100', 'Member-only offers'],
      tierGoldPerks: ['Points on every delivered order', 'Free shipping from $50', 'Priority support', 'Returns accepted within 30 days'],
      tierPlatinumPerks: ['Points on every delivered order', 'Free shipping on every order', 'Dedicated support', 'Returns accepted within 45 days'],
    },
    loyaltyTierCard: {
      availPoints: 'Points available',
      maxLevel: 'Top level reached',
      multiplier: '×{{multi}} points',
      nextLevel: 'Next level: {{name}}',
      pendingPoints: 'Points pending',
      pointsToGo: '{{count}} points to go',
      rewards: 'Rewards unlocked',
      starter: 'Entry level',
      status: '{{tier}} status',
      totalSpent: 'Total spent',
    },
    rewardsCatalog: {
      desc: 'Redeem your points for vouchers, free shipping or gift boxes.',
      points: '{{count}} points',
      redeem: 'Redeem',
      title: 'Rewards catalogue',
    },
  },
};

export default loyalty;