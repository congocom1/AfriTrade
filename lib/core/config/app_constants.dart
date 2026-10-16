/// Application constants and configuration
class AppConstants {
  static const String appName = 'AfriTrade';
  static const String appTagline = 'Shopify × Alibaba for Africa — B2B & B2C marketplace for African trade';
  static const String appVersion = '2.0.0';
  
  // API Configuration — points at the Base44 backend
  // AfriTrade's active Base44 deployment.
  static const String baseUrl = 'https://afritrade-1.base44.app/api';
  static const String websocketUrl = 'wss://ws.afritrade.com';
  
  // Timeout values
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Cache durations
  static const Duration cacheExpiration = Duration(hours: 1);
  static const Duration imageCacheExpiration = Duration(days: 7);
  
  // Feature flags
  static const bool enableAnalytics = true;
  static const bool enableCrashlytics = true;
  static const bool enablePushNotifications = true;
  
  // Supported locales
  static const List<String> supportedLocales = ['en', 'fr', 'sw', 'ln', 'yo', 'ig', 'am', 'pt'];
  static const String defaultLocale = 'en';
  
  // Currency
  static const String defaultCurrency = 'USD';
  static const String localCurrency = 'XAF';
  static const Map<String, double> currencyRates = {
    'USD': 1.0,
    'XAF': 600.0,
    'XOF': 600.0,
    'NGN': 1500.0,
    'KES': 130.0,
    'GHS': 15.0,
    'EGP': 48.0,
    'MAD': 10.0,
    'ZAR': 18.0,
  };
  
  // Storage keys
  static const String userTokenKey = 'user_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userPreferencesKey = 'user_preferences';
  static const String cartKey = 'shopping_cart';
  static const String localeKey = 'selected_locale';
  static const String themeModeKey = 'theme_mode';
  
  // Deep links
  static const String deepLinkScheme = 'afritrade';
  static const String deepLinkHost = 'app';
  
  // Social
  static const String websiteUrl = 'https://afritrade.com';
  static const String facebookUrl = 'https://facebook.com/afritrade';
  static const String twitterUrl = 'https://twitter.com/afritrade';
  static const String instagramUrl = 'https://instagram.com/afritrade';
  
  // Support
  static const String supportEmail = 'support@afritrade.com';
  static const String supportPhone = '+225 01 00 00 00';
}