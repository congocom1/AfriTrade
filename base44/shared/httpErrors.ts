// HTTP error classification for backend function entry points.
// ClientInputError marks failures caused by the caller's input or state
// (unknown ids, empty cart, insufficient funds). Entry-point catch blocks map
// them to 400 via errorStatus; anything else stays a 500 server fault.

export class ClientInputError extends Error {}

export function errorStatus(error: unknown): number {
  return error instanceof ClientInputError ? 400 : 500;
}
