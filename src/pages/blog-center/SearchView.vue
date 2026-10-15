<template>
  <ScrollPane ref="mainScrollbar" :distance="400" back-top @end-reached="loadMorePosts">
    <div class="min-h-lvh bg-card">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">搜索结果</h2>
      <div v-if="posts.length" class="flex items-center justify-between gap-2 px-6 pt-2">
        <span class="text-sm text-muted-foreground"> 共 {{ posts.length }}{{ feed.end ? "" : "+" }} 条结果 </span>
        <Button variant="ghost" size="sm" @click="clearSearch">
          <X class="size-4" />
          清除筛选
        </Button>
      </div>
      <ListLoading v-if="feed.loading && !posts.length" />
      <EmptyState v-else-if="!posts.length && !feed.error" description="没有找到相关帖子" />
      <template v-else>
        <BlogPostCard v-for="post in posts" :key="post.id" :post="post" @card-click="router.push(`/${post.id}`)" />
      </template>
      <button v-if="feed.error" class="p-6 text-destructive" @click="refresh(true)">{{ feed.error }}</button>
      <ListLoading v-if="feed.loading && posts.length" />
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import { getSearchTokensFromRouteQuery } from "@/utils/forum-search";
import { useForumFeed } from "@/composables/forum-feed";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import Button from "@/components/ui/button/Button.vue";
import { X } from "lucide-vue-next";
const router = useRouter();
const route = useRoute();
const clearSearch = () => router.push("/");
const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);
const config = () => ({ query: getSearchTokensFromRouteQuery(route.query) });
const { feed, posts, refresh, loadMorePosts } = useForumFeed("search", config, () =>
  mainScrollbar.value?.scrollTo({ top: 0 })
);
watch(
  () => route.query,
  () => {
    if (!config().query.length) {
      router.push("/");
      return;
    }
    refresh(true);
  },
  { immediate: true }
);
</script>
