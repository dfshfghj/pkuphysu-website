<template>
  <el-scrollbar ref="mainScrollbar" :distance="400" @end-reached="loadMorePosts">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">关注</h2>
      <BlogPostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @card-click="router.push(`/${post.id}`)"
        @updated="fetchFollowPosts()"
      />
    </div>
  </el-scrollbar>
  <BlogPostEditor v-model:visible="editing" :dark-mode="isDark" @success="fetchFollowPosts()" />
</template>

<script setup lang="ts">
import { requestApi } from "@/api/api";
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import BlogPostEditor from "@/components/blog-center/BlogPostEditor.vue";
import { isDark } from "@/composables/theme";
import { useForumStore } from "@/stores/forum";

const router = useRouter();
const forumStore = useForumStore();

const mainScrollbar = ref();

// 独立的状态管理
const posts = ref([]);
const endOfPosts = ref(false);
const postsLoading = ref(false);
const searchConfig = reactive({
  mode: "page",
  count: 1,
  query: [],
});

const editing = ref(false);

const scrollToTop = () => {
  if (mainScrollbar.value) {
    mainScrollbar.value.scrollTo({ top: 0 });
  }
};

const fetchFollowPosts = async (config = { query: [] }) => {
  try {
    const params = new URLSearchParams();
    const hashQuery = config.query.find((item) => typeof item === "string" && item.trim().startsWith("#"));

    if (hashQuery) {
      const trimmedHashQuery = hashQuery.trim();
      if (/^#\d+$/.test(trimmedHashQuery)) {
        const postId = trimmedHashQuery.slice(1);
        const res = await requestApi(`/api/v2/forum/posts/${postId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        posts.value = [data.data];
        endOfPosts.value = true;
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

    params.append("limit", "20");
    const apiUrl = `/api/v2/forum/follow?${params.toString()}`;

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 20) {
      endOfPosts.value = true;
    }

    posts.value = data.data;
  } catch (error) {
    console.error("Fetch follow posts failed:", error);
    ElMessage.error("获取关注列表失败");
  }
};

// 加载更多关注的帖子
const loadMorePosts = async (direction: string) => {
  if (direction === "bottom" && !endOfPosts.value && !postsLoading.value && posts.value.length > 0) {
    await loadMoreFollowPosts();
  }
};

const loadMoreFollowPosts = async () => {
  postsLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("limit", "20");
    params.append("begin", posts.value.at(-1).id);

    const keywords = searchConfig.query
      .filter(
        (item) =>
          typeof item === "string" && item.trim() && !item.trim().startsWith("#") && !item.trim().startsWith(":")
      )
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const tagQueries = searchConfig.query
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

    const apiUrl = `/api/v2/forum/follow?${params.toString()}`;

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    posts.value = [...posts.value, ...data.data];
    if (data.data.length < 20) {
      endOfPosts.value = true;
    }
  } catch (error) {
    console.error("Load more follow posts failed:", error);
  } finally {
    postsLoading.value = false;
  }
};

// 获取普通帖子
const fetchPosts = async (config = { query: [] }) => {
  try {
    const params = new URLSearchParams();
    const hashQuery = config.query.find((item) => typeof item === "string" && item.trim().startsWith("#"));

    if (hashQuery) {
      const trimmedHashQuery = hashQuery.trim();
      if (/^#\d+$/.test(trimmedHashQuery)) {
        const postId = trimmedHashQuery.slice(1);
        const res = await requestApi(`/api/v2/forum/posts/${postId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        posts.value = [data.data];
        endOfPosts.value = true;
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

    params.append("limit", "20");
    const apiUrl = `/api/v2/forum/posts?${params.toString()}`;

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 20) {
      endOfPosts.value = true;
    }

    posts.value = data.data;
  } catch (error) {
    console.error("Fetch posts failed:", error);
    ElMessage.error("获取帖子列表失败");
  }
};

const refresh = async () => {
  if (forumStore.refreshFollows) {
    posts.value = [];
    fetchFollowPosts();
    scrollToTop();
    forumStore.refreshFollows = false;
  }
};

onActivated(async () => {
  console.log(forumStore.refreshPosts);
  refresh();
});

defineExpose({
  refresh,
});
</script>

<style scoped>
.control-bar {
  line-height: 2em;
  padding-top: 10px;
  display: flex;
  align-items: center;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.control-btn-label {
  margin-left: 0.25rem;
  font-size: 20px;
  vertical-align: 0.05em;
}

:deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

:deep(.el-input-tag__wrapper) {
  box-shadow: none !important;
  background-color: transparent !important;
}

.control-search:deep(.el-select__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

.control-search {
  display: flex;
  align-items: center;
  border: 1px solid var(--c-border);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
}

:deep(.el-tabs) {
  max-height: 100%;
}

.end-flag {
  text-align: center;
  font-size: 18px;
  padding-top: 10px;
  padding-bottom: 20px;
}

.trans {
  background-color: color-mix(in srgb, var(--card), transparent 10%);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.editor:deep(.vditor-editor) {
  max-height: calc(100vh - 200px);
}

.card {
  padding: 0px;
  border-radius: 5px;
}

.tag {
  font-size: 14px;
  background: var(--gray-2);
  padding: 2px 12px;
  margin: 0 12px 8px 0;
  border: 1px solid var(--gray-2);
  border-radius: 9999px;
}

.comment-card {
  margin: 5px;
  max-width: none;
}

.card-header {
  font-size: 14px;
  padding: 15px 0 10px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--c-border);
}

.bg-img {
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.dark .bg-img {
  background: url("/images/bg.webp") center center / cover rgb(255, 255, 255);
}

:deep(.vditor) {
  --panel-background-color: var(--card);
  --textarea-background-color: var(--card);
}

@media (max-width: 1036px) {
  .card {
    margin: 5px;
  }

  .control-btn-label {
    display: none;
  }
}
</style>
