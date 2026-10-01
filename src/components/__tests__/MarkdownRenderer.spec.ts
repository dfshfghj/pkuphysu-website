import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";

const mocks = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("vue-router", () => ({ useRouter: () => ({ push: mocks.routerPush }) }));
const mathRender = vi.hoisted(() => vi.fn());
vi.mock("vditor", () => ({ default: { mathRender } }));

const mountWith = (content: string, attrs: Record<string, unknown> = {}) =>
  mount(MarkdownRenderer, { props: { content }, attrs });

describe("MarkdownRenderer", () => {
  beforeEach(() => {
    mocks.routerPush.mockReset();
    mathRender.mockReset();
  });

  it("把服务端渲染好的 HTML 铺进容器并渲染公式", async () => {
    const wrapper = mountWith('<p>正文 <code>x</code></p>');
    await flushPromises();

    expect(wrapper.find(".markdown-content").html()).toContain("<p>正文 <code>x</code></p>");
    expect(mathRender).toHaveBeenCalledTimes(1);
  });

  it("站内链接接管成路由跳转，并阻止冒泡到外层卡片", async () => {
    const outerClick = vi.fn();
    const wrapper = mountWith('<p><a href="/45">#45</a></p>', { onClick: outerClick });
    await flushPromises();

    await wrapper.find("a").trigger("click");

    expect(mocks.routerPush).toHaveBeenCalledWith("/45");
    expect(outerClick).not.toHaveBeenCalled();
  });

  it("点击普通内容仍然冒泡给外层卡片", async () => {
    const outerClick = vi.fn();
    const wrapper = mountWith("<p>普通正文</p>", { onClick: outerClick });

    await wrapper.find(".markdown-body").trigger("click");

    expect(outerClick).toHaveBeenCalledTimes(1);
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it("外链与锚点保持浏览器默认行为", async () => {
    const wrapper = mountWith('<p><a href="https://example.com">外链</a><a href="#top">锚点</a></p>');
    wrapper.element.addEventListener("click", (event) => event.preventDefault());

    await wrapper.findAll("a")[0].trigger("click");
    await wrapper.findAll("a")[1].trigger("click");

    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it("不认识引用：不标注、不挂 hover", async () => {
    const wrapper = mountWith('<p><a href="/45">#45</a></p>');
    await flushPromises();

    const link = wrapper.find("a");
    expect(link.attributes("data-post-quote")).toBeUndefined();
    expect(link.classes()).toHaveLength(0);

    await link.trigger("mouseover");
    await flushPromises();
    expect(document.body.querySelector('[data-slot="hover-card-content"]')).toBeNull();
  });
});
