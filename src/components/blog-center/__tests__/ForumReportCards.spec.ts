import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BlogCommentCard from "@/components/blog-center/BlogCommentCard.vue";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import { requestApi } from "@/api/api";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock("@/stores/forum", async () => {
  const actual = await vi.importActual<typeof import("@/stores/forum")>("@/stores/forum");
  return {
    ...actual,
    useForumStore: () => ({
      updatePostLike: vi.fn(),
      updateCommentLike: vi.fn(),
    }),
  };
});

const mockUserStore = {
  role: 0,
};

vi.mock("@/stores/user", () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock("@/api/api", () => ({
  requestApi: vi.fn(),
}));

vi.mock("vue-sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const ForumReportDialogStub = defineComponent({
  name: "ForumReportDialog",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    targetId: {
      type: Number,
      required: true,
    },
    endpoint: {
      type: String,
      default: "",
    },
  },
  template:
    '<div class="report-dialog" :data-open="modelValue" :data-target-id="targetId" :data-endpoint="endpoint" />',
});

const AdminDeleteDialogStub = defineComponent({
  name: "AdminDeleteDialog",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    endpoint: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    successMessage: {
      type: String,
      required: true,
    },
  },
  template:
    '<div class="delete-dialog" :data-open="modelValue" :data-endpoint="endpoint" :data-title="title" :data-description="description" />',
});

const CollapsibleDivStub = defineComponent({
  name: "CollapsibleDiv",
  template: "<div><slot /></div>",
});

const MarkdownRendererStub = defineComponent({
  name: "MarkdownRenderer",
  template: "<div />",
});

const UserAvatarStub = defineComponent({
  name: "UserAvatar",
  template: "<div />",
});

const HoverCardStub = defineComponent({
  name: "HoverCard",
  props: { open: { type: Boolean, default: false } },
  emits: ["update:open"],
  template: '<div class="hover-card" :data-open="open"><slot /></div>',
});

const HoverCardTriggerStub = defineComponent({
  name: "HoverCardTrigger",
  template: "<div><slot /></div>",
});

const HoverCardContentStub = defineComponent({
  name: "HoverCardContent",
  template: '<div class="hover-card-content"><slot /></div>',
});

const ElButtonStub = defineComponent({
  name: "ElButton",
  emits: ["click"],
  template: '<button type="button" class="el-button" @click="$emit(\'click\', $event)"><slot /></button>',
});

const ElIconStub = defineComponent({
  name: "ElIcon",
  template: "<span><slot /></span>",
});

const IconStub = defineComponent({
  name: "IconStub",
  template: "<span />",
});

const DropdownMenuStub = defineComponent({
  name: "DropdownMenu",
  template: "<div><slot /></div>",
});

const DropdownMenuTriggerStub = defineComponent({
  name: "DropdownMenuTrigger",
  template: "<div><slot /></div>",
});

const DropdownMenuContentStub = defineComponent({
  name: "DropdownMenuContent",
  template: "<div><slot /></div>",
});

const DropdownMenuItemStub = defineComponent({
  name: "DropdownMenuItem",
  emits: ["click"],
  template: '<button type="button" class="dropdown-menu-item" @click="$emit(\'click\', $event)"><slot /></button>',
});

const dropdownStubs = {
  DropdownMenu: DropdownMenuStub,
  DropdownMenuTrigger: DropdownMenuTriggerStub,
  DropdownMenuContent: DropdownMenuContentStub,
  DropdownMenuItem: DropdownMenuItemStub,
};

