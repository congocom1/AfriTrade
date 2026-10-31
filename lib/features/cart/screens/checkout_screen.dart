import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_constants.dart';
import '../../../core/providers/providers.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/services/hosted_features.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}
class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final formKey = GlobalKey<FormState>();
  final name = TextEditingController();
  final phone = TextEditingController();
  final city = TextEditingController();
  final address = TextEditingController();
  bool consent = false, busy = false, uncertain = false;
  String? error, orderNumber;
  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    name.text = user?.fullName ?? '';
    phone.text = user?.phone ?? '';
  }
  @override
  void dispose() {
    for (final c in [name, phone, city, address]) { c.dispose(); }
    super.dispose();
  }
  Future<void> submit() async {
    if (busy || uncertain || !formKey.currentState!.validate()) return;
    if (!consent) { setState(() => error = 'Accept the terms before placing an order.'); return; }
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) return;
    setState(() { busy = true; error = null; });
    try {
      final response = await ref.read(apiClientProvider).dio.post(
        '/apps/${AppConstants.base44AppId}/functions/place-order',
        data: {
          'items': cart.items.map((i) => {'product_id': i.productId, 'quantity': i.quantity, 'variant': i.variantId}).toList(),
          'profile': {'name': name.text.trim(), 'phone': phone.text.trim(), 'city': city.text.trim(), 'address': address.text.trim(), 'email': ref.read(currentUserProvider)?.email ?? ''},
          'delivery': {'method': 'standard', 'address': address.text.trim()},
          'paymentMethodId': 'cod', 'paymentPhone': phone.text.trim(),
          'consent': {'terms': true, 'marketing': false},
        },
      );
      final data = response.data;
      final order = data is Map ? data['order'] : null;
      final number = order is Map ? order['order_number'] : null;
      if (number is! String || number.isEmpty) throw StateError('Missing order confirmation');
      ref.read(cartProvider.notifier).clear();
      if (mounted) {
        setState(() => orderNumber = number);
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          uncertain = e.response == null || (e.response?.statusCode ?? 500) >= 500;
          error = uncertain ? 'The order outcome is unknown. Check your orders before trying again; your cart has been kept.' : 'Order rejected. Check your details and try again.';
        });
      }
    } catch (_) {
      if (mounted) setState(() { uncertain = true; error = 'Confirmation could not be read. Check your orders before trying again.'; });
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
  Widget field(String label, TextEditingController controller, {TextInputType? keyboard}) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(controller: controller, enabled: !busy && !uncertain, keyboardType: keyboard,
      decoration: InputDecoration(labelText: label),
      validator: (value) => value == null || value.trim().isEmpty ? '$label is required' : null),
  );
  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    return Scaffold(appBar: AppBar(title: const Text('Checkout')), body: orderNumber != null
      ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text('Order $orderNumber received'), const Text('Cash on delivery — payment is pending.'), TextButton(onPressed: () => openHostedFeature(context, '/order-history'), child: const Text('View orders on the web'))]))
      : cart.isEmpty ? const Center(child: Text('Your cart is empty'))
      : Form(key: formKey, child: SafeArea(top: false, child: ListView(padding: const EdgeInsets.all(16), children: [
        ...cart.items.map((i) => ListTile(title: Text(i.productName), subtitle: Text('Quantity: ${i.quantity}'), trailing: Text(formatUSD(i.lineTotalUsd)))),
        Text('Items subtotal: ${formatUSD(cart.subtotalUsd)}'),
        const Text('Standard delivery: \$3.50 for orders below \$30, otherwise free. The server validates stock and prices.'),
        const SizedBox(height: 16),
        field('Full name', name), field('Phone', phone, keyboard: TextInputType.phone), field('City', city), field('Delivery address', address),
        const ListTile(title: Text('Cash on delivery'), subtitle: Text('Pay when your order arrives.')),
        CheckboxListTile(value: consent, onChanged: busy || uncertain ? null : (v) => setState(() => consent = v ?? false), title: const Text('I accept the terms of service')),
        TextButton(onPressed: () => openHostedFeature(context, '/terms-of-service'), child: const Text('Read terms')),
        if (error != null) Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ElevatedButton(onPressed: busy || uncertain ? null : submit, child: Text(busy ? 'Submitting…' : 'Place cash-on-delivery order')),
        if (uncertain) TextButton(onPressed: () => openHostedFeature(context, '/order-history'), child: const Text('Check orders on the web')),
      ]))));
  }
}
