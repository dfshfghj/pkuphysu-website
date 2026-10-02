<template>
  <ScrollPane ref="mainScrollbar" :distance="400" back-top @end-reached="loadMorePosts">
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">主页</h2>
      <ListLoading v-if="forumStore.postsLoading && !forumStore.posts.length" :rows="4" />
      <EmptyState v-else-if="!forumStore.posts.length" description="还没有帖子" />
      <template v-else>
        <BlogPostCard
          v-for="post in forumStore.posts"
          :key="post.id"
          :post="post"
          @card-click="router.push(`/${post.id}`)"
          @deleted="handlePostDeleted"
          @updated="forumStore.fetchPostById($event)"
        />
      </template>
    </div>
  </ScrollPane>
</template>
<script setup lang="ts">
import { requestApi } from "@/api/api";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useForumStore } from "@/stores/forum";

const router = useRouter();
const forumStore = useForumStore();

const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);

const scrollToTop = () => {
  mainScrollbar.value?.scrollTo({ top: 0 });
};

const loadMorePosts = async () => {
  await forumStore.loadMorePosts();
};

const loadNotifications = async () => {
  const res = await requestApi("/api/v2/notifications");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await res.json();
};

const handlePostDeleted = (postId: number) => {
  forumStore.posts = forumStore.posts.filter((post) => post.id !== postId);
};

const refresh = async (force = false) => {
  if (!force && forumStore.posts.length > 0) {
    return;
  }

  forumStore.endOfPosts = false;
  forumStore.posts = [];
  await forumStore.fetchPosts();
  scrollToTop();
};

onActivated(async () => {
  await refresh();
  loadNotifications();
});

defineExpose({
  refresh,
});
</script>
