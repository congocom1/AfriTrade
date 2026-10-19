// HTTP error classification for backend function entry points.
// ClientInputError marks failures caused by the caller's input or state
// (unknown ids, empty cart, insufficient funds). Entry-point catch blocks map
// them to 400 via errorStatus; anything else stays a 500 server fault.
// The status travels as a property, not an instanceof check: the platform
// bundler can duplicate a shared module, and instanceof fails across copies.

export class ClientInputError extends Error {
  status = 400;
}

export function errorStatus(error: unknown): number {
  return (error as { status?: unknown } | null)?.status === 400 ? 400 : 500;
}
