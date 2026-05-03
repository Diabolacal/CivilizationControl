/**
 * Address/ID formatting utilities.
 *
 * Shared across list screens and detail headers to avoid
 * duplicating inline short() functions.
 */

/** Truncate long IDs as "abcdef…1234" while preserving short values. */
export function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) {
    return value;
  }

  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Shorten a Sui object ID to "0x1234…cdef" format. */
export function shortId(id: string): string {
  return truncateMiddle(id);
}
