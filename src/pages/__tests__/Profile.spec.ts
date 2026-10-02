import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, reactive } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "@/pages/Profile.vue";

const mocks = vi.hoisted(() => ({
  routeState: { params: { id: "1" } },
  route: null as { params: { id: string } } | null,
  routerPush: vi.fn(),
  requestApi: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  userStore: { userid: "1", username: "自己" },
}));

vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive(mocks.routeState);
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({ push: mocks.routerPush }),
  };
});

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));
vi.mock("@/stores/user", () => ({ useUserStore: () => mocks.userStore }));
vi.mock("@/composables/theme", () => ({ isDark: { value: false } }));
vi.mock("vue-sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError, warning: vi.fn() },
}));

const route = reactive(mocks.routeState);

const UserAvatarStub = defineComponent({
  name: "UserAvatar",
  props: { userid: { type: String, default: "" }, size: { type: Number, default: 40 } },
  template: '<span class="avatar-stub" />',
});

const BlogPostCardStub = defineComponent({
  name: "BlogPostCard",
  props: { post: { type: Object, required: true } },
  emits: ["card-click", "deleted", "updated"],
  template: '<div class="post-card">{{ post.id }}</div>',
});

const MarkdownRendererStub = defineComponent({
  name: "MarkdownRenderer",
  props: { content: { type: String, default: "" } },
  template: '<div class="markdown-renderer">{{ content }}</div>',
});

const MarkdownEditorStub = defineComponent({
  name: "MarkdownEditor",
  props: { modelValue: { type: String, default: "" } },
  emits: ["update:modelValue"],
  template:
    '<textarea class="markdown-editor" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const slotStub = (name: string) =>
  defineComponent({
    name,
    template: "<div><slot /></div>",
  });

const DialogStub = defineComponent({
  name: "Dialog",
  props: { open: { type: Boolean, default: false } },
  template: '<div v-if="open" class="dialog-stub"><slot /></div>',
});

const ScrollPaneStub = defineComponent({
  name: "ScrollPane",
  emits: ["end-reached"],
  template: "<div><slot /></div>",
  methods: {
    // ScrollPane 通过 ref 暴露 scrollTo，桩件需要提供同名方法
    scrollTo() {},
  },
});

const stubs = {
  UserAvatar: UserAvatarStub,
  BlogPostCard: BlogPostCardStub,
  MarkdownRenderer: MarkdownRendererStub,
  MarkdownEditor: MarkdownEditorStub,
  Dialog: DialogStub,
  DialogContent: slotStub("DialogContent"),
  DialogHeader: slotStub("DialogHeader"),
  DialogTitle: slotStub("DialogTitle"),
  DialogDescription: slotStub("DialogDescription"),
  DialogFooter: slotStub("DialogFooter"),
  ScrollPane: ScrollPaneStub,
  Badge: defineComponent({ name: "Badge", template: "<span><slot /></span>" }),
};

const profileResponse = (overrides: Record<string, unknown> = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: {
      user: { id: 1, username: "张景天", bio: "凝聚态", role: 2, verified: true },
      is_self: true,
      profile: { content: "<p>我的主页</p>", updated_at: 1790000000 },
      stats: { post_count: 9, comment_count: 19, likes_received: 5 },
      posts: [{ id: 45, userid: 1, username: "张景天", text: "<p>hi</p>", tags: [] }],
      ...overrides,
    },
  }),
});

