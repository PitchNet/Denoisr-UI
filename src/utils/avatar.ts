// Deterministic avatar helpers shared across pages that render people/job
// cards without a photo: a stable pastel swatch keyed off an id, and the
// initials derived from a display name.

export const SWATCHES = [
  'oklch(0.78 0.10 220)',
  'oklch(0.80 0.11 65)',
  'oklch(0.82 0.08 150)',
  'oklch(0.80 0.08 30)',
  'oklch(0.78 0.10 320)',
  'oklch(0.80 0.09 200)',
  'oklch(0.80 0.08 90)',
  'oklch(0.78 0.10 250)',
]

export function swatchFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SWATCHES[h % SWATCHES.length]
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
