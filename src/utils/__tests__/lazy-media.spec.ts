import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyLazyMedia } from "@/utils/lazy-media";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;

  constructor(private callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.add(element);
  }

  unobserve(element: Element) {
    this.observed.delete(element);
  }

  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  trigger(element: Element) {
    this.callback(
      [{ target: element, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const mount = (html: string) => {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
};

describe("applyLazyMedia", () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("给图片加上懒加载与异步解码属性", () => {
    const root = mount('<p><img src="/api/v2/static/files/a.png"><img src="/b.png"></p>');

    applyLazyMedia(root);

    root.querySelectorAll("img").forEach((img) => {
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("decoding")).toBe("async");
    });
  });

  it("把 iframe 的 src 推迟到进入可视区再挂载", () => {
    const src = "//player.bilibili.com/player.html?bvid=BV1xx";
    const root = mount(`<iframe src="${src}"></iframe>`);

    applyLazyMedia(root);

    const frame = root.querySelector("iframe")!;
    expect(frame.hasAttribute("src")).toBe(false);
    expect(frame.dataset.src).toBe(src);

    const observer = FakeIntersectionObserver.instances.at(-1)!;
    expect(observer.observed.has(frame)).toBe(true);

    observer.trigger(frame);

    expect(frame.getAttribute("src")).toBe(src);
    expect(frame.dataset.src).toBeUndefined();
    expect(observer.observed.has(frame)).toBe(false);
  });

  it("不支持 IntersectionObserver 时立即恢复所有 iframe", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const root = mount('<iframe src="/embed"></iframe>');

    applyLazyMedia(root);

    const frame = root.querySelector("iframe")!;
    expect(frame.getAttribute("src")).toBe("/embed");
    expect(frame.dataset.src).toBeUndefined();
  });

  it("清理时断开观察器", () => {
    const root = mount('<iframe src="/embed"></iframe>');

    const cleanup = applyLazyMedia(root);
    const observer = FakeIntersectionObserver.instances.at(-1)!;

    cleanup();

    expect(observer.disconnected).toBe(true);
  });

  it("没有 iframe 时不创建观察器", () => {
    const root = mount("<p>纯文本</p>");

    const cleanup = applyLazyMedia(root);

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
  });
});
