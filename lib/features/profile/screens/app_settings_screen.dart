import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';

class AppSettingsScreen extends ConsumerWidget {
  const AppSettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('App settings')),
    body: ListView(children: [
      ListTile(title: const Text('Appearance'), trailing: DropdownButton<ThemeMode>(
        value: ref.watch(themeModeProvider),
        items: ThemeMode.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(),
        onChanged: (v) { if (v != null) ref.read(themeModeProvider.notifier).state = v; },
      )),
      ListTile(title: const Text('Language'), trailing: DropdownButton<String>(
        value: ref.watch(localeProvider).languageCode,
        items: const [DropdownMenuItem(value: 'en', child: Text('English')), DropdownMenuItem(value: 'fr', child: Text('Français'))],
        onChanged: (v) { if (v != null) ref.read(localeProvider.notifier).state = Locale(v); },
      )),
    ]),
  );
}
