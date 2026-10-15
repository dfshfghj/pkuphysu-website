import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { defineComponent, reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommentsView from "@/pages/blog-center/CommentsView.vue";

const mocks = vi.hoisted(() => ({
  routeState: {
    params: {
      id: "1",
    },
  },
  route: null as { params: { id: string } } | null,
  routerBack: vi.fn(),
  routerPush: vi.fn(),
  requestApi: vi.fn(),
  forumStore: {
    getPostById: vi.fn(),
    refreshPost: vi.fn(),
    removePost: vi.fn(),
  },
}));

vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive(mocks.routeState);
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({
      back: mocks.routerBack,
      push: mocks.routerPush,
    }),
  };
});

vi.mock("@/api/api", () => ({
  requestApi: mocks.requestApi,
}));

vi.mock("@/stores/forum", async () => {
  const actual = await vi.importActual<typeof import("@/stores/forum")>("@/stores/forum");
  return {
    ...actual,
    useForumStore: () => mocks.forumStore,
  };
});

const route = reactive(mocks.routeState);
enableAutoUnmount(afterEach);

const BlogPostCardStub = defineComponent({
  name: "BlogPostCard",
  props: {
    post: {
      type: Object,
      required: false,
    },
  },
  emits: ["deleted", "updated"],
  template:
    '<div class="post-card">{{ post?.id }}</div><button class="post-delete-btn" @click="$emit(\'deleted\', post?.id)">delete-post</button>',
});

const BlogCommentCardStub = defineComponent({
  name: "BlogCommentCard",
  props: {
    comment: {
      type: Object,
      required: true,
    },
  },
  emits: ["click", "like-update", "deleted"],
  template:
    '<button class="comment-card" @click="$emit(\'click\')">{{ comment.cid }}</button><button class="like-btn" @click="$emit(\'like-update\', { cid: comment.cid, is_like: 1, likenum: 9 })">like</button><button class="comment-delete-btn" @click="$emit(\'deleted\', comment.cid)">delete</button>',
});

const BlogCommentEditorStub = defineComponent({
  name: "BlogCommentEditor",
  props: {
    quoteName: {
      type: String,
      default: "",
    },
  },
  emits: ["success"],
  template:
    '<div><span class="quote-name">{{ quoteName }}</span><button class="editor-success" @click="$emit(\'success\')">refresh</button></div>',
});

const ElScrollbarStub = defineComponent({
  name: "ElScrollbar",
  emits: ["end-reached"],
  template: "<div><slot /></div>",
});

const ElBacktopStub = defineComponent({
  name: "ElBacktop",
  template: "<div />",
});

