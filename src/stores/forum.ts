import { defineStore } from "pinia";
import { requestApi } from "@/api/api";
import { buildForumListParams, extractPostIdToken } from "@/utils/forum-search";
import type { SurveySummary } from "@/utils/survey";

export interface PollOption {
  id: number;
  text: string;
  count?: number;
  percent?: number;
  selected?: boolean;
}

export interface Poll {
  id: number;
  multiple: boolean;
  voted: boolean;
  can_see_results: boolean;
  total_votes?: number;
  options: PollOption[];
}

export interface Post {
  id: number;
  text: string;
  userid: number;
  username: string;
  timestamp: number;
  follownum: number;
  is_follow: number;
  likenum: number;
  is_like: number;
  reply: number;
  type: number;
  tags: string[];
  comments?: Comment[];
  poll?: Poll | null;
  survey?: SurveySummary | null;
}

export interface Comment {
  cid: number;
  pid: number;
  text: string;
  userid: number;
  username: string;
  timestamp: number;
  likenum: number;
  is_like: number;
  quote: {
    cid: number;
    username: string;
    text: string;
  };
}

export type FeedKey = "home" | "follow" | "search";
interface FeedConfig {
  query?: string[];
  tag?: string;
}
const newFeed = () => ({
  ids: [] as number[],
  loaded: false,
  end: false,
  loading: false,
  dirty: false,
  error: "",
  request: 0,
  config: "",
  cursor: undefined as number | undefined,
});

