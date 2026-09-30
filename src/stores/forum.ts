import { defineStore } from "pinia";
import { requestApi } from "@/api/api";
import { buildForumListParams, extractPostIdToken } from "@/utils/forum-search";

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

export const useForumStore = defineStore("forum", {
  state: () => ({
    posts: [] as Post[],
    endOfPosts: false,
    postsLoading: false,

    comments: [] as Comment[],
    endOfComments: false,
    commentsLoading: false,
    ascSort: false,

    searchConfig: {
      mode: "page",
      count: 1,
      query: [] as string[],
    },
  }),

  getters: {
    getPostById: (state) => (id: number) => {
      return state.posts.find((post) => post.id == id);
    },
  },

  actions: {
    async fetchPost(id: number) {
      try {
        const res = await requestApi(`/api/v2/forum/posts/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.posts = [data.data];
        this.endOfPosts = true;
      } catch {
        console.error("Fetch post failed:");
      }
    },
    async fetchPosts(config = { tag: "", query: [] }) {
      try {
        this.endOfPosts = false;
        const postId = extractPostIdToken(config.query);
        if (postId !== null) {
          const res = await requestApi(`/api/v2/forum/posts/${postId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          this.posts = [data.data];
          this.endOfPosts = true;
          return;
        }

        const params = buildForumListParams(config, { limit: 20, commentLimit: 2 });
        const apiUrl = `/api/v2/forum/posts?${params.toString()}`;

        const res = await requestApi(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.data.length < 20) {
          this.endOfPosts = true;
        }

        this.posts = data.data;
      } catch {
        console.error("Fetch posts failed:");
      }
    },
    async loadMorePosts(config = { tag: "", query: [] }) {
      if (this.endOfPosts || this.postsLoading || this.posts.length === 0) return;

      this.postsLoading = true;
      try {
        const params = buildForumListParams(config, {
          limit: 20,
          begin: this.posts.at(-1)!.id,
          commentLimit: 2,
        });
        const apiUrl = `/api/v2/forum/posts?${params.toString()}`;

        const res = await requestApi(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        this.posts = [...this.posts, ...data.data];
        if (data.data.length < 20) {
          this.endOfPosts = true;
        }
      } catch {
        console.error("Fetch posts failed:");
      } finally {
        this.postsLoading = false;
      }
    },
    // Comments相关actions
    async fetchComments(postId: number) {
      try {
        this.endOfComments = false;
        const res = await requestApi(`/api/v2/forum/comments/${postId}?limit=20&sort=${this.ascSort ? "asc" : "desc"}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.data.length < 20) {
          this.endOfComments = true;
        }

        this.comments = data.data;
      } catch (err) {
        console.error("Fetch comments failed:", err);
      }
    },
    async loadMoreComments(postId: number) {
      if (this.endOfComments || this.commentsLoading || this.comments.length === 0) return;

      this.commentsLoading = true;
      try {
        const res = await requestApi(
          `/api/v2/forum/comments/${postId}?limit=20&begin=${this.comments.at(-1).cid}&sort=${this.ascSort ? "asc" : "desc"}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        this.comments = [...this.comments, ...data.data];
        if (data.data.length < 20) {
          this.endOfComments = true;
        }
      } catch {
        console.error("Fetch comments failed:");
      } finally {
        this.commentsLoading = false;
      }
    },
    // 其他辅助actions
    toggleCommentSort() {
      this.ascSort = !this.ascSort;
    },
    updateSearchConfig(query: string[]) {
      this.searchConfig.query = query;
    },
    resetSearchConfig() {
      this.searchConfig.query = [];
    },
    // 处理评论点赞更新
    updateCommentLike(cid: number, isLike: number, likeNum: number) {
      const index = this.comments.findIndex((comment) => comment.cid === cid);
      if (index !== -1) {
        this.comments[index].is_like = isLike;
        this.comments[index].likenum = likeNum;
      }
    },
    // 处理帖子点赞/关注更新（如果需要）
    updatePostLike(postId: number, isLike: number, likeNum: number) {
      const index = this.posts.findIndex((post) => post.id === postId);
      if (index !== -1) {
        this.posts[index].is_like = isLike;
        this.posts[index].likenum = likeNum;
      }
    },
    async fetchPostById(id: number) {
      const response = await requestApi(`/api/v2/forum/posts/${id}`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        const existingIndex = this.posts.findIndex((p) => p.id === data.data.id);
        if (existingIndex !== -1) {
          this.posts[existingIndex] = data.data;
        } else {
          this.posts.push(data.data);
        }
        return data.data;
      } else {
        throw new Error(`获取文章失败: ${response.status}`);
      }
    },
  },
});
