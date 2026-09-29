import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it, vi } from "vitest";
import BlogCommentCard from "@/components/blog-center/BlogCommentCard.vue";

vi.mock("@/stores/forum", async () => {
  const actual = await vi.importActual<typeof import("@/stores/forum")>("@/stores/forum");
  return {
    ...actual,
    useForumStore: () => ({
      updateCommentLike: vi.fn(),
    }),
  };
});

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ role: 0 }),
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

const CollapsibleDivStub = defineComponent({
  name: "CollapsibleDiv",
  template: "<div><slot /></div>",
});

const MarkdownRendererStub = defineComponent({
  name: "MarkdownRenderer",
  props: { content: { type: String, default: "" } },
  template: '<div class="markdown">{{ content }}</div>',
});

const UserAvatarStub = defineComponent({
  name: "UserAvatar",
  props: { userid: { type: Number, default: 0 } },
  template: "<div />",
});

const DialogStub = defineComponent({
  name: "Dialog",
  template: "<div />",
});

const IconStub = defineComponent({
  name: "Icon",
  template: "<i />",
});

const comment = {
  cid: 12,
  pid: 7,
  text: "comment",
  userid: 2,
  username: "Bob",
  timestamp: 1,
  likenum: 0,
  is_like: 0,
  quote: null,
};

const mountCard = () =>
  mount(BlogCommentCard, {
    props: { comment },
    global: {
      stubs: {
        CollapsibleDiv: CollapsibleDivStub,
        MarkdownRenderer: MarkdownRendererStub,
        UserAvatar: UserAvatarStub,
        ForumReportDialog: DialogStub,
        AdminDeleteDialog: DialogStub,
        "el-button": IconStub,
        "el-icon": IconStub,
        IconRiHeartFill: IconStub,
        IconRiHeartLine: IconStub,
        CopyDocument: IconStub,
      },
    },
  });

describe("BlogCommentCard", () => {
  it("clicks on the card emit click so the parent can toggle the quote target", async () => {
    const wrapper = mountCard();

    await wrapper.find(".comment-card").trigger("click");

    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});
