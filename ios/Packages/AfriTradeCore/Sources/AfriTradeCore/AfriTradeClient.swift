import Foundation

public enum AfriTradeAPIError: Error, Equatable {
    case invalidBaseURL
    case invalidPath
    case unauthorized
    case httpStatus(Int)
    case invalidResponse
}

/// Typed, dependency-injected transport for approved HTTPS backend endpoints.
/// Authentication credentials are supplied at call time, never embedded in the app.
public struct AfriTradeClient {
    public static let appID = "6ad35f967cfc0088309e830b"

    public let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) throws {
        guard baseURL.scheme?.lowercased() == "https", baseURL.host != nil,
              baseURL.user == nil, baseURL.password == nil,
              baseURL.query == nil, baseURL.fragment == nil else {
            throw AfriTradeAPIError.invalidBaseURL
        }
        self.baseURL = baseURL
        self.session = session
    }

    /// Caller supplies a session token obtained via the approved authentication flow.
    /// `path` must be an absolute path relative to the configured API origin.
    public func request<Response: Decodable>(
        path: String,
        method: String = "GET",
        bearerToken: String? = nil,
        body: Data? = nil,
        decoder: JSONDecoder = JSONDecoder()
    ) async throws -> Response {
        guard path.hasPrefix("/"), !path.hasPrefix("//"),
              !path.contains("?") && !path.contains("#") && !path.contains("\\"),
              !path.split(separator: "/").contains("..") else {
            throw AfriTradeAPIError.invalidPath
        }
        let root = baseURL.appendingPathComponent("/")
        guard let url = URL(string: String(path.dropFirst()), relativeTo: root)?.absoluteURL,
              url.host == root.host, url.scheme == "https" else {
            throw AfriTradeAPIError.invalidPath
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let bearerToken, !bearerToken.isEmpty {
            guard !bearerToken.contains("\r") && !bearerToken.contains("\n") else {
                throw AfriTradeAPIError.unauthorized
            }
            request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AfriTradeAPIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 || http.statusCode == 403 { throw AfriTradeAPIError.unauthorized }
            throw AfriTradeAPIError.httpStatus(http.statusCode)
        }
        return try decoder.decode(Response.self, from: data)
    }
}
