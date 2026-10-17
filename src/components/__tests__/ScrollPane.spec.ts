import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ScrollPane from "@/components/ScrollPane.vue";

const touchEvent = (type: string, y: number, x = 0) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value: type === "touchend" || type === "touchcancel" ? [] : [{ clientY: y, clientX: x }],
  });
  return event;
};

const pull = async (viewport: Element, from: number, to: number) => {
  viewport.dispatchEvent(touchEvent("touchstart", from));
  viewport.dispatchEvent(touchEvent("touchmove", to));
  viewport.dispatchEvent(touchEvent("touchend", to));
  await flushPromises();
};

const setup = (refresh?: () => unknown) => {
  const wrapper = mount(ScrollPane, {
    props: { refresh },
    slots: { default: () => "<div>content</div>" },
    attachTo: document.body,
  });
  const viewport = wrapper.element.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
  return { wrapper, viewport };
};

describe("ScrollPane pull to refresh", () => {
  it("refreshes when the pull passes the threshold", async () => {
    const refresh = vi.fn(async () => {});
    const { wrapper, viewport } = setup(refresh);

    viewport.dispatchEvent(touchEvent("touchstart", 100));
    viewport.dispatchEvent(touchEvent("touchmove", 320));
    expect(viewport.style.paddingTop).toBe("96px");

    viewport.dispatchEvent(touchEvent("touchend", 320));
    await flushPromises();
    expect(refresh).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it("ignores short pulls", async () => {
    const refresh = vi.fn(async () => {});
    const { wrapper, viewport } = setup(refresh);

    await pull(viewport, 100, 140);
    expect(refresh).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("ignores pulls when the content is scrolled", async () => {
    const refresh = vi.fn(async () => {});
    const { wrapper, viewport } = setup(refresh);

    Object.defineProperty(viewport, "scrollTop", { value: 200, configurable: true });
    await pull(viewport, 100, 320);
    expect(refresh).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("does not pull without a refresh handler", async () => {
    const { wrapper, viewport } = setup();

    viewport.dispatchEvent(touchEvent("touchstart", 100));
    const move = touchEvent("touchmove", 320);
    viewport.dispatchEvent(move);
    viewport.dispatchEvent(touchEvent("touchend", 320));
    await flushPromises();

    expect(move.defaultPrevented).toBe(false);
    expect(viewport.style.paddingTop).toBe("");

    wrapper.unmount();
  });
});
