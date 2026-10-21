// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AfriTradeCore",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [.library(name: "AfriTradeCore", targets: ["AfriTradeCore"])],
    targets: [
        .target(name: "AfriTradeCore"),
        .testTarget(name: "AfriTradeCoreTests", dependencies: ["AfriTradeCore"])
    ]
)
