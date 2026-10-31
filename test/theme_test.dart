import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:afritrade/core/config/app_theme.dart';

void main() {
  for (final dark in [false, true]) {
    testWidgets('Bundled mobile theme renders offline (${dark ? 'dark' : 'light'})', (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: dark ? AppTheme.darkTheme : AppTheme.lightTheme,
        home: Scaffold(
          appBar: AppBar(title: const Text('AfriTrade')),
          body: const TextField(decoration: InputDecoration(labelText: 'Search')),
        ),
      ));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      final context = tester.element(find.byType(TextField));
      expect(Theme.of(context).textTheme.bodyMedium?.fontFamily, 'Poppins');
    });
  }
}
