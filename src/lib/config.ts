/**
 * Date when access expires for every user.
 * Reads from NEXT_PUBLIC_ACCESS_EXPIRES_AT, falls back to Aug 15, 2026 23:59:59 UTC.
 */
export const ACCESS_EXPIRES_AT: Date = new Date(
  process.env.NEXT_PUBLIC_ACCESS_EXPIRES_AT ?? "2026-08-15T23:59:59Z"
);

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return "http://localhost:3000";
}
