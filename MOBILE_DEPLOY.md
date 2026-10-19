# AfriTrade mobile release

The mobile app is Flutter, not Capacitor. Run commands from the repository root.
The React frontend is a separate app; do not run `cap sync` or copy `dist/` into iOS.

## Validate the iOS build

Use Flutter 3.47.7 (Dart 3.13.2 or newer matching pubspec), macOS, and a compatible
Xcode with iOS SDK and simulator installed. The app targets iOS 15 or newer.
Native plugins use Swift Package Manager, enabled in pubspec.yaml.

```bash
flutter pub get --enforce-lockfile
flutter analyze
flutter test
flutter build ios --simulator --debug
flutter build ios --release --no-codesign
open ios/Runner.xcworkspace
```

The iOS GitHub Actions workflow performs these checks on macOS and can also be
started manually. Its unsigned app artifact cannot be installed on a physical
phone or submitted to Apple. A green Linux test run does not prove Xcode builds.

## Signing and TestFlight

1. Sign in to Xcode with the Apple Developer account. Select Runner, Signing &
   Capabilities, choose the registered team and enable automatic signing for
   Debug, Profile and Release. Do not commit certificates or private keys.
2. Confirm `com.congocommerce.congoCommerceFlutter` is the bundle identifier
   registered in that team's App Store Connect app. It is intentionally preserved
   to avoid breaking an existing listing. Change all configurations only if Apple
   confirms a different identifier is required. Display name is AfriTrade.
3. Set the marketing version and unique increasing build number in pubspec.yaml
   or pass `--build-name` and `--build-number` to Flutter. Verify against the last
   uploaded build; the repository's existing 1.0.0+1 is not proof it is unused.
4. Connect a real iPhone, enable Developer Mode, and run `flutter run -d DEVICE_ID`.
   Check launch, sign-in, token persistence after restart, sign-out, catalog,
   product detail, cart, checkout failures, poor network and accessibility.
5. Run `flutter build ipa --release` after signing is configured. Open the archive
   in `build/ios/archive/Runner.xcarchive` using Xcode Organizer, validate it, then
   Distribute App to App Store Connect. Resolve any signing/export errors in
   Xcode with the actual team's provisioning profiles.
6. Wait for App Store Connect processing, complete export compliance using the
   actual encryption implementation, add internal TestFlight testers, and repeat
   device checks using the distributed build. External testing may require review.
7. Complete privacy policy, support URL, data collection disclosures, screenshots,
   age rating and review account/instructions. Verify account deletion and payment
   behavior before requesting App Review. Submit only after release gates pass.

## Known release gates

- Native compilation, signing, device testing and upload need macOS/Xcode or a
  configured macOS CI runner plus Apple credentials. They are not validated on Linux.
- Validate the hosted API configured in lib/core/config/app_constants.dart against
  real auth/catalog/checkout responses; a successful native compile is insufficient.
- README.md documents the unresolved wallet/refund release gate. Building an iOS
  binary does not waive that gate.
- Do not claim camera, microphone, location, push or universal-link support based
  on dependencies alone. Before enabling those features, add the precise native
  capabilities, permission descriptions, server association and device tests.
- Check final icons and launch visuals on device and review the archive's privacy
  manifests and App Store validation results before submission.
