import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import '../../../ui/widgets/product_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: ref.read(searchQueryProvider));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(searchQueryProvider, (_, value) {
      if (_controller.text != value) {
        _controller.value = TextEditingValue(
          text: value,
          selection: TextSelection.collapsed(offset: value.length),
        );
      }
    });
    final theme = Theme.of(context);
    final query = ref.watch(searchQueryProvider);
    final filters = ref.watch(searchFiltersProvider);
    final resultsAsync = ref.watch(searchResultsProvider);
    
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Search products...',
            border: InputBorder.none,
            filled: false,
            suffixIcon: query.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    tooltip: 'Clear search',
                    onPressed: () => ref.read(searchQueryProvider.notifier).state = '',
                  )
                : null,
          ),
          onChanged: (value) => ref.read(searchQueryProvider.notifier).state = value,
        ),
      ),
      body: Column(
        children: [
          // Filters row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                FilterChip(
                  label: Text('All'),
                  selected: !filters.hasActiveFilters,
                  onSelected: (_) => ref.read(searchFiltersProvider.notifier).state = const SearchFilters(),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Local'),
                  selected: filters.origin == 'local',
                  onSelected: (selected) => ref.read(searchFiltersProvider.notifier).state =
                      selected ? filters.copyWith(origin: 'local') : filters.copyWith(origin: null),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('International'),
                  selected: filters.origin == 'international',
                  onSelected: (selected) => ref.read(searchFiltersProvider.notifier).state =
                      selected ? filters.copyWith(origin: 'international') : filters.copyWith(origin: null),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('In stock'),
                  selected: filters.inStockOnly,
                  onSelected: (selected) => ref.read(searchFiltersProvider.notifier).state =
                      filters.copyWith(inStockOnly: selected),
                ),
              ],
            ),
          ),
          
          // Results
          Expanded(
            child: resultsAsync.when(
              data: (products) {
                if (products.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: theme.colorScheme.outline,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No results found',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        const Text('Try a different keyword'),
                      ],
                    ),
                  );
                }
                
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: productGridDelegate(context),
                  itemCount: products.length,
                  itemBuilder: (context, index) => ProductCard(
                    product: products[index],
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }
}