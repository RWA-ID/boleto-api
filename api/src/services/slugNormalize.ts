/**
 * Normalize an artist slug for reservation checks.
 * Strips hyphens, lowercases, trims whitespace.
 * Applied both at seed time and at registration time.
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/-/g, '').trim()
}

/**
 * Validate that a slug contains only lowercase alphanumeric chars and hyphens.
 * No leading/trailing hyphens.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)
}
