import XCTest
@testable import AfriTradeCore

final class AfriTradeClientTests: XCTestCase {
    func testRejectsInsecureBaseURL() {
        XCTAssertThrowsError(try AfriTradeClient(baseURL: URL(string: "http://example.com")!))
    }

    func testAcceptsHTTPSBaseURL() {
        XCTAssertNoThrow(try AfriTradeClient(baseURL: URL(string: "https://example.com")!))
    }

    func testRejectsEmbeddedURLCredentials() {
        XCTAssertThrowsError(try AfriTradeClient(baseURL: URL(string: "https://user:password@example.com")!))
    }

    func testAppIdentifier() {
        XCTAssertEqual(AfriTradeClient.appID, "6ad35f967cfc0088309e830b")
    }
}
