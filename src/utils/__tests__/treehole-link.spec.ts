import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installTreeholeLinkHandler, isTreeholeHref } from "@/utils/treehole-link";

describe("树洞链接点击处理", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.stubEnv("VITE_TREEHOLE_URL", "https://treehole.pkuphysu.cn");
    cleanup = installTreeholeLinkHandler();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("识别站内树洞链接", () => {
    expect(isTreeholeHref("/treehole/45")).toBe(true);
    expect(isTreeholeHref("/treehole")).toBe(true);
    expect(isTreeholeHref("/45")).toBe(false);
    expect(isTreeholeHref("/treeholeish")).toBe(false);
    expect(isTreeholeHref(null)).toBe(false);
  });

  it("点击树洞链接时在新窗口打开外部站点", () => {
    const open = vi.spyOn(window, "open").mockReturnValue({ opener: null } as unknown as Window);

    const link = document.createElement("a");
    link.setAttribute("href", "/treehole/8585931");
    link.textContent = "#8585931";
    document.body.appendChild(link);

    link.click();

    expect(open).toHaveBeenCalledWith("https://treehole.pkuphysu.cn?post=%238585931", "_blank");
  });

  it("普通链接不受影响", () => {
    const open = vi.spyOn(window, "open").mockReturnValue({ opener: null } as unknown as Window);

    const link = document.createElement("a");
    link.setAttribute("href", "/45");
    link.textContent = "#45";
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.appendChild(link);

    link.click();

    expect(open).not.toHaveBeenCalled();
  });
});
