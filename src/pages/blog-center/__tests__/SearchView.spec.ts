import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, reactive } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchView from "@/pages/blog-center/SearchView.vue";

const mocks = vi.hoisted(() => ({
  routeState: {
    query: {} as Record<string, unknown>,
  },
  route: null as { query: Record<string, unknown> } | null,
  routerPush: vi.fn(),
  requestApi: vi.fn(),
}));

vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive(mocks.routeState);
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({
      push: mocks.routerPush,
    }),
  };
});

vi.mock("@/api/api", () => ({
  requestApi: mocks.requestApi,
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({
    token: null,
  }),
}));

const route = reactive(mocks.routeState);

describe("SearchView", () => {
  beforeEach(() => {
    route.query = {};
    mocks.requestApi.mockReset();
    mocks.routerPush.mockReset();
  });

  it("appends search results when loading more", async () => {
    route.query = { keyword: "physics" };
    const initialPosts = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }));
    mocks.requestApi
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: initialPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 21 }] }),
      });

    const wrapper = mount(SearchView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });

    await flushPromises();
    await wrapper.vm.loadMorePosts("bottom");
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenNthCalledWith(1, "/api/v2/forum/posts?keyword=physics&limit=20");
    expect(mocks.requestApi).toHaveBeenNthCalledWith(2, "/api/v2/forum/posts?keyword=physics&limit=20&begin=20");
    expect(wrapper.findAll(".post-card")).toHaveLength(21);
  });

  it("fetches a single post when search uses an id token", async () => {
    route.query = { id: "42" };
    mocks.requestApi.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 42 } }),
    });

    const wrapper = mount(SearchView, {
      global: {
        stubs: {
          BlogPostCard: BlogPostCardStub,
          ElScrollbar: ElScrollbarStub,
          ElBacktop: ElBacktopStub,
        },
      },
    });

    await flushPromises();

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/posts/42");
    expect(wrapper.findAll(".post-card")).toHaveLength(1);
  });
});
const BlogPostCardStub = defineComponent({
  name: "BlogPostCard",
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  template: '<div class="post-card">{{ post.id }}</div>',
});

const ElScrollbarStub = defineComponent({
  name: "ElScrollbar",
  emits: ["end-reached"],
  template: '<div><slot /></div>',
});

const ElBacktopStub = defineComponent({
  name: "ElBacktop",
  template: "<div />",
});
