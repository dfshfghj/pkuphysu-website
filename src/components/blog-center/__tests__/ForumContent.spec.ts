import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForumContent from "@/components/blog-center/ForumContent.vue";
import { clearPostQuoteCache } from "@/utils/post-quote";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  requestApi: vi.fn(),
}));

vi.mock("vue-router", () => ({ useRouter: () => ({ push: mocks.routerPush }) }));
vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));
vi.mock("vditor", () => ({ default: { mathRender: vi.fn() } }));

const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

const quotePayload = (overrides: Record<string, unknown> = {}) => ({
  id: 45,
  available: true,
  userid: 1,
  username: "张景天",
  text: "<p>被引用的完整正文</p>",
  excerpt: "被引用的完整正文",
  timestamp: 1790782994,
  ...overrides,
});

const mountWith = (content: string, attrs: Record<string, unknown> = {}) =>
  mount(ForumContent, { props: { content }, attrs, global: { stubs: { teleport: false } } });

const quoteCard = () => document.body.querySelector('[data-slot="hover-card-content"]');

const hoverLink = async (wrapper: ReturnType<typeof mountWith>, index = 0) => {
  await wrapper.findAll("a[data-post-quote]")[index].trigger("mouseover");
  await flushPromises();
};

describe("ForumContent 的引用行为", () => {
  beforeEach(() => {
    clearPostQuoteCache();
    mocks.routerPush.mockReset();
    mocks.requestApi.mockReset();
    document.body.innerHTML = "";
  });

  it("引用标记只打标记，不改动 DOM 结构也不改样式", async () => {
    const wrapper = mountWith('<p>见 <a href="/45" rel="nofollow">#45</a> 这条</p>');
    await flushPromises();

    const link = wrapper.find("a");
    expect(link.attributes("data-post-quote")).toBe("45");
    expect(link.classes()).toHaveLength(0);
    expect(wrapper.find("p a").exists()).toBe(true);
    expect(mocks.requestApi).not.toHaveBeenCalled();
    expect(quoteCard()).toBeNull();
  });

  it("hover 时弹出卡片并展示被引帖的完整正文", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([quotePayload()]));

    const wrapper = mountWith('<p>见 <a href="/45" rel="nofollow">#45</a> 这条</p>');
    await hoverLink(wrapper);

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/post-quotes?ids=45");

    const card = quoteCard();
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("引用");
    expect(card!.textContent).toContain("张景天");
    expect(card!.textContent).toContain("#45");
    expect(card!.querySelector(".post-quote-body")?.textContent).toContain("被引用的完整正文");
  });

  it("卡片内部的引用链接不再挂 hover（hover 不是渲染器的通用行为）", async () => {
    mocks.requestApi.mockResolvedValueOnce(
      okResponse([quotePayload({ text: '<p>见 <a href="/23">#23</a> 这条</p>' })])
    );

    const wrapper = mountWith('<p><a href="/45">#45</a></p>');
    await hoverLink(wrapper);

    const innerLink = quoteCard()?.querySelector("a[href='/23']");
    expect(innerLink).not.toBeNull();
    expect(innerLink!.getAttribute("data-post-quote")).toBeNull();
  });

  it("帖子不可见时给出提示", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([{ id: 999, available: false }]));

    const wrapper = mountWith('<p><a href="/999">#999</a></p>');
    await hoverLink(wrapper);

    expect(quoteCard()?.textContent).toContain("不存在、已被删除或当前不可见");
  });

  it("同一篇帖子再次 hover 命中缓存，不重复请求", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([quotePayload()]));

    const wrapper = mountWith('<p><a href="/45">#45</a></p>');
    await hoverLink(wrapper);
    await hoverLink(wrapper);

    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
  });

  it("作者手写的普通站内链接不会被当成引用", async () => {
    const wrapper = mountWith('<p><a href="/45">看这个</a></p>');
    await flushPromises();

    expect(wrapper.find("a").attributes("data-post-quote")).toBeUndefined();

    await wrapper.find("a").trigger("mouseover");
    await flushPromises();
    expect(mocks.requestApi).not.toHaveBeenCalled();
  });

  it("点击引用链接走路由跳转，并阻止冒泡到外层卡片", async () => {
    const outerClick = vi.fn();
    const wrapper = mountWith('<p><a href="/45">#45</a></p>', { onClick: outerClick });
    await flushPromises();

    await wrapper.find("a").trigger("click");

    expect(mocks.routerPush).toHaveBeenCalledWith("/45");
    expect(outerClick).not.toHaveBeenCalled();
  });

  it("hover 之后把链接注册成触发元素，激活 reka 的 grace area", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([quotePayload()]));

    const wrapper = mountWith('<p><a href="/45">#45</a></p>');
    await hoverLink(wrapper);

    const addListener = vi.spyOn(document, "addEventListener");
    wrapper.find("a").element.dispatchEvent(new MouseEvent("pointerleave", { clientX: 0, clientY: 0 }));
    await flushPromises();

    expect(addListener.mock.calls.map((call) => call[0])).toContain("pointermove");
    addListener.mockRestore();
  });

  it("卡片关闭后重新打开，正文依然要显示出来", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([quotePayload()]));

    const wrapper = mountWith('<p><a href="/45">#45</a></p>');
    const bodyText = () => quoteCard()?.querySelector(".post-quote-body")?.textContent ?? "";

    await hoverLink(wrapper);
    expect(bodyText()).toContain("被引用的完整正文");

    wrapper.findComponent({ name: "HoverCardRoot" }).vm.$emit("update:open", false);
    await flushPromises();
    expect(quoteCard()).toBeNull();

    await hoverLink(wrapper);

    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
    expect(quoteCard()).not.toBeNull();
    expect(bodyText()).toContain("被引用的完整正文");
  });
});