describe("CommentsView", () => {
  beforeEach(() => {
    route.params.id = "1";
    mocks.requestApi.mockReset();
    mocks.routerBack.mockReset();
    mocks.routerPush.mockReset();
    mocks.forumStore.getPostById.mockReset();
    mocks.forumStore.refreshPost.mockReset();
    mocks.forumStore.removePost.mockReset();
    mocks.forumStore.getPostById.mockReturnValue({ id: 1 });
  });

  it("keeps comment thread state local across route changes", async () => {
    mocks.requestApi
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ cid: 11, username: "A", quote: null, text: "one", likenum: 0, is_like: 0 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ cid: 12, username: "A", quote: null, text: "one", likenum: 0, is_like: 0 }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ cid: 22, username: "B", quote: null, text: "two", likenum: 0, is_like: 0 }] }),
      });

    const wrapper = mount(CommentsView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          BlogCommentCard: BlogCommentCardStub,
          BlogCommentEditor: BlogCommentEditorStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });

    await flushPromises();
    expect(wrapper.findAll(".comment-card")).toHaveLength(1);
    expect(mocks.forumStore.refreshPost).toHaveBeenCalledWith(1);
    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/comments/1?limit=20&sort=desc");

    await wrapper.find(".sort-toggle").trigger("click");
    await flushPromises();
    expect(mocks.requestApi).toHaveBeenNthCalledWith(2, "/api/v2/forum/comments/1?limit=20&sort=asc");

    route.params.id = "2";
    mocks.forumStore.getPostById.mockReturnValue({ id: 2 });
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenLastCalledWith("/api/v2/forum/comments/2?limit=20&sort=desc");
    expect(wrapper.findAll(".comment-card")).toHaveLength(1);
    expect(wrapper.text()).toContain("22");
    expect(mocks.forumStore.refreshPost).toHaveBeenLastCalledWith(2);
  });

  it("preserves quote flow and local like updates", async () => {
    mocks.requestApi
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ cid: 11, username: "Alice", quote: null, text: "one", likenum: 0, is_like: 0 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              cid: 11,
              username: "Alice",
              quote: { cid: 11, username: "Alice", text: "one" },
              text: "reply",
              likenum: 9,
              is_like: 1,
            },
          ],
        }),
      });

    const wrapper = mount(CommentsView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          BlogCommentCard: BlogCommentCardStub,
          BlogCommentEditor: BlogCommentEditorStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });

    await flushPromises();
    await wrapper.find(".comment-card").trigger("click");
    expect(wrapper.find(".quote-name").text()).toContain("Alice");

    await wrapper.find(".like-btn").trigger("click");
    expect(wrapper.html()).toContain("Alice");

    await wrapper.find(".editor-success").trigger("click");
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenLastCalledWith("/api/v2/forum/comments/1?limit=20&sort=desc");
    expect(mocks.forumStore.refreshPost).toHaveBeenCalledTimes(1);
  });

  it("removes deleted comments locally and navigates away after deleting the post", async () => {
    mocks.requestApi.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { cid: 11, username: "Alice", quote: null, text: "one", likenum: 0, is_like: 0 },
          { cid: 12, username: "Bob", quote: null, text: "two", likenum: 0, is_like: 0 },
        ],
      }),
    });

    const wrapper = mount(CommentsView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          BlogCommentCard: BlogCommentCardStub,
          BlogCommentEditor: BlogCommentEditorStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });

    await flushPromises();
    expect(wrapper.findAll(".comment-card")).toHaveLength(2);

    await wrapper.findAll(".comment-delete-btn")[0].trigger("click");
    expect(wrapper.findAll(".comment-card")).toHaveLength(1);
    expect(wrapper.text()).not.toContain("11");
    expect(mocks.forumStore.refreshPost).toHaveBeenCalledTimes(1);

    await wrapper.find(".post-delete-btn").trigger("click");
    expect(mocks.routerPush).toHaveBeenCalledWith({ name: "PostsView" });
    expect(mocks.forumStore.removePost).toHaveBeenCalledWith(1);
  });

  it("ignores an old thread response after navigating to another post", async () => {
    let resolveOld!: (value: unknown) => void;
    mocks.requestApi
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        })
      )
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ cid: 22, username: "B" }] }) });
    const wrapper = mount(CommentsView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          BlogCommentCard: BlogCommentCardStub,
          BlogCommentEditor: BlogCommentEditorStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });
    route.params.id = "2";
    await flushPromises();
    resolveOld({ ok: true, json: async () => ({ data: [{ cid: 11, username: "A" }] }) });
    await flushPromises();
    expect(wrapper.findAll(".comment-card").map((card) => card.text())).toEqual(["22"]);
  });

  it("ignores stale pagination when the comment sort changes", async () => {
    let resolvePage!: (value: unknown) => void;
    mocks.requestApi
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: Array.from({ length: 20 }, (_, i) => ({ cid: 100 - i, username: "A" })) }),
      })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePage = resolve;
        })
      )
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ cid: 1, username: "B" }] }) });
    const wrapper = mount(CommentsView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          BlogCommentCard: BlogCommentCardStub,
          BlogCommentEditor: BlogCommentEditorStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });
    await flushPromises();
    wrapper.findComponent({ name: "ScrollPane" }).vm.$emit("end-reached");
    await flushPromises();
    expect(mocks.requestApi).toHaveBeenNthCalledWith(2, "/api/v2/forum/comments/1?limit=20&begin=81&sort=desc");
    await wrapper.find(".sort-toggle").trigger("click");
    await flushPromises();
    resolvePage({ ok: true, json: async () => ({ data: [{ cid: 80, username: "A" }] }) });
    await flushPromises();
    expect(wrapper.findAll(".comment-card").map((card) => card.text())).toEqual(["1"]);
  });
});
