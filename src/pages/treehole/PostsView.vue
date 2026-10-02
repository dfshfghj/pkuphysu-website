<template>
  <ScrollPane ref="mainScrollbar" :distance="400" back-top @end-reached="loadMorePosts">
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">主页</h2>
      <ListLoading v-if="treeholeStore.postsLoading && !treeholeStore.posts.length" :rows="4" />
      <EmptyState v-else-if="!treeholeStore.posts.length" description="还没有帖子" />
      <template v-else>
        <TreeholePostCard
          v-for="post in treeholeStore.posts"
          :key="post.id"
          :post="post"
          @card-click="router.push(`/treehole/${post.id}`)"
        />
      </template>
    </div>
  </ScrollPane>
</template>
<script setup lang="ts">
import { useTreeholeStore } from "@/stores/treehole";
import { requestApi } from "@/api/api";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";

const router = useRouter();
const treeholeStore = useTreeholeStore();

const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);

const endOfPosts = ref(false);
const loadMoreLoading = ref(false);

const scrollToTop = () => {
  mainScrollbar.value?.scrollTo({ top: 0 });
};

const loadMorePosts = async () => {
  if (endOfPosts.value || loadMoreLoading.value || treeholeStore.posts.length === 0) return;

  loadMoreLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("limit", "20");
    params.append("begin", String(treeholeStore.posts.at(-1)!.id));
    const apiUrl = `/api/dev/posts?${params.toString()}`;

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    treeholeStore.posts = [...treeholeStore.posts, ...data.data];
    if (data.data.length < 20) {
      endOfPosts.value = true;
    }
  } catch {
    console.error("Fetch posts failed:");
  } finally {
    loadMoreLoading.value = false;
  }
};

const loadNotifications = async () => {
  const res = await requestApi("/api/v2/notifications");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(data);
};

const refresh = async () => {
  if (treeholeStore.refreshPosts) {
    endOfPosts.value = false;
    treeholeStore.posts = [];
    treeholeStore.fetchPosts();
    scrollToTop();
    treeholeStore.refreshPosts = false;
  }
};

onActivated(async () => {
  console.log(treeholeStore.refreshPosts);
  refresh();
  loadNotifications();
});

defineExpose({
  refresh,
});
</script>