describe("forum report buttons", () => {
  it("opens the post report dialog with post id", async () => {
    mockUserStore.role = 0;
    const wrapper = mount(BlogPostCard, {
      props: {
        post: {
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
        },
      },
      global: {
        stubs: {
          CollapsibleDiv: CollapsibleDivStub,
          MarkdownRenderer: MarkdownRendererStub,
          UserAvatar: UserAvatarStub,
          HoverCard: HoverCardStub,
          HoverCardTrigger: HoverCardTriggerStub,
          HoverCardContent: HoverCardContentStub,
          ForumReportDialog: ForumReportDialogStub,
          AdminDeleteDialog: AdminDeleteDialogStub,
          "el-button": ElButtonStub,
          "el-icon": ElIconStub,
          IconRiHeartFill: IconStub,
          IconRiHeartLine: IconStub,
          CopyDocument: IconStub,
          Star: IconStub,
          StarFilled: IconStub,
          ChatLineRound: IconStub,
          ...dropdownStubs,
        },
      },
    });

    const reportButton = wrapper.findAll("button").find((node) => node.text() === "举报");
    expect(reportButton).toBeTruthy();
    expect(wrapper.find(".report-dialog").attributes("data-open")).toBe("false");
    expect(wrapper.find(".report-dialog").attributes("data-target-id")).toBe("7");
    expect(wrapper.find(".report-dialog").attributes("data-endpoint")).toBe("");

    await reportButton!.trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".report-dialog").attributes("data-open")).toBe("true");
  });

  it("opens the comment report dialog with comment id", async () => {
    mockUserStore.role = 0;
    const wrapper = mount(BlogCommentCard, {
      props: {
        comment: {
          cid: 12,
          pid: 7,
          text: "comment",
          userid: 2,
          username: "Bob",
          timestamp: 1,
          likenum: 0,
          is_like: 0,
          quote: null,
        },
      },
      global: {
        stubs: {
          CollapsibleDiv: CollapsibleDivStub,
          MarkdownRenderer: MarkdownRendererStub,
          UserAvatar: UserAvatarStub,
          ForumReportDialog: ForumReportDialogStub,
          AdminDeleteDialog: AdminDeleteDialogStub,
          "el-button": ElButtonStub,
          "el-icon": ElIconStub,
          IconRiHeartFill: IconStub,
          IconRiHeartLine: IconStub,
          CopyDocument: IconStub,
          ...dropdownStubs,
        },
      },
    });

    const reportButton = wrapper.findAll("button").find((node) => node.text() === "举报");
    expect(reportButton).toBeTruthy();
    expect(wrapper.find(".report-dialog").attributes("data-open")).toBe("false");
    expect(wrapper.find(".report-dialog").attributes("data-target-id")).toBe("12");
    expect(wrapper.find(".report-dialog").attributes("data-endpoint")).toBe("/api/v2/forum/comments/12/report");

    await reportButton!.trigger("click");
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".report-dialog").attributes("data-open")).toBe("true");
  });

  it("shows admin delete buttons only for admins", () => {
    mockUserStore.role = 2;
    const postWrapper = mount(BlogPostCard, {
      props: {
        post: {
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
        },
      },
      global: {
        stubs: {
          CollapsibleDiv: CollapsibleDivStub,
          MarkdownRenderer: MarkdownRendererStub,
          UserAvatar: UserAvatarStub,
          HoverCard: HoverCardStub,
          HoverCardTrigger: HoverCardTriggerStub,
          HoverCardContent: HoverCardContentStub,
          ForumReportDialog: ForumReportDialogStub,
          AdminDeleteDialog: AdminDeleteDialogStub,
          "el-button": ElButtonStub,
          "el-icon": ElIconStub,
          IconRiHeartFill: IconStub,
          IconRiHeartLine: IconStub,
          CopyDocument: IconStub,
          Star: IconStub,
          StarFilled: IconStub,
          ChatLineRound: IconStub,
          ...dropdownStubs,
        },
      },
    });

    const commentWrapper = mount(BlogCommentCard, {
      props: {
        comment: {
          cid: 12,
          pid: 7,
          text: "comment",
          userid: 2,
          username: "Bob",
          timestamp: 1,
          likenum: 0,
          is_like: 0,
          quote: null,
        },
      },
      global: {
        stubs: {
          CollapsibleDiv: CollapsibleDivStub,
          MarkdownRenderer: MarkdownRendererStub,
          UserAvatar: UserAvatarStub,
          ForumReportDialog: ForumReportDialogStub,
          AdminDeleteDialog: AdminDeleteDialogStub,
          "el-button": ElButtonStub,
          "el-icon": ElIconStub,
          IconRiHeartFill: IconStub,
          IconRiHeartLine: IconStub,
          CopyDocument: IconStub,
          ...dropdownStubs,
        },
      },
    });

    expect(postWrapper.findAll("button").some((node) => node.text() === "删除")).toBe(true);
    expect(commentWrapper.findAll("button").some((node) => node.text() === "删除")).toBe(true);
    expect(postWrapper.find(".delete-dialog").attributes("data-endpoint")).toBe("/api/v2/admin/forum/posts/7");
    expect(commentWrapper.find(".delete-dialog").attributes("data-endpoint")).toBe("/api/v2/admin/forum/comments/12");
  });
});

