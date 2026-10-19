import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:congo_commerce_flutter/core/models/product_model.dart';
import 'package:congo_commerce_flutter/core/providers/providers.dart';
import 'package:congo_commerce_flutter/features/search/screens/search_screen.dart';
import 'package:congo_commerce_flutter/ui/widgets/product_card.dart';

void main() {
  testWidgets('Product cards fit narrow screens with enlarged text', (tester) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(ProviderScope(child: MaterialApp(
      home: MediaQuery(
        data: const MediaQueryData(size: Size(320, 900), textScaler: TextScaler.linear(2)),
        child: Scaffold(body: Builder(builder: (context) => GridView(
          padding: const EdgeInsets.all(16),
          gridDelegate: productGridDelegate(context),
          children: [ProductCard(product: ProductModel(
            id: 'p1', title: 'A long product title with several words',
            priceUsd: 1234, compareAtUsd: 2345,
            sellerName: 'A long supplier name', rating: 4.5, reviewsCount: 123,
          ))],
        ))),
      ),
    )));
    await tester.pump();
    expect(tester.takeException(), isNull);
    final image = tester.getSize(find.byType(AspectRatio));
    expect(image.width, 288);
    expect(image.height, 288);
  });

  testWidgets('Clear search removes visible text and query', (tester) async {
    final container = ProviderContainer(overrides: [
      searchResultsProvider.overrideWith((ref) async => []),
    ]);
    addTearDown(container.dispose);
    container.read(searchQueryProvider.notifier).state = 'Shoes';
    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(home: SearchScreen()),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Shoes'), findsOneWidget);
    await tester.tap(find.byTooltip('Clear search'));
    await tester.pump();
    expect(find.text('Shoes'), findsNothing);
    expect(container.read(searchQueryProvider), isEmpty);
    expect(tester.takeException(), isNull);
  });
}
