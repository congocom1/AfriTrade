import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ids = ref.watch(wishlistProvider).toList();
    return Scaffold(appBar: AppBar(title: const Text('My favorites')),
      body: ids.isEmpty ? const Center(child: Text('No favorites yet')) : ListView(children: ids.map((id) =>
        ref.watch(productProvider(id)).when(
          loading: () => const ListTile(title: LinearProgressIndicator()),
          error: (_, __) => ListTile(title: const Text('Could not load product'), trailing: IconButton(icon: const Icon(Icons.refresh), onPressed: () => ref.invalidate(productProvider(id)))),
          data: (product) => ListTile(title: Text(product.title), onTap: () => context.push('/product/$id'), trailing: IconButton(icon: const Icon(Icons.favorite), onPressed: () => toggleWishlist(ref, id))),
        )).toList()));
  }
}
