<template>
  <ScrollPane ref="mainScrollbar" :distance="400" back-top @end-reached="loadMorePosts">
    <div class="min-h-lvh bg-card">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">搜索结果</h2>
      <div v-if="posts.length" class="flex items-center justify-between gap-2 px-6 pt-2">
        <span class="text-sm text-muted-foreground"> 共 {{ posts.length }}{{ endOfPosts ? "" : "+" }} 条结果 </span>
        <Button variant="ghost" size="sm" @click="clearSearch">
          <X class="size-4" />
          清除筛选
        </Button>
      </div>
      <ListLoading v-if="postsLoading && !posts.length" />
      <EmptyState v-else-if="!posts.length" description="没有找到相关帖子" />
      <template v-else>
        <BlogPostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @card-click="router.push(`/${post.id}`)"
          @updated="fetchPosts()"
        />
      </template>
      <ListLoading v-if="postsLoading && posts.length" />
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import { requestApi } from "../../api/api";
import { buildForumListParams, extractPostIdToken, getSearchTokensFromRouteQuery } from "@/utils/forum-search";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import BlogPostCard from "../../components/blog-center/BlogPostCard.vue";
import Button from "@/components/ui/button/Button.vue";
import { X } from "lucide-vue-next";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

const router = useRouter();
const route = useRoute();

const clearSearch = () => {
  router.push("/");
};

const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);
const posts = ref([]);
const endOfPosts = ref(false);
const postsLoading = ref(false);

const fetchPosts = async () => {
  postsLoading.value = true;
  try {
    const tokens = getSearchTokensFromRouteQuery(route.query);
    if (tokens.length === 0) {
      router.push("/");
      return;
    }

    endOfPosts.value = false;
    const postId = extractPostIdToken(tokens);
    if (postId !== null) {
      const res = await requestApi(`/api/v2/forum/posts/${postId}?comment_limit=2`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      posts.value = [data.data];
      endOfPosts.value = true;
      return;
    }

    const params = buildForumListParams({ query: tokens }, { limit: 20, commentLimit: 2 });
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
    toast.error("获取帖子列表失败");
  } finally {
    postsLoading.value = false;
  }
};

const loadMorePosts = async () => {
  if (!endOfPosts.value && !postsLoading.value) {
    postsLoading.value = true;
    try {
      const tokens = getSearchTokensFromRouteQuery(route.query);
      if (tokens.length === 0) {
        router.push("/");
        return;
      }

      if (extractPostIdToken(tokens) !== null) {
        endOfPosts.value = true;
        return;
      }

      const params = buildForumListParams({ query: tokens }, { limit: 20, commentLimit: 2, begin: posts.value.at(-1).id });
      const apiUrl = `/api/v2/forum/posts?${params.toString()}`;

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

watch(
  () => route.query,
  async () => {
    const searchTerms = getSearchTokensFromRouteQuery(route.query);
    if (searchTerms.length > 0) {
      await fetchPosts();
    } else {
      router.push({ path: "/" });
      posts.value = [];
    }
  },
  { immediate: true }
);
</script>
