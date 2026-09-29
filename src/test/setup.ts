import { config } from "@vue/test-utils";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const storage = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
};

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, "localStorage", {
  writable: true,
  value: localStorageMock,
});

config.global.stubs = {
  teleport: true,
};
