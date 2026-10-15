import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useForumStore, type Post } from "@/stores/forum";

const { requestApi } = vi.hoisted(() => ({ requestApi: vi.fn() }));
vi.mock("@/api/api", () => ({ requestApi }));
const post = (id: number, fields = {}) =>
  ({ id, text: `post ${id}`, is_like: 0, likenum: 0, is_follow: 0, follownum: 0, ...fields }) as Post;
const response = (data: unknown) => ({ ok: true, json: async () => ({ data }) });
const deferred = () => {
  let resolve!: (value: ReturnType<typeof response>) => void;
  const promise = new Promise<ReturnType<typeof response>>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe("forum data ownership", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    requestApi.mockReset();
  });

  it("keeps detail entities out of homepage membership and loads even an empty feed only once", async () => {
    const store = useForumStore();
    requestApi.mockResolvedValueOnce(response(post(42))).mockResolvedValueOnce(response([]));
    await store.refreshPost(42);
    expect(store.getPostById(42)?.id).toBe(42);
    expect(store.posts).toEqual([]);
    await store.ensureFeed("home");
    await store.ensureFeed("home");
    expect(requestApi).toHaveBeenCalledTimes(2);
    expect(store.feeds.home.loaded).toBe(true);
  });

  it("updates one shared entity without changing feed order or loaded pages", async () => {
    const store = useForumStore();
    store.upsertPosts([post(10), post(9)]);
    store.feeds.home.ids = [10, 9];
    store.feeds.follow.ids = [9];
    requestApi.mockResolvedValueOnce(response(post(9, { text: "edited", reply: 3, comments: [] })));
    await store.refreshPost(9);
    expect(store.posts.map((p) => p.id)).toEqual([10, 9]);
    expect(store.feedPosts("follow")[0]).toBe(store.posts[1]);
    expect(store.posts[1].text).toBe("edited");
    expect(store.posts[1].reply).toBe(3);
  });

  it("serializes toggles across cards and rolls back failed requests", async () => {
    const store = useForumStore();
    store.upsertPosts([post(1)]);
    const pending = deferred();
    requestApi.mockReturnValueOnce(pending.promise);
    const first = store.togglePostLike(1);
    await store.togglePostLike(1);
    expect(requestApi).toHaveBeenCalledTimes(1);
    expect(store.getPostById(1)?.likenum).toBe(1);
    pending.resolve({ ...response(null), ok: false });
    await expect(first).rejects.toThrow();
    expect(store.getPostById(1)?.is_like).toBe(0);
    expect(store.getPostById(1)?.likenum).toBe(0);
  });

  it("invalidates follow membership and removes cancelled follows immediately", async () => {
    const store = useForumStore();
    store.upsertPosts([post(1, { is_follow: 1, follownum: 1 })]);
    store.feeds.follow.ids = [1];
    requestApi.mockResolvedValue(response(null));
    await store.togglePostFollow(1);
    expect(store.getPostById(1)?.is_follow).toBe(0);
    expect(store.feedPosts("follow")).toEqual([]);
    expect(store.feeds.follow.dirty).toBe(true);
  });

  it("prevents deleted posts and old requests from reappearing", async () => {
    const store = useForumStore();
    const pending = deferred();
    requestApi.mockReturnValueOnce(pending.promise);
    const fetching = store.fetchFeed("home");
    store.removePost(1);
    pending.resolve(response([post(1), post(2)]));
    await fetching;
    expect(store.posts.map((p) => p.id)).toEqual([2]);
    expect(store.getPostById(1)).toBeUndefined();
  });

  it("does not let an old list response overwrite a more recent like", async () => {
    const store = useForumStore();
    store.upsertPosts([post(1)]);
    const pending = deferred();
    requestApi.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(response(null));
    const fetching = store.fetchFeed("home");
    await store.togglePostLike(1);
    pending.resolve(response([post(1)]));
    await fetching;
    expect(store.posts[0].likenum).toBe(1);
  });

  it("ignores superseded search responses and deduplicates overlapping pages", async () => {
    const store = useForumStore();
    const pending = deferred();
    requestApi
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(response(Array.from({ length: 20 }, (_, i) => post(30 - i))));
    const old = store.fetchFeed("search", { query: ["old"] });
    await store.fetchFeed("search", { query: ["new"] });
    pending.resolve(response([post(1)]));
    await old;
    requestApi.mockResolvedValueOnce(response([post(11), post(10)]));
    await store.fetchFeed("search", { query: ["new"] }, true);
    expect(store.feedPosts("search")).toHaveLength(21);
    expect(store.feedPosts("search")[0].id).toBe(30);
  });

  it("clears user-specific caches and ignores responses from the previous session", async () => {
    const store = useForumStore();
    const pending = deferred();
    requestApi.mockReturnValueOnce(pending.promise);
    const fetching = store.fetchFeed("home");
    store.resetSession();
    pending.resolve(response([post(1)]));
    await fetching;
    expect(store.posts).toEqual([]);
    expect(store.feeds.home.loaded).toBe(false);
  });

  it("preserves optimistic fields when a GET starts during pending toggles", async () => {
    const store = useForumStore();
    store.upsertPosts([post(1)]);
    const like = deferred();
    const follow = deferred();
    requestApi
      .mockReturnValueOnce(like.promise)
      .mockReturnValueOnce(follow.promise)
      .mockResolvedValueOnce(response([post(1, { text: "new content" })]));
    const liking = store.togglePostLike(1);
    const following = store.togglePostFollow(1);
    await store.fetchFeed("home");
    expect(store.posts[0]).toMatchObject({ is_like: 1, likenum: 1, is_follow: 1, follownum: 1, text: "new content" });
    like.resolve(response(null));
    follow.resolve(response(null));
    await Promise.all([liking, following]);
    expect(store.posts[0]).toMatchObject({ is_like: 1, is_follow: 1 });
  });

  it("retains populated feeds on failure and retries a failed entity refresh on return", async () => {
    const store = useForumStore();
    requestApi.mockResolvedValueOnce(response([post(1, { reply: 1 })]));
    await store.fetchFeed("home");
    requestApi.mockResolvedValueOnce({ ...response(null), ok: false });
    await store.fetchFeed("home");
    expect(store.posts).toHaveLength(1);
    expect(store.feeds.home.error).toBeTruthy();
    requestApi.mockResolvedValueOnce({ ...response(null), ok: false });
    await store.refreshPost(1);
    expect(store.dirtyPostIds).toContain(1);
    requestApi.mockResolvedValueOnce(response(post(1, { reply: 2, comments: [] })));
    await store.ensureFeed("home");
    expect(store.posts[0].reply).toBe(2);
    expect(store.dirtyPostIds).not.toContain(1);
  });
});
