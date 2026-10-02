import { defineStore } from "pinia";
import { requestApi } from "@/api/api";

interface Post {
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

interface Comment {
  cid: number;
  pid: number;
  text: string;
  userid: number;
  username: string;
  timestamp: number;
  quote: {
    cid: number;
    username: string;
    text: string;
  };
}

export const useTreeholeStore = defineStore("treehole", {
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

    refreshPosts: true,
    refreshFollows: true,
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
      this.postsLoading = true;
      try {
        const params = new URLSearchParams();
        const hashQuery = config.query.find((item) => typeof item === "string" && item.trim().startsWith("#"));
        if (hashQuery) {
          const trimmedHashQuery = hashQuery.trim();
          if (/^#\d+$/.test(trimmedHashQuery)) {
            const postId = trimmedHashQuery.slice(1);
            const res = await requestApi(`/api/dev/posts/${postId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.posts = [data.data];
            this.endOfPosts = true;
            return;
          }
        } else {
          const keywords = config.query
            .filter(
              (item) =>
                typeof item === "string" && item.trim() && !item.trim().startsWith("#") && !item.trim().startsWith(":")
            )
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          if (keywords.length > 0) {
            keywords.forEach((keyword) => {
              params.append("keyword", keyword);
            });
          }

          const tagQueries = config.query
            .filter((item) => typeof item === "string" && item.trim().startsWith(":"))
            .map((item) => item.trim().substring(1))
            .filter((item) => item.length > 0);

          if (tagQueries.length > 0) {
            tagQueries.forEach((tag) => {
              params.append("tag", tag);
            });
          }
        }

        if (config.tag) {
          params.append("tag", config.tag);
        }

        params.append("limit", "20");

        // 总是获取普通帖子，不再依赖 browseType
        const apiUrl = `/api/dev/posts?${params.toString()}`;

        const res = await requestApi(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.data.length < 20) {
          this.endOfPosts = true;
          console.log("End of posts");
        }

        this.posts = data.data;
      } catch {
        console.error("Fetch posts failed:");
      } finally {
        this.postsLoading = false;
      }
    },
    async loadMorePosts() {
      console.log("loadMorePosts", this.endOfPosts);
      if (this.endOfPosts || this.postsLoading || this.posts.length === 0) return;

      this.postsLoading = true;
      try {
        const params = new URLSearchParams();
        params.append("limit", "20");
        params.append("begin", String(this.posts.at(-1)!.id));

        const keywords = this.searchConfig.query
          .filter(
            (item) =>
              typeof item === "string" && item.trim() && !item.trim().startsWith("#") && !item.trim().startsWith(":")
          )
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        const tagQueries = this.searchConfig.query
          .filter((item) => typeof item === "string" && item.trim().startsWith(":"))
          .map((item) => item.trim().substring(1))
          .filter((item) => item.length > 0);

        if (keywords.length > 0) {
          keywords.forEach((keyword) => {
            params.append("keyword", keyword);
          });
        }

        if (tagQueries.length > 0) {
          tagQueries.forEach((tag) => {
            params.append("tag", tag);
          });
        }

        // 总是获取普通帖子，不再依赖 browseType
        const apiUrl = `/api/dev/posts?${params.toString()}`;

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
      this.commentsLoading = true;
      try {
        this.endOfComments = false;
        const res = await requestApi(`/api/dev/comments/${postId}?limit=20&sort=${this.ascSort ? "1" : "0"}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.data.length < 20) {
          this.endOfComments = true;
        }

        this.comments = data.data;
      } catch (err) {
        console.error("Fetch comments failed:", err);
      } finally {
        this.commentsLoading = false;
      }
    },
    async loadMoreComments(postId: number) {
      if (this.endOfComments || this.commentsLoading || this.comments.length === 0) return;

      this.commentsLoading = true;
      try {
        const res = await requestApi(
          `/api/dev/comments/${postId}?limit=20&begin=${this.comments.at(-1).cid}&sort=${this.ascSort ? "1" : "0"}`
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
    async fetchPostById(id: number) {
      const response = await requestApi(`/api/dev/post/${id}`, {
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
