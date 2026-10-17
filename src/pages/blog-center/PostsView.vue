<template>
  <ScrollPane ref="mainScrollbar" :distance="400" back-top :refresh="() => refresh(true)" @end-reached="loadMorePosts">
    <div class="min-h-lvh bg-card">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">主页</h2>
      <ListLoading v-if="feed.loading && !posts.length" />
      <EmptyState v-else-if="!posts.length && !feed.error" description="还没有帖子" />
      <template v-else>
        <BlogPostCard v-for="post in posts" :key="post.id" :post="post" @card-click="router.push(`/${post.id}`)" />
      </template>
      <button v-if="feed.error" class="p-6 text-destructive" @click="refresh(true)">{{ feed.error }}</button>
      <ListLoading v-if="feed.loading && posts.length" />
    </div>
  </ScrollPane>
</template>
<script setup lang="ts">
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useForumFeed } from "@/composables/forum-feed";
import { useNotificationStore } from "@/stores/notification";
const router = useRouter();
const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);
const { feed, posts, refresh, loadMorePosts } = useForumFeed(
  "home",
  () => ({}),
  () => mainScrollbar.value?.scrollTo({ top: 0 })
);
onActivated(() => {
  useNotificationStore().fetchUnreadCount();
});
defineExpose({ refresh });
</script>
