import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/product_model.dart';
import '../../core/providers/providers.dart';
import '../../core/utils/formatters.dart';

/// Product card widget used across home, listing, and search screens
class ProductCard extends ConsumerWidget {
  final ProductModel product;
  final double? width;
  
  const ProductCard({
    super.key,
    required this.product,
    this.width,
  });
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isWishlisted = ref.watch(wishlistProvider).contains(product.id);
    
    return SizedBox(
      width: width,
      child: Semantics(
        container: true,
        label: '${product.title}, ${formatUSD(product.priceUsd)}',
        button: true,
        child: InkWell(
          onTap: () => context.push('/product/${product.id}'),
          borderRadius: BorderRadius.circular(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              AspectRatio(
                aspectRatio: 1,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: product.primaryImage.isNotEmpty
                            ? CachedNetworkImage(
                                imageUrl: product.primaryImage,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => const Center(
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                                errorWidget: (_, __, ___) => Icon(
                                  Icons.image_not_supported_outlined,
                                  color: theme.colorScheme.outline,
                                ),
                              )
                            : Icon(
                                Icons.image_outlined,
                                color: theme.colorScheme.outline,
                              ),
                      ),
                    ),
                    
                    // Discount badge
                    if (product.hasDiscount)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '-${product.discountPercent.round()}%',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    
                    // Flash sale badge
                    if (product.isFlashSale)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.orange,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Icon(
                            Icons.local_fire_department,
                            color: Colors.white,
                            size: 14,
                          ),
                        ),
                      ),
                    
                    // Wishlist button
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: IconButton.filledTonal(
                        onPressed: () => toggleWishlist(ref, product.id),
                        iconSize: 18,
                        padding: const EdgeInsets.all(6),
                        style: IconButton.styleFrom(
                          minimumSize: const Size(40, 40),
                          backgroundColor: isWishlisted
                              ? theme.colorScheme.primary
                              : theme.colorScheme.surface.withValues(alpha: 0.9),
                          foregroundColor: isWishlisted
                              ? theme.colorScheme.onPrimary
                              : theme.colorScheme.onSurface,
                        ),
                        icon: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border),
                        tooltip: isWishlisted ? 'Remove from favorites' : 'Add to favorites',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              
              // Title
              Text(
                product.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              
              // Price
              Wrap(
                spacing: 6,
                runSpacing: 2,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    formatUSD(product.priceUsd),
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (product.hasDiscount) ...[
                    Text(
                      formatUSD(product.compareAtUsd!),
                      style: theme.textTheme.bodySmall?.copyWith(
                        decoration: TextDecoration.lineThrough,
                        color: theme.colorScheme.outline,
                      ),
                    ),
                  ],
                ],
              ),
              
              // Seller
              if (product.sellerName != null) ...[
                const SizedBox(height: 2),
                Text(
                  product.sellerName!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall,
                ),
              ],
              
              // Rating
              if (product.rating > 0) ...[
                const SizedBox(height: 2),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Icon(Icons.star, size: 14, color: Colors.amber.shade700),
                    const SizedBox(width: 2),
                    Text(
                      product.rating.toStringAsFixed(1),
                      style: theme.textTheme.bodySmall,
                    ),
                    if (product.reviewsCount > 0)
                      Text(
                        ' (${product.reviewsCount})',
                        style: theme.textTheme.bodySmall,
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Reserve space for title, wrapped prices, seller and rating at the user's
/// text size, instead of squeezing them into a fixed image-based aspect ratio.
double productCardDetailsHeight(BuildContext context) =>
    40 + MediaQuery.textScalerOf(context).scale(140);

SliverGridDelegate productGridDelegate(BuildContext context) {
  final width = MediaQuery.sizeOf(context).width - 32;
  final minWidth = MediaQuery.textScalerOf(context).scale(150);
  final columns = (width / minWidth).floor().clamp(1, 5);
  final cardWidth = (width - (columns - 1) * 12) / columns;
  return SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: columns,
    mainAxisSpacing: 12,
    crossAxisSpacing: 12,
    mainAxisExtent: cardWidth + productCardDetailsHeight(context),
  );
}
