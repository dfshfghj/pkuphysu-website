interface AndroidSafeAreaBridge {
  getInsets(): string;
}

declare global {
  interface Window {
    __TAURI_ANDROID_SAFE_AREA__?: AndroidSafeAreaBridge;
    __applyAndroidSafeAreaInsets?: (top: number, right: number, bottom: number, left: number, keyboard: number) => void;
  }
}

const applyInsets = (top: number, right: number, bottom: number, left: number, keyboard = 0) => {
  const style = document.documentElement.style;
  style.setProperty("--safe-top", `${top}px`);
  style.setProperty("--safe-right", `${right}px`);
  style.setProperty("--safe-bottom", `${bottom}px`);
  style.setProperty("--safe-left", `${left}px`);
  style.setProperty("--kb-inset", `${keyboard}px`);
};

export const initializeSafeArea = () => {
  const bridge = window.__TAURI_ANDROID_SAFE_AREA__;
  if (!bridge) {
    return;
  }

  window.__applyAndroidSafeAreaInsets = applyInsets;

  const insets = bridge.getInsets().split(",").map(Number);
  if (insets.length >= 4 && insets.slice(0, 4).every(Number.isFinite)) {
    applyInsets(insets[0], insets[1], insets[2], insets[3], Number.isFinite(insets[4]) ? insets[4] : 0);
  }
};
