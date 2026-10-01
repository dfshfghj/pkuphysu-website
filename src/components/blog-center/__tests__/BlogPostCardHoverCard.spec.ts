import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  requestApi: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

vi.mock("@/stores/forum", async () => {
  const actual = await vi.importActual<typeof import("@/stores/forum")>("@/stores/forum");
  return {
    ...actual,
    useForumStore: () => ({ updatePostLike: vi.fn(), updateCommentLike: vi.fn() }),
  };
});

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ role: 0, userid: "1" }),
}));

vi.mock("vue-sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const passthrough = (name: string) =>
  defineComponent({
    name,
    template: "<div><slot /></div>",
  });

const stub = (name: string) => defineComponent({ name, template: "<div />" });

const dropdownStubs = {
  DropdownMenu: passthrough("DropdownMenu"),
  DropdownMenuTrigger: passthrough("DropdownMenuTrigger"),
  DropdownMenuContent: passthrough("DropdownMenuContent"),
  DropdownMenuItem: defineComponent({
    name: "DropdownMenuItem",
    emits: ["click"],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  }),
};

// 注意：HoverCard / HoverCardTrigger / HoverCardContent 不 stub —— 这个用例就是要
// 跑真实的 reka-ui 路径（teleport 到 body + Presence + Popper 定位）。
const stubs = {
  CollapsibleDiv: passthrough("CollapsibleDiv"),
  MarkdownRenderer: stub("MarkdownRenderer"),
  UserAvatar: stub("UserAvatar"),
  ForumReportDialog: stub("ForumReportDialog"),
  AdminDeleteDialog: stub("AdminDeleteDialog"),
  PostHistoryDialog: stub("PostHistoryDialog"),
  BlogPostEditor: stub("BlogPostEditor"),
  "el-button": stub("ElButton"),
  "el-icon": passthrough("ElIcon"),
  IconRiHeartFill: stub("IconRiHeartFill"),
  IconRiHeartLine: stub("IconRiHeartLine"),
  Star: stub("Star"),
  StarFilled: stub("StarFilled"),
  ChatLineRound: stub("ChatLineRound"),
  ...dropdownStubs,
};

const post = {
  id: 7,
  text: "post",
  userid: 1,
  username: "Alice",
  timestamp: 1,
  follownum: 0,
  is_follow: 0,
  likenum: 0,
  is_like: 0,
  reply: 0,
  type: 0,
  tags: [],
};

const isHoverCardContent = (el: Element | null) => el?.getAttribute?.("data-slot") === "hover-card-content";

// jsdom 不带 Tailwind 的 animate-out，getComputedStyle().animationName 恒为 "none"，
// reka-ui 的 Presence 就会同步卸载浮层 —— 那样根本复现不出线上的问题。
// 这里只在浮层切到 closed 的瞬间补上动画名，模拟浏览器里 animate-out 生效的那一帧，
// 让 Presence 进入 unmountSuspended（元素继续挂在 DOM 上）。
const withExitAnimation = () => {
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element, pseudo?: string | null) => {
    const style = original(el, pseudo);
    if (isHoverCardContent(el) && el.getAttribute("data-state") === "closed") {
      Object.defineProperty(style, "animationName", { value: "fade-out", configurable: true });
    }
    return style;
  });
};

describe("BlogPostCard 悬浮卡跳转", () => {
  beforeEach(() => {
    mocks.routerPush.mockReset();
    mocks.requestApi.mockReset();
    document.body.innerHTML = "";
    mocks.requestApi.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { post_count: 1, comment_count: 2, likes_received: 3 } }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("点击名字时先移除 teleport 到 body 的浮层，再跳转", async () => {
    withExitAnimation();

    // 全局 setup 把 teleport stub 掉了，这里要还原真实 Teleport 才能验证浮层脱离参考元素后的行为
    const wrapper = mount(BlogPostCard, { props: { post }, global: { stubs: { ...stubs, teleport: false } } });
    await flushPromises();

    // 浮层此时不该在 DOM 里
    expect(document.body.querySelector('[data-slot="hover-card-content"]')).toBeNull();

    // 打开悬浮卡（真实 HoverCardRoot 的 open 被上层控制）
    wrapper.findComponent({ name: "HoverCardRoot" }).vm.$emit("update:open", true);
    await flushPromises();

    const content = document.body.querySelector('[data-slot="hover-card-content"]');
    expect(content).not.toBeNull();

    // 根因层的通用防护：开启 floating-ui 的 hide() 中间件。
    // 参考元素被移除后 rects.reference 全为 0，中间件会把浮层置为 visibility: hidden，
    // 从而杜绝 Floating UI 把卡片重算到 (0,0)（即"瞬移到左上角"）。
    // jsdom 里所有 rect 都是 0，没法断言真实的隐藏效果，只能守住这个开关不被摘掉。
    expect(
      wrapper
        .findAllComponents({ name: "HoverCardContent" })
        .some((component) => component.props("hideWhenDetached") === true)
    ).toBe(true);

    // 点击浮层里的用户名 → 应立刻摘掉浮层，然后才导航
    const name = content!.querySelector("span") as HTMLElement;
    expect(name.textContent?.trim()).toBe("Alice");
    name.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    await nextTick();

    // 关键：参考元素（头像）还在时浮层就已经从 body 里消失，
    // 不存在"参考元素没了但浮层还活着"的窗口，因此不会被重定位到 (0,0)
    expect(document.body.querySelector('[data-slot="hover-card-content"]')).toBeNull();
    expect(mocks.routerPush).toHaveBeenCalledWith({ name: "UserProfile", params: { id: 1 } });

    // 列表被 keep-alive 缓存，回来重新悬浮时应能再次打开
    wrapper.findComponent({ name: "HoverCardRoot" }).vm.$emit("update:open", true);
    await flushPromises();
    expect(document.body.querySelector('[data-slot="hover-card-content"]')).not.toBeNull();

    wrapper.unmount();
  });
});