export const useForumStore = defineStore("forum", {
  state: () => ({
    postsById: {} as Record<number, Post>,
    feeds: { home: newFeed(), follow: newFeed(), search: newFeed() },
    deletedIds: [] as number[],
    dirtyPostIds: [] as number[],
    pendingLikes: {} as Record<number, boolean>,
    pendingFollows: {} as Record<number, boolean>,
    postRequests: {} as Record<number, number>,
    entityVersions: {} as Record<number, number>,
    revision: 0,
    session: 0,
  }),
  getters: {
    getPostById: (state) => (id: number) => state.postsById[id],
    feedPosts: (state) => (key: FeedKey) =>
      state.feeds[key].ids.map((id) => state.postsById[id]).filter((post): post is Post => !!post),
    posts(): Post[] {
      return this.feedPosts("home");
    },
  },
  actions: {
    resetSession() {
      const session = this.session + 1;
      this.$reset();
      this.session = session;
    },
    upsertPosts(posts: Post[], since = this.revision) {
      for (const post of posts) {
        if (this.deletedIds.includes(post.id) || (this.entityVersions[post.id] ?? 0) > since) continue;
        // Detail responses may omit preview fields; preserve omitted fields, but accept explicit empty arrays.
        const existing = this.postsById[post.id];
        this.postsById[post.id] = {
          ...existing,
          ...post,
          ...(existing && this.pendingLikes[post.id] ? { is_like: existing.is_like, likenum: existing.likenum } : {}),
          ...(existing && this.pendingFollows[post.id]
            ? { is_follow: existing.is_follow, follownum: existing.follownum }
            : {}),
        };
      }
    },
    touchPost(id: number) {
      this.entityVersions[id] = ++this.revision;
    },
    removePost(id: number) {
      if (this.deletedIds.includes(id)) return;
      this.touchPost(id);
      this.deletedIds.push(id);
      delete this.postsById[id];
      this.dirtyPostIds = this.dirtyPostIds.filter((pid) => pid !== id);
      for (const feed of Object.values(this.feeds)) feed.ids = feed.ids.filter((pid) => pid !== id);
    },
    invalidateFeed(key: FeedKey) {
      this.feeds[key].dirty = true;
      // Invalidate any response already in flight, including pagination.
      this.feeds[key].request++;
      this.feeds[key].loading = false;
    },
    async ensureFeed(key: FeedKey, config: FeedConfig = {}) {
      const session = this.session;
      const feed = this.feeds[key];
      if (!feed.loading && (!feed.loaded || feed.dirty)) await this.fetchFeed(key, config);
      if (session !== this.session) return;
      await Promise.all(this.dirtyPostIds.map((id) => this.refreshPost(id)));
    },
    async fetchFeed(key: FeedKey, config: FeedConfig = {}, append = false) {
      const feed = this.feeds[key];
      const signature = JSON.stringify(config);
      if (append && (feed.loading || feed.end || !feed.loaded || feed.config !== signature)) return;
      const request = ++feed.request;
      const session = this.session;
      const revision = this.revision;
      const current = () => this.session === session && feed.request === request;
      if (feed.config !== signature) {
        feed.ids = [];
        feed.loaded = false;
        feed.cursor = undefined;
        feed.config = signature;
      }
      feed.loading = true;
      feed.error = "";
      try {
        const id = key === "search" ? extractPostIdToken(config.query) : null;
        const params = buildForumListParams(config, {
          limit: 20,
          commentLimit: 2,
          begin: append ? feed.cursor : undefined,
        });
        const url =
          id !== null
            ? `/api/v2/forum/posts/${id}?comment_limit=2`
            : `/api/v2/forum/${key === "follow" ? "follow" : "posts"}?${params}`;
        const res = await requestApi(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!current()) return;
        const posts: Post[] = id !== null ? [data.data] : data.data;
        this.upsertPosts(posts, revision);
        const ids = posts.filter((post) => !this.deletedIds.includes(post.id)).map((post) => post.id);
        feed.ids = [...new Set(append ? [...feed.ids, ...ids] : ids)];
        feed.cursor = posts.at(-1)?.id ?? feed.cursor;
        feed.end = id !== null || posts.length < 20;
        feed.loaded = true;
        feed.dirty = false;
      } catch (error) {
        if (current()) {
          feed.error = "加载失败，请重试";
          console.error("Fetch feed failed:", error);
        }
      } finally {
        if (current()) feed.loading = false;
      }
    },
    async refreshPost(id: number) {
      if (this.deletedIds.includes(id)) return;
      if (!this.dirtyPostIds.includes(id)) this.dirtyPostIds.push(id);
      const request = (this.postRequests[id] ?? 0) + 1;
      this.postRequests[id] = request;
      const session = this.session;
      const revision = this.revision;
      try {
        const res = await requestApi(`/api/v2/forum/posts/${id}?comment_limit=2`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (this.session !== session || this.postRequests[id] !== request || this.deletedIds.includes(id)) return;
        if ((this.entityVersions[id] ?? 0) > revision) return;
        this.upsertPosts([data.data], revision);
        this.touchPost(id);
        this.dirtyPostIds = this.dirtyPostIds.filter((pid) => pid !== id);
        return this.postsById[id];
      } catch (error) {
        console.error("Refresh post failed:", error);
      }
    },
    async postEdited(id: number) {
      this.touchPost(id);
      this.invalidateFeed("search");
      await this.refreshPost(id);
    },
    updateCommentLike(cid: number, isLike: number, likeNum: number) {
      for (const post of Object.values(this.postsById)) {
        const comment = post.comments?.find((comment) => comment.cid === cid);
        if (comment) {
          comment.is_like = isLike;
          comment.likenum = likeNum;
          this.touchPost(post.id);
        }
      }
    },
    updatePostPoll(id: number, poll: Poll | null) {
      if (this.postsById[id]) {
        this.postsById[id].poll = poll;
        this.touchPost(id);
      }
    },
    async togglePostLike(id: number) {
      if (this.pendingLikes[id] || !this.postsById[id]) return;
      const post = this.postsById[id];
      const previous = { is_like: post.is_like, likenum: post.likenum };
      const session = this.session;
      this.pendingLikes[id] = true;
      Object.assign(post, {
        is_like: Number(!post.is_like),
        likenum: Math.max(0, post.likenum + (post.is_like ? -1 : 1)),
      });
      this.touchPost(id);
      try {
        const res = await requestApi(`/api/v2/forum/like/${id}`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (error) {
        if (this.session === session && this.postsById[id]) Object.assign(this.postsById[id], previous);
        throw error;
      } finally {
        if (this.session === session) {
          this.touchPost(id);
          delete this.pendingLikes[id];
        }
      }
    },
    async togglePostFollow(id: number) {
      if (this.pendingFollows[id] || !this.postsById[id]) return;
      const post = this.postsById[id];
      const previous = { is_follow: post.is_follow, follownum: post.follownum };
      const session = this.session;
      this.pendingFollows[id] = true;
      Object.assign(post, {
        is_follow: Number(!post.is_follow),
        follownum: Math.max(0, post.follownum + (post.is_follow ? -1 : 1)),
      });
      this.touchPost(id);
      try {
        const res = await requestApi(`/api/v2/forum/follow/${id}`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (this.session !== session || !this.postsById[id]) return;
        this.invalidateFeed("follow");
        if (!this.postsById[id].is_follow) this.feeds.follow.ids = this.feeds.follow.ids.filter((pid) => pid !== id);
      } catch (error) {
        if (this.session === session && this.postsById[id]) Object.assign(this.postsById[id], previous);
        throw error;
      } finally {
        if (this.session === session) {
          this.touchPost(id);
          delete this.pendingFollows[id];
        }
      }
    },
  },
});
