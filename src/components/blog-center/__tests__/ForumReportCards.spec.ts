import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";
import BlogCommentCard from "@/components/blog-center/BlogCommentCard.vue";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";

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
  template: "<div><slot /></div>",
});

const HoverCardTriggerStub = defineComponent({
  name: "HoverCardTrigger",
  template: "<div><slot /></div>",
});

const HoverCardContentStub = defineComponent({
  name: "HoverCardContent",
  template: "<div><slot /></div>",
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
