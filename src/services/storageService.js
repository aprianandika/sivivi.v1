import { isElectron } from './runtime';

/**
 * Renderer-side facade for persistent storage. Picks the right backend at
 * load time:
 *   - Electron build → IPC bridge (electron-store on disk)
 *   - Web/PWA build  → localStorage with a sivivi: namespace
 *
 * IPC uses the structured-clone algorithm, which throws on Vue's reactive
 * Proxies ("An object could not be cloned."). A JSON round-trip is the simplest
 * way to drop reactivity markers — CV data is plain JSON anyway.
 */
function toPlain(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)); // NOSONAR
}

const electronStorage = {
  get: (key) => globalThis.api.storage.get(key),
  set: (key, value) => globalThis.api.storage.set(key, toPlain(value)),
  clear: () => globalThis.api.storage.clear(),
};

const NS = 'sivivi:';

const webStorage = {
  get: async (key) => {
    if (!key) {
      // Mimic electron-store's store getter — return everything namespaced.
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NS)) {
          try {
            out[k.slice(NS.length)] = JSON.parse(localStorage.getItem(k));
          } catch {
            // ignore malformed entries
          }
        }
      }
      return out;
    }
    const raw = localStorage.getItem(NS + key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  set: async (key, value) => {
    const plain = toPlain(value);
    if (plain == null) localStorage.removeItem(NS + key);
    else localStorage.setItem(NS + key, JSON.stringify(plain));
    return true;
  },
  clear: async () => {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) toDelete.push(k);
    }
    for (const k of toDelete) localStorage.removeItem(k);
    return true;
  },
};

export const storage = isElectron ? electronStorage : webStorage;
