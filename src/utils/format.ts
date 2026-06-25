// Small formatting helpers shared across pages.

/** Clamp to a non-negative integer and left-pad to two digits (e.g. 5 -> "05"). */
export function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}
