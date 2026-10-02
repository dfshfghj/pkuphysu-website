<template>
  <ScrollPane ref="mainScrollbar" class="h-screen! flex-1" :distance="400" back-top @end-reached="loadMorePosts">
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">搜索结果</h2>
      <ListLoading v-if="postsLoading && !posts.length" />
      <EmptyState v-else-if="!posts.length" description="没有找到相关帖子" />
      <template v-else>
        <TreeholePostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @card-click="router.push(`/treehole/${post.id}`)"
        />
      </template>
      <ListLoading v-if="postsLoading && posts.length" />
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import { requestApi } from "../../api/api";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useTreeholeStore } from "../../stores/treehole";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();
const treeholeStore = useTreeholeStore();

const posts = ref([]);
const endOfPosts = ref(false);
const postsLoading = ref(false);
const searchQuery = ref([]);

const getSearchFromRoute = () => {
  const result = [];

  const keywords = route.query.keyword || [];
  if (typeof keywords === "string") {
    result.push(keywords);
  } else if (Array.isArray(keywords)) {
    result.push(...keywords);
  }

  const tags = route.query.tag || [];
  if (typeof tags === "string") {
    result.push(`:${tags}`);
  } else if (Array.isArray(tags)) {
    result.push(...tags.map((tag) => `:${tag}`));
  }

  if (route.query.id) {
    result.push(`#${route.query.id}`);
  }

  return result;
};

const fetchPosts = async () => {
  postsLoading.value = true;
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
    toast.error("获取帖子列表失败");
  } finally {
    postsLoading.value = false;
  }
};

const loadMorePosts = async () => {
  if (!endOfPosts.value && !postsLoading.value) {
    postsLoading.value = true;
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
      toast.error("获取帖子列表失败");
    } finally {
      postsLoading.value = false;
    }
  }
};

const performSearch = () => {
  fetchPosts();
};

watch(
  () => route.query,
  () => {
    const searchTerms = getSearchFromRoute();
    searchQuery.value = searchTerms;
    if (searchTerms.length > 0) {
      performSearch();
    } else {
      router.push({ path: "/" });
      posts.value = [];
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  treeholeStore.posts = [];
});
</script>
