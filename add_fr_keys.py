import json

path = 'src/i18n/fr.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to add missing keys to fr.js
missing = {
    'dashboard': {'title': 'Tableau de bord'},
    'nav': {
        'menu': 'Menu',
        'primary': 'Navigation principale',
        'login': 'Connexion',
        'logout': 'Déconnexion',
        'guest': 'Invité',
        'guestDesc': 'Connectez-vous pour accéder à votre compte',
        'register': 'Inscription',
        'close': 'Fermer',
        'account': 'Compte'
    },
    'cart': {'items': '{{count}} article(s)'},
    'payout': {'errPhoneInvalid': 'Numéro de téléphone invalide'},
    'rating': {'average': 'Moyenne', 'new': 'Nouveau'},
    'theme': {'label': 'Thème', 'light': 'Clair', 'dark': 'Sombre'},
    'env': {
        'sandbox': 'Sandbox',
        'development': 'Développement',
        'staging': 'Staging',
        'test': 'Test',
        'modeLabel': 'Mode',
        'modeTooltip': 'Environnement actuel'
    },
    'creatorDashboard': {
        'loadFailed': 'Échec du chargement',
        'noCreatorAccount': 'Pas de compte créateur',
        'noCreatorDesc': 'Devenez créateur pour publier du contenu',
        'createCreator': 'Créer un compte créateur',
        'title': 'Tableau de bord créateur',
        'codeLabel': 'Votre code de suivi',
        'linkCopied': 'Lien copié',
        'copyLink': 'Copier le lien',
        'trackedClicks': 'Clics suivis',
        'conversions': 'Conversions',
        'commissions': 'Commissions',
        'publishedContents': 'Contenus publiés',
        'newContent': 'Nouveau contenu',
        'optionalProduct': 'Produit associé (optionnel)',
        'contentTitle': 'Titre du contenu',
        'caption': 'Légende',
        'mediaUrl': 'URL du média',
        'publishing': 'Publication...',
        'publish': 'Publier',
        'myContents': 'Mes contenus',
        'likes': 'J\'aime',
        'views': 'Vues',
        'noProduct': 'Aucun produit',
        'noContent': 'Aucun contenu',
        'commissionInfo': 'Info commissions'
    },
    'fraudAlerts': {
        'title': 'Alertes de fraude',
        'toReview': 'À examiner',
        'highRisk': 'Risque élevé',
        'amountAtStake': 'Montant en jeu',
        'noAlerts': 'Aucune alerte'
    },
    'orderTracking': {'search': 'Rechercher une commande', 'totalLabel': 'Total'},
    'privacySettings': {
        'accountTitle': 'Compte et confidentialité',
        'accountText': 'Gérez vos données et votre vie privée',
        'deleteConfirm': 'Êtes-vous sûr de vouloir supprimer votre compte ?',
        'deleteSuccess': 'Compte supprimé',
        'deleteAccount': 'Supprimer le compte'
    },
    'productDetail': {'image': 'Image du produit'},
    'profile': {
        'deleteConfirm': 'Confirmer la suppression',
        'deleteSuccess': 'Supprimé',
        'deleteAccount': 'Supprimer le compte',
        'deleteAccountSub': 'Cette action est irréversible'
    },
    'myWallet': {'partnerTitle': 'Partenaires et avantages'},
    'common': {
        'refresh': 'Actualiser',
        'cost': 'Coût',
        'expected': 'Attendu',
        'approve': 'Approuver',
        'reject': 'Rejeter',
        'saving': 'Enregistrement...',
        'allStatus': 'Tous les statuts',
        'printAll': 'Tout imprimer',
        'generated': 'Généré',
        'print': 'Imprimer',
        'download': 'Télécharger',
        'noLabels': 'Aucune étiquette.',
        'checkSLA': 'Vérifier SLA',
        'all': 'Tout',
        'autoRoute': 'Acheminement auto',
        'noTickets': 'Aucun ticket.'
    },
    'adminLogistics': {'saving': 'Enregistrement...'}
}

# Build replacement text for missing keys
lines = []
for section, keys in missing.items():
    if isinstance(keys, dict):
        section_str = f"  {section}: {{\n"
        for k, v in keys.items():
            escaped = v.replace("'", "\\'")
            section_str += f"    {k}: '{escaped}',\n"
        section_str += "  },"
        lines.append(section_str)
    else:
        escaped = keys.replace("'", "\\'")
        lines.append(f"  {section}: '{escaped}',")

insertion = "\n" + "\n".join(lines) + "\n"

# Insert before the final closing brace of export default
last_brace = content.rfind('}')
if last_brace == -1:
    raise SystemExit('No closing brace found')

new_content = content[:last_brace] + insertion + content[last_brace:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Added missing French keys')
