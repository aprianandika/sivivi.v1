/**
 * Detects whether we're running inside Electron (preload exposes window.api)
 * or in a regular browser (PWA). Every service uses this to pick the right
 * implementation at module load time.
 */
export const isElectron = typeof globalThis.api !== 'undefined' && globalThis.api !== null;

export const runtime = {
  isElectron,
  isWeb: !isElectron,
  // Label surfaced in the UI (Settings page) so users know which build they're on.
  label: isElectron ? 'Desktop (Electron)' : 'Web / PWA',
};
