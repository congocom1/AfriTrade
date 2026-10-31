import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_constants.dart';

Future<void> openHostedFeature(BuildContext context, String path) async {
  final base = Uri.parse(AppConstants.baseUrl);
  final uri = base.replace(path: path, query: null, fragment: null);
  try {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw StateError('Unable to open browser');
    }
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open this page. Please try again.')),
      );
    }
  }
}
