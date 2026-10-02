<template>
  <ScrollPane ref="mainScrollbar" :distance="400" back-top @end-reached="loadMorePosts">
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">关注</h2>
      <ListLoading v-if="postsLoading && !posts.length" :rows="4" />
      <EmptyState v-else-if="!posts.length" description="还没有关注的帖子" />
      <template v-else>
        <BlogPostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @card-click="router.push(`/${post.id}`)"
          @updated="refresh(true)"
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
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import { toast } from "vue-sonner";

const router = useRouter();

const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);

const posts = ref([]);
const endOfPosts = ref(false);
const postsLoading = ref(false);

const scrollToTop = () => {
  mainScrollbar.value?.scrollTo({ top: 0 });
};

const fetchFollowPosts = async () => {
  postsLoading.value = true;
  try {
    endOfPosts.value = false;
    const apiUrl = "/api/v2/forum/follow?limit=20";

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 20) {
      endOfPosts.value = true;
    }

    posts.value = data.data;
  } catch (error) {
    console.error("Fetch follow posts failed:", error);
    toast.error("获取关注列表失败");
  } finally {
    postsLoading.value = false;
  }
};

const loadMorePosts = async () => {
  if (!endOfPosts.value && !postsLoading.value && posts.value.length > 0) {
    await loadMoreFollowPosts();
  }
};

const loadMoreFollowPosts = async () => {
  postsLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("limit", "20");
    params.append("begin", posts.value.at(-1).id);

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

const refresh = async (force = false) => {
  if (!force && posts.value.length > 0) {
    return;
  }

  posts.value = [];
  await fetchFollowPosts();
  scrollToTop();
};

onActivated(async () => {
  await refresh();
});

defineExpose({
  refresh,
});
</script>
