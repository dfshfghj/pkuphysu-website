import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useOnboardingStore } from "@/stores/onboarding";

describe("onboarding", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("offers only to an identified account and starts only on request", () => {
    const store = useOnboardingStore();
    store.offer();
    expect(store.phase).toBe("idle");
    store.identify("12");
    expect(store.phase).toBe("idle");
    store.offer();
    expect(store.phase).toBe("available");
    store.start();
    expect(store.phase).toBe("idle");
    expect(localStorage.getItem("onboarding:v1:12")).toBeNull();
    store.offer();
    expect(store.phase).toBe("idle");
  });

  it("persists dismissal and never automatically reoffers after refresh", () => {
    const store = useOnboardingStore();
    store.identify("12");
    store.offer();
    store.dismiss();
    expect(localStorage.getItem("onboarding:v1:12")).toBe("skipped");
    store.offer();
    expect(store.phase).toBe("idle");
    setActivePinia(createPinia());
    const refreshed = useOnboardingStore();
    refreshed.identify("12");
    refreshed.offer();
    expect(refreshed.phase).toBe("idle");
  });

  it.each(["skipped", "completed"])("does not auto-offer a stored %s record but permits replay", (record) => {
    localStorage.setItem("onboarding:v1:12", record);
    const store = useOnboardingStore();
    store.identify("12");
    store.offer();
    expect(store.phase).toBe("idle");
    store.replay();
    expect(store.phase).toBe("idle");
    expect(localStorage.getItem("onboarding:v1:12")).toBe(record);
  });

  it.each(["started", "unknown"])("offers again when storage holds a legacy %s record", (record) => {
    localStorage.setItem("onboarding:v1:12", record);
    const store = useOnboardingStore();
    store.identify("12");
    store.offer();
    expect(store.phase).toBe("available");
    store.start();
    expect(localStorage.getItem("onboarding:v1:12")).toBe(record);
  });

  it("re-offers an unfinished tutorial after a refresh but not within the same session", () => {
    const store = useOnboardingStore();
    store.identify("12");
    store.offer();
    store.start();
    expect(localStorage.getItem("onboarding:v1:12")).toBeNull();
    store.offer();
    expect(store.phase).toBe("idle");

    setActivePinia(createPinia());
    const refreshed = useOnboardingStore();
    refreshed.identify("12");
    refreshed.offer();
    expect(refreshed.phase).toBe("available");
  });

  it("preserves an offered prompt for the same account and records completion", () => {
    const store = useOnboardingStore();
    store.identify("12");
    store.offer();
    store.identify("12");
    expect(store.phase).toBe("available");
    store.complete();
    expect(store.phase).toBe("idle");
    expect(localStorage.getItem("onboarding:v1:12")).toBe("completed");
  });

  it("isolates accounts and resets runtime progress without writing the old account", () => {
    const store = useOnboardingStore();
    store.identify("12");
    store.start();
    store.identify("34");
    expect(store.phase).toBe("idle");
    store.offer();
    expect(store.phase).toBe("available");
    store.dismiss();
    expect(localStorage.getItem("onboarding:v1:12")).toBeNull();
    expect(localStorage.getItem("onboarding:v1:34")).toBe("skipped");
    store.identify(null);
    store.start();
    store.replay();
    expect(store.phase).toBe("idle");
  });

  it("survives unavailable storage and remembers handled accounts for this session", () => {
    const getItem = vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = useOnboardingStore();
    store.identify("12");
    store.offer();
    expect(store.phase).toBe("available");
    expect(() => store.dismiss()).not.toThrow();
    expect(getItem).toHaveBeenCalledWith("onboarding:v1:12");
    expect(setItem).toHaveBeenCalledWith("onboarding:v1:12", "skipped");
    store.identify("34");
    store.identify("12");
    store.offer();
    expect(store.phase).toBe("idle");
  });
});
