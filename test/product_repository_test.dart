import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:afritrade/core/services/api_client.dart';
import 'package:afritrade/core/services/token_storage.dart';
import 'package:afritrade/core/services/product_repository.dart';
import 'package:afritrade/core/providers/providers.dart';

void main() {
  test('catalog repository decodes REST envelopes across every read method', () async {
    final api = ApiClient(tokens: InMemoryTokenStorage());
    api.dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      final route = options.uri.queryParameters['path'];
      expect(options.uri.path, contains('/functions/rest'));
      final product = {'id': 'p1', 'title': 'Shoes', 'price_usd': 12};
      final Object data;
      if (route == '/categories') {
        data = {'categories': [{'id': 'c1', 'name': 'Fashion'}]};
      } else if (route?.endsWith('/reviews') == true) {
        data = {'reviews': [{'id': 'r1', 'rating': 5}]};
      } else if (route == '/products/p1') {
        data = {'product': product};
      } else {
        data = {'products': [product], 'total': 1};
      }
      handler.resolve(Response(requestOptions: options, statusCode: 200, data: data));
    }));
    final repository = ProductRepository(api);
    for (final result in [
      await repository.fetchProducts(), await repository.fetchFeatured(),
      await repository.fetchFlashSales(), await repository.fetchTrending(),
      await repository.fetchNewArrivals(), await repository.fetchSimilar('p1'),
    ]) {
      expect(result.single.id, 'p1');
      expect(result.single.priceUsd, 12);
    }
    expect((await repository.fetchProduct('p1')).title, 'Shoes');
    expect((await repository.fetchCategories()).single['id'], 'c1');
    expect((await repository.fetchReviews('p1')).single['id'], 'r1');
  });

  test('clearing one search filter preserves unrelated selections', () {
    const filters = SearchFilters(category: 'c1', origin: 'local', minPrice: 5, inStockOnly: true);
    final cleared = filters.copyWith(origin: null);
    expect(cleared.origin, isNull);
    expect(cleared.category, 'c1');
    expect(cleared.minPrice, 5);
    expect(cleared.inStockOnly, isTrue);
    expect(filters.copyWith(category: null).origin, 'local');
    expect(filters.copyWith().origin, 'local');
  });
}
