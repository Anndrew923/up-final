/**
 * Smooth-scroll to a home section id.
 * WHY: Same-hash Link clicks often skip location updates — Navbar TOC needs an
 * explicit scroll after click.
 */
export function scrollHomeAnchor(hash: string) {
  document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
}
