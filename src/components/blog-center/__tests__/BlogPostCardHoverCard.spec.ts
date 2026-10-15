import { createPinia, setActivePinia } from "pinia";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import { useForumStore, type Post } from "@/stores/forum";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  requestApi: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

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
    setActivePinia(createPinia());
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

  it("keeps cached cards synchronized after detail likes, follows, and refreshed content", async () => {
    const store = useForumStore();
    store.upsertPosts([post as Post]);
    const home = mount(BlogPostCard, { props: { post }, global: { stubs } });
    const detail = mount(BlogPostCard, { props: { post: { ...post } }, global: { stubs } });
    await detail.get('button[aria-label="点赞"]').trigger("click");
    await flushPromises();
    expect(home.get('button[aria-label="点赞"]').attributes("aria-pressed")).toBe("true");
    expect(home.get('button[aria-label="点赞"]').text()).toBe("1");
    await detail.get('button[aria-label="关注"]').trigger("click");
    await flushPromises();
    expect(home.get('button[aria-label="关注"]').attributes("aria-pressed")).toBe("true");
    expect(home.get('button[aria-label="关注"]').text()).toBe("1");
    store.upsertPosts([{ ...post, likenum: 9, is_like: 0, follownum: 4, is_follow: 0 } as Post]);
    await nextTick();
    expect(home.get('button[aria-label="点赞"]').text()).toBe("9");
    expect(detail.get('button[aria-label="关注"]').text()).toBe("4");
    home.unmount();
    detail.unmount();
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

describe("BlogPostCard 评论预览剩余条数", () => {
  it("预览未展示完全时显示剩余条数", async () => {
    const wrapper = mount(BlogPostCard, {
      props: {
        post: {
          ...post,
          reply: 5,
          comments: [
            { cid: 1, username: "Bob", text: "<p>a</p>", quote: null },
            { cid: 2, username: "Carol", text: "<p>b</p>", quote: null },
            { cid: 3, username: "Dave", text: "<p>c</p>", quote: null },
          ],
        },
      },
      global: { stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("还有 3 条回复");
    wrapper.unmount();
  });

  it("评论全部展示时不显示剩余条数", async () => {
    const wrapper = mount(BlogPostCard, {
      props: {
        post: {
          ...post,
          reply: 2,
          comments: [
            { cid: 1, username: "Bob", text: "<p>a</p>", quote: null },
            { cid: 2, username: "Carol", text: "<p>b</p>", quote: null },
          ],
        },
      },
      global: { stubs },
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain("还有");
    wrapper.unmount();
  });

  it("有回复数但没有预览评论时也显示剩余条数", async () => {
    const wrapper = mount(BlogPostCard, {
      props: { post: { ...post, reply: 3, comments: [] } },
      global: { stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("还有 3 条回复");
    wrapper.unmount();
  });
});
