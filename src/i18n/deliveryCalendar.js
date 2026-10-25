/** Google Agenda sync for deliveries and relay-point appointments (per app user). */
const fr = {
  deliveryCalendar: {
    title: 'Google Agenda',
    subtitle: 'Recevez les dates de livraison de vos commandes et vos rendez-vous de dépôt en point relais dans votre propre agenda.',
    connect: 'Connecter mon agenda',
    connecting: 'Connexion…',
    connected: 'Agenda connecté',
    disconnect: 'Déconnecter',
    sync: 'Synchroniser maintenant',
    syncing: 'Synchronisation…',
    openCalendar: 'Ouvrir Google Agenda',
    upcoming: 'Prochains évènements',
    empty: 'Aucune livraison ni rendez-vous à venir.',
    synced: 'Dans l’agenda',
    pending: 'À ajouter',
    login: 'Se connecter pour relier mon agenda',
    failed: 'La synchronisation a échoué. Réessayez.',
    created: '{{count}} évènement(s) ajouté(s) à votre agenda.',
    hint: 'Chaque personne connecte son propre agenda : rien n’est partagé avec les autres comptes.',
  },
};

const en = {
  deliveryCalendar: {
    title: 'Google Calendar',
    subtitle: 'Get your order delivery dates and your relay-point drop-off appointments in your own calendar.',
    connect: 'Connect my calendar',
    connecting: 'Connecting…',
    connected: 'Calendar connected',
    disconnect: 'Disconnect',
    sync: 'Sync now',
    syncing: 'Syncing…',
    openCalendar: 'Open Google Calendar',
    upcoming: 'Upcoming events',
    empty: 'No upcoming delivery or appointment.',
    synced: 'In the calendar',
    pending: 'To add',
    login: 'Sign in to connect my calendar',
    failed: 'The sync failed. Please try again.',
    created: '{{count}} event(s) added to your calendar.',
    hint: 'Each person connects their own calendar: nothing is shared with other accounts.',
  },
};

export default { fr, en };