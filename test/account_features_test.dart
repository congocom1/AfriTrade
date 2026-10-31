import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:afritrade/core/providers/providers.dart';
import 'package:afritrade/core/models/product_model.dart';
import 'package:afritrade/features/profile/screens/favorites_screen.dart';
import 'package:afritrade/features/profile/screens/app_settings_screen.dart';

void main() {
  testWidgets('favorites can be removed from the native list', (tester) async {
    final container = ProviderContainer(overrides: [
      productProvider.overrideWith((ref, id) async => ProductModel(id: id, title: 'Shoes', priceUsd: 10)),
    ]);
    addTearDown(container.dispose);
    container.read(wishlistProvider.notifier).state = {'p1'};
    await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const MaterialApp(home: FavoritesScreen())));
    await tester.pumpAndSettle();
    expect(find.text('Shoes'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.favorite));
    await tester.pumpAndSettle();
    expect(find.text('No favorites yet'), findsOneWidget);
    expect(container.read(wishlistProvider), isEmpty);
  });
  testWidgets('appearance selection updates the app provider', (tester) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const MaterialApp(home: AppSettingsScreen())));
    await tester.tap(find.byType(DropdownButton<ThemeMode>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('dark').last);
    await tester.pumpAndSettle();
    expect(container.read(themeModeProvider), ThemeMode.dark);
  });
}
