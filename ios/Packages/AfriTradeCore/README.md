# AfriTradeCore (Swift Package Manager)

Swift networking building block for iOS 15+. No private credentials, SDK keys, payment decisions or simulated business logic are included.

## Add to Xcode

Open `ios/Runner.xcworkspace`, choose **File → Add Package Dependencies → Add Local**, select `ios/Packages/AfriTradeCore`, and link **AfriTradeCore** to Runner if native code needs it. The Flutter app remains the primary UI; this package does not replace Flutter or the Base44 backend.

## Example

```swift
import AfriTradeCore

let client = try AfriTradeClient(baseURL: URL(string: "https://YOUR_APPROVED_API_HOST")!)
// struct Profile: Decodable { let id: String }
// let profile: Profile = try await client.request(path: "/approved/profile", bearerToken: sessionToken)
```

Use only verified Base44 backend routes and session tokens from the approved sign-in flow. Never embed user bearer tokens or administrative API keys in a mobile binary. Do not point this at a production URL until its availability, authentication contract and API routes are verified.

## Validation

On macOS with Xcode or any machine with the Swift toolchain:

```sh
cd ios/Packages/AfriTradeCore
swift test
```

Native iOS Simulator builds require macOS/Xcode. This package is not automatically linked to Runner; link it when a native Swift integration actually consumes its API.
