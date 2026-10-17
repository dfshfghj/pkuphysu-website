import { beforeEach, describe, expect, it } from "vitest";
import { initializeSafeArea } from "@/safe-area";

const rootStyle = () => document.documentElement.style;

describe("initializeSafeArea", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
    delete window.__TAURI_ANDROID_SAFE_AREA__;
    delete window.__applyAndroidSafeAreaInsets;
  });

  it("reads the keyboard inset from the android bridge", () => {
    window.__TAURI_ANDROID_SAFE_AREA__ = { getInsets: () => "24,0,16,0,300" };
    initializeSafeArea();

    expect(rootStyle().getPropertyValue("--safe-top")).toBe("24px");
    expect(rootStyle().getPropertyValue("--safe-bottom")).toBe("16px");
    expect(rootStyle().getPropertyValue("--kb-inset")).toBe("300px");
  });

  it("keeps the keyboard inset at zero for a bridge without it", () => {
    window.__TAURI_ANDROID_SAFE_AREA__ = { getInsets: () => "24,0,16,0" };
    initializeSafeArea();

    expect(rootStyle().getPropertyValue("--kb-inset")).toBe("0px");
  });

  it("follows inset updates pushed from the native side", () => {
    window.__TAURI_ANDROID_SAFE_AREA__ = { getInsets: () => "0,0,0,0,0" };
    initializeSafeArea();

    window.__applyAndroidSafeAreaInsets?.(0, 0, 0, 0, 280);

    expect(rootStyle().getPropertyValue("--kb-inset")).toBe("280px");
  });

  it("does nothing outside the app", () => {
    initializeSafeArea();

    expect(window.__applyAndroidSafeAreaInsets).toBeUndefined();
    expect(rootStyle().getPropertyValue("--kb-inset")).toBe("");
  });
});
