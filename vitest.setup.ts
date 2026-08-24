// Node's experimental built-in localStorage can shadow jsdom's and lack
// methods. Normalize to a working storage implementation for tests.
if (
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.clear !== 'function'
) {
  const store = new Map<string, string>()
  const shimmed: Storage = {
    get length() {
      return store.size
    },
    key: (index) => [...store.keys()][index] ?? null,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    clear: () => void store.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: shimmed,
    configurable: true,
  })
}
