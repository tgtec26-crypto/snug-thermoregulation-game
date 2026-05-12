import '@testing-library/jest-dom';

// jsdom v29 는 기본적으로 localStorage 의 setItem/getItem 메서드를 제공하지 않는다.
// zustand persist 미들웨어가 동작하도록 in-memory polyfill 을 주입한다.
if (typeof window !== 'undefined' && typeof window.localStorage?.setItem !== 'function') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => { store.delete(k); },
    setItem: (k, v) => { store.set(k, String(v)); },
  };
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
}
