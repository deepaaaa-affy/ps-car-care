// Sections of the long home page, in order (id, menu label, standalone route).
export const SECTIONS = [
  ['home', 'Home', '/'],
  ['services', 'Services', '/services'],
  ['about', 'About us', '/about'],
  ['gallery', 'Gallery', '/gallery'],
  ['contact', 'Contact', '/contact'],
];

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Smooth-scrolls to a home page section; "home" means the top of the page.
export function scrollToId(id) {
  const behavior = reduced() ? 'auto' : 'smooth';
  if (id === 'home') return window.scrollTo({ top: 0, behavior });
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
}

// How far below the sticky header a section counts as "being read" (matches CSS scroll-padding-top).
export const headerOffset = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
