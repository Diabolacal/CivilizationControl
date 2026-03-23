/**
 * Address/ID formatting utilities.
 *
 * Shared across list screens and detail headers to avoid
 * duplicating inline short() functions.
 */

/** Shorten a Sui object ID to "0x1234…cdef" format. */
export function shortId(id: string): string {
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