const authorPostProps = {
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

const authorStubs = {
  CollapsibleDiv: CollapsibleDivStub,
  MarkdownRenderer: MarkdownRendererStub,
  UserAvatar: UserAvatarStub,
  HoverCard: HoverCardStub,
  HoverCardTrigger: HoverCardTriggerStub,
  HoverCardContent: HoverCardContentStub,
  ForumReportDialog: ForumReportDialogStub,
  AdminDeleteDialog: AdminDeleteDialogStub,
  "el-button": ElButtonStub,
  "el-icon": ElIconStub,
  IconRiHeartFill: IconStub,
  IconRiHeartLine: IconStub,
  Star: IconStub,
  StarFilled: IconStub,
  ChatLineRound: IconStub,
  ...dropdownStubs,
};

describe("post card author hover card", () => {
  beforeEach(() => {
    mockUserStore.role = 0;
    mocks.routerPush.mockReset();
    vi.mocked(requestApi).mockReset();
  });

  it("loads the author stats on hover and enters the profile by clicking the name", async () => {
    vi.mocked(requestApi).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { post_count: 9, comment_count: 19, likes_received: 5 } }),
    } as unknown as Response);

    const wrapper = mount(BlogPostCard, {
      props: { post: authorPostProps },
      global: { stubs: authorStubs },
    });

    // 未悬浮时不请求，统计位显示占位符
    expect(vi.mocked(requestApi)).not.toHaveBeenCalled();
    expect(wrapper.find(".hover-card").attributes("data-open")).toBe("false");
    expect(wrapper.find(".hover-card-content").text()).toContain("-");

    const hoverCard = wrapper.findComponent({ name: "HoverCard" });
    hoverCard.vm.$emit("update:open", true);
    await flushPromises();

    expect(vi.mocked(requestApi)).toHaveBeenCalledWith("/api/v2/users/1/stats");
    const content = wrapper.find(".hover-card-content").text();
    expect(content).toContain("帖子");
    expect(content).toContain("评论");
    expect(content).toContain("获赞");
    expect(content).toContain("9");
    expect(content).toContain("19");
    expect(content).toContain("5");

    // 结果已缓存，重复悬浮不再请求
    hoverCard.vm.$emit("update:open", false);
    hoverCard.vm.$emit("update:open", true);
    await flushPromises();
    expect(vi.mocked(requestApi)).toHaveBeenCalledTimes(1);

    await wrapper.find(".hover-card-content span").trigger("click");
    await flushPromises();

    // 跳转前浮层必须被同步摘掉：否则参考元素随列表消失后，浮层会被重新定位到左上角
    expect(wrapper.find(".hover-card-content").exists()).toBe(false);
    // open 也要归位，否则 keep-alive 回到列表后浮层会"自带打开"或再也打不开
    expect(wrapper.find(".hover-card").attributes("data-open")).toBe("false");
    expect(mocks.routerPush).toHaveBeenCalledWith({ name: "UserProfile", params: { id: 1 } });

    // 列表被 keep-alive 缓存，重新悬浮时应恢复浮层，且统计命中缓存不再请求
    hoverCard.vm.$emit("update:open", true);
    await flushPromises();
    expect(wrapper.find(".hover-card").attributes("data-open")).toBe("true");
    expect(wrapper.find(".hover-card-content").exists()).toBe(true);
    expect(vi.mocked(requestApi)).toHaveBeenCalledTimes(1);
  });
});
