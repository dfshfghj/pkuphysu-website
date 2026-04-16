<template>
  <el-scrollbar ref="mainScrollbar" class="h-screen! flex-1" :distance="400" @end-reached="loadMorePosts">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh">
      <h2 class="text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">搜索结果</h2>
      <TreeholePostCard v-for="post in posts" :key="post.id" :post="post" @card-click="router.push(`/treehole/${post.id}`)" />
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { requestApi } from "../../api/api";
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useTreeholeStore } from "../../stores/treehole";
import { useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const treeholeStore = useTreeholeStore();

// 独立的状态管理
const posts = ref([]);
const endOfPosts = ref(false);
const postsLoading = ref(false);
const searchQuery = ref([]);

// 从路由参数获取搜索查询（用于初始化 searchQuery）
const getSearchFromRoute = () => {
  const result = [];

  // 添加关键词
  const keywords = route.query.keyword || [];
  if (typeof keywords === "string") {
    result.push(keywords);
  } else if (Array.isArray(keywords)) {
    result.push(...keywords);
  }

  // 添加标签
  const tags = route.query.tag || [];
  if (typeof tags === "string") {
    result.push(`:${tags}`);
  } else if (Array.isArray(tags)) {
    result.push(...tags.map((tag) => `:${tag}`));
  }

  // 如果有单独的 id 查询
  if (route.query.id) {
    result.push(`#${route.query.id}`);
  }

  return result;
};

const fetchPosts = async () => {
  try {
    const queryString = window.location.search;

    if (!queryString) {
      router.push("/");
      return;
    }

    const params = new URLSearchParams(queryString);
    if (params.id) {
      const res = await requestApi(`/api/dev/posts/${params.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      posts.value = [data.data];
      endOfPosts.value = true;
      return;
    }

    params.append("limit", "20");

    const apiUrl = `/api/dev/posts?${params.toString()}`;

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

const loadMorePosts = async (direction: string) => {
  if (direction === "bottom" && !endOfPosts.value && !postsLoading.value) {
    try {
      const queryString = window.location.search;

      if (!queryString) {
        router.push("/");
        return;
      }

      const params = new URLSearchParams(queryString);
      if (params.id) {
        const res = await requestApi(`/api/dev/posts/${params.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        posts.value = [...posts.value, ...data.data];
        endOfPosts.value = true;
        return;
      }

      params.append("limit", "20");
      params.append("begin", posts.value.at(-1).id);

      const apiUrl = `/api/dev/posts?${params.toString()}`;

      const res = await requestApi(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.data.length < 20) {
        endOfPosts.value = true;
      }

      posts.value = [...posts.value, ...data.data];
    } catch (error) {
      console.error("Fetch posts failed:", error);
      ElMessage.error("获取帖子列表失败");
    }
  }
};

// 执行搜索
const performSearch = () => {
  fetchPosts();
};

// 监听路由变化
watch(
  () => route.query,
  (newQuery) => {
    const searchTerms = getSearchFromRoute();
    searchQuery.value = searchTerms;
    if (searchTerms.length > 0) {
      performSearch();
    } else {
      router.push({ path: "/" }); // 当搜索参数为空时，跳转到首页
      posts.value = []; // 清空已有帖子
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  treeholeStore.posts = [];
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
