import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h, KeepAlive, ref, type Component } from "vue";
import { beforeEach, expect, it, vi } from "vitest";
import PostsView from "@/pages/blog-center/PostsView.vue";
import FollowView from "@/pages/blog-center/FollowView.vue";
import { useForumStore, type Post } from "@/stores/forum";

const { requestApi } = vi.hoisted(() => ({ requestApi: vi.fn() }));
vi.mock("@/api/api", () => ({ requestApi }));
vi.mock("@/stores/notification", () => ({ useNotificationStore: () => ({ fetchUnreadCount: vi.fn() }) }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const response = (data: unknown) => ({ ok: true, json: async () => ({ data }) });
const post = (id: number, fields = {}) => ({ id, text: `post-${id}`, reply: 0, ...fields }) as Post;
const mountHome = (component: Component = PostsView) => {
  const visible = ref(true);
  const wrapper = mount(
    defineComponent({
      render: () => h(KeepAlive, null, { default: () => (visible.value ? h(component) : h("div", "detail")) }),
    }),
    {
      global: {
        stubs: {
          ScrollPane: { template: "<div><slot /></div>", methods: { scrollTo: vi.fn() } },
          BlogPostCard: {
            props: ["post"],
            template: "<article>{{ post.id }}:{{ post.text }}:{{ post.reply }}</article>",
          },
          ListLoading: true,
          EmptyState: true,
        },
      },
    }
  );
  return { wrapper, visible };
};
beforeEach(() => {
  setActivePinia(createPinia());
  requestApi.mockReset();
});

it("loads the actual homepage after a direct detail visit", async () => {
  const store = useForumStore();
  requestApi.mockResolvedValueOnce(response(post(42))).mockResolvedValueOnce(response([post(100), post(99)]));
  await store.refreshPost(42);
  const { wrapper } = mountHome();
  await flushPromises();
  expect(wrapper.findAll("article")).toHaveLength(2);
  expect(store.posts.map((p) => p.id)).toEqual([100, 99]);
  expect(requestApi).toHaveBeenCalledTimes(2);
  wrapper.unmount();
});

it("keeps loaded pages when returning after an edit or comment update", async () => {
  const store = useForumStore();
  requestApi
    .mockResolvedValueOnce(response(Array.from({ length: 20 }, (_, i) => post(100 - i))))
    .mockResolvedValueOnce(response([post(80)]));
  const { wrapper, visible } = mountHome();
  await flushPromises();
  await store.fetchFeed("home", {}, true);
  visible.value = false;
  await flushPromises();
  requestApi.mockResolvedValueOnce(response(post(80, { text: "edited", reply: 2 })));
  await store.refreshPost(80);
  visible.value = true;
  await flushPromises();
  expect(wrapper.findAll("article")).toHaveLength(21);
  expect(wrapper.text()).toContain("80:edited:2");
  expect(requestApi).toHaveBeenCalledTimes(3);
  wrapper.unmount();
});

it("does not reload a successfully loaded empty homepage on every activation", async () => {
  requestApi.mockResolvedValue(response([]));
  const { wrapper, visible } = mountHome();
  await flushPromises();
  visible.value = false;
  await flushPromises();
  visible.value = true;
  await flushPromises();
  expect(requestApi).toHaveBeenCalledTimes(1);
  wrapper.unmount();
});

it("leaves loaded posts visible when a refresh fails", async () => {
  requestApi.mockResolvedValueOnce(response([post(1)])).mockResolvedValueOnce({ ...response(null), ok: false });
  const { wrapper } = mountHome();
  await flushPromises();
  await useForumStore().fetchFeed("home");
  await flushPromises();
  expect(wrapper.findAll("article")).toHaveLength(1);
  expect(wrapper.text()).toContain("加载失败，请重试");
  wrapper.unmount();
});

it("revalidates an empty cached follow page after following elsewhere", async () => {
  const store = useForumStore();
  store.upsertPosts([post(7, { is_follow: 0, follownum: 0 })]);
  requestApi
    .mockResolvedValueOnce(response([]))
    .mockResolvedValueOnce(response(null))
    .mockResolvedValueOnce(response([post(7, { is_follow: 1, follownum: 1 })]));
  const { wrapper, visible } = mountHome(FollowView);
  await flushPromises();
  visible.value = false;
  await flushPromises();
  await store.togglePostFollow(7);
  await flushPromises();
  expect(requestApi).toHaveBeenCalledTimes(2);
  visible.value = true;
  await flushPromises();
  expect(wrapper.findAll("article")).toHaveLength(1);
  expect(store.feeds.follow.dirty).toBe(false);
  expect(requestApi).toHaveBeenCalledTimes(3);
  wrapper.unmount();
});

it("revalidates an active follow page after unfollowing", async () => {
  const store = useForumStore();
  requestApi
    .mockResolvedValueOnce(response([post(7, { is_follow: 1, follownum: 1 })]))
    .mockResolvedValueOnce(response(null))
    .mockResolvedValueOnce(response([]));
  const { wrapper } = mountHome(FollowView);
  await flushPromises();
  await store.togglePostFollow(7);
  await flushPromises();
  expect(wrapper.findAll("article")).toHaveLength(0);
  expect(store.getPostById(7)?.is_follow).toBe(0);
  expect(store.feeds.follow.dirty).toBe(false);
  expect(requestApi).toHaveBeenCalledTimes(3);
  wrapper.unmount();
});
