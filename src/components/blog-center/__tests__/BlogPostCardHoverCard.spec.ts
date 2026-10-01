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

const stubs = {
  CollapsibleDiv: passthrough("CollapsibleDiv"),
  MarkdownRenderer: stub("MarkdownRenderer"),
  ForumContent: stub("ForumContent"),
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

    const wrapper = mount(BlogPostCard, { props: { post }, global: { stubs: { ...stubs, teleport: false } } });
    await flushPromises();

    expect(document.body.querySelector('[data-slot="hover-card-content"]')).toBeNull();

    wrapper.findComponent({ name: "HoverCardRoot" }).vm.$emit("update:open", true);
    await flushPromises();

    const content = document.body.querySelector('[data-slot="hover-card-content"]');
    expect(content).not.toBeNull();

    expect(
      wrapper
        .findAllComponents({ name: "HoverCardContent" })
        .some((component) => component.props("hideWhenDetached") === true)
    ).toBe(true);

    const name = content!.querySelector("span") as HTMLElement;
    expect(name.textContent?.trim()).toBe("Alice");
    name.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    await nextTick();

    expect(document.body.querySelector('[data-slot="hover-card-content"]')).toBeNull();
    expect(mocks.routerPush).toHaveBeenCalledWith({ name: "UserProfile", params: { id: 1 } });

    wrapper.findComponent({ name: "HoverCardRoot" }).vm.$emit("update:open", true);
    await flushPromises();
    expect(document.body.querySelector('[data-slot="hover-card-content"]')).not.toBeNull();

    wrapper.unmount();
  });
});
