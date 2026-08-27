/**
 * Prefixes an internal path with the site's configured base
 * (astro.config.mjs `base`), so nav links work both in local dev and once
 * deployed under the GitHub Pages subpath.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