describe("Profile", () => {
  beforeEach(() => {
    route.params.id = "1";
    mocks.userStore.userid = "1";
    mocks.requestApi.mockReset();
    mocks.routerPush.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  it("renders user info, stats, custom markdown and recent posts", async () => {
    mocks.requestApi.mockResolvedValueOnce(profileResponse());

    const wrapper = mount(Profile, { global: { stubs } });
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/users/1/profile?limit=10");
    expect(wrapper.text()).toContain("张景天");
    // 个性签名已从主页移除，不再展示 bio
    expect(wrapper.text()).not.toContain("凝聚态");
    expect(wrapper.text()).toContain("9");
    expect(wrapper.text()).toContain("19");
    expect(wrapper.find(".markdown-renderer").text()).toContain("我的主页");
    expect(wrapper.findAll(".post-card")).toHaveLength(1);
    expect(wrapper.find(".post-card").text()).toBe("45");
  });

  it("shows the edit entry only on the own profile", async () => {
    mocks.requestApi.mockResolvedValueOnce(profileResponse());
    const own = mount(Profile, { global: { stubs } });
    await flushPromises();
    expect(own.text()).toContain("编辑主页");

    mocks.requestApi.mockResolvedValueOnce(
      profileResponse({ is_self: false, user: { id: 2, username: "姚博骞", bio: "", role: 0, verified: true } })
    );
    route.params.id = "2";
    const other = mount(Profile, { global: { stubs } });
    await flushPromises();
    expect(other.text()).not.toContain("编辑主页");
    expect(other.text()).toContain("TA 还没有填写自定义内容");
  });

  it("renders the empty state and the not-found state", async () => {
    mocks.requestApi.mockResolvedValueOnce(profileResponse({ profile: { content: "", updated_at: null }, posts: [] }));
    const empty = mount(Profile, { global: { stubs } });
    await flushPromises();
    expect(empty.text()).toContain("还没有自定义内容");
    expect(empty.text()).toContain("TA 还没有公开的帖子");

    mocks.requestApi.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    const missing = mount(Profile, { global: { stubs } });
    await flushPromises();
    expect(missing.text()).toContain("该用户不存在或已被删除");
  });

  it("loads the raw markdown into the editor and saves it", async () => {
    mocks.requestApi
      .mockResolvedValueOnce(profileResponse())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { content: "## 原文", max_length: 5000 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { message: "主页内容已更新", content: "<h2>新内容</h2>" } }),
      });

    const wrapper = mount(Profile, { global: { stubs } });
    await flushPromises();

    const editButton = wrapper.findAll("button").find((btn) => btn.text().includes("编辑主页"))!;
    await editButton.trigger("click");
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenNthCalledWith(2, "/api/v2/user/me/profile");
    expect(wrapper.find(".markdown-editor").element.value).toBe("## 原文");

    await wrapper.find(".markdown-editor").setValue("## 新内容");
    const saveButton = wrapper.findAll("button").find((btn) => btn.text().includes("保存"))!;
    await saveButton.trigger("click");
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenNthCalledWith(3, "/api/v2/user/me/profile", {
      method: "PUT",
      body: JSON.stringify({ content: "## 新内容" }),
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("主页内容已更新");
    expect(wrapper.find(".markdown-renderer").text()).toContain("<h2>新内容</h2>");
  });

  it("blocks saving and reports an error when the content is too long", async () => {
    mocks.requestApi
      .mockResolvedValueOnce(profileResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { content: "", max_length: 10 } }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ status: 400, errid: "ContentTooLong", message: "主页内容最多 5000 个字符" }),
      });

    const wrapper = mount(Profile, { global: { stubs } });
    await flushPromises();

    const editButton = wrapper.findAll("button").find((btn) => btn.text().includes("编辑主页"))!;
    await editButton.trigger("click");
    await flushPromises();

    await wrapper.find(".markdown-editor").setValue("超过十个字符的自定义内容");
    expect(wrapper.text()).toContain("内容过长");
    expect(
      wrapper
        .findAll("button")
        .find((btn) => btn.text().includes("保存"))!
        .attributes("disabled")
    ).toBeDefined();

    // 长度合规时保存失败应把服务端消息透出给用户
    await wrapper.find(".markdown-editor").setValue("短");
    await wrapper
      .findAll("button")
      .find((btn) => btn.text().includes("保存"))!
      .trigger("click");
    await flushPromises();

    expect(mocks.toastError).toHaveBeenCalledWith("主页内容最多 5000 个字符");
  });
});
