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
          @updated="fetchFollowPosts()"
        />
      </template>
    </div>
    <BlogPostEditor v-model:visible="editing" :dark-mode="isDark" @success="fetchFollowPosts()" />
  </ScrollPane>
</template>

<script setup lang="ts">
import { requestApi } from "@/api/api";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import BlogPostEditor from "@/components/blog-center/BlogPostEditor.vue";
import { isDark } from "@/composables/theme";
import { useForumStore } from "@/stores/forum";
import { toast } from "vue-sonner";

const router = useRouter();
const forumStore = useForumStore();

const mainScrollbar = ref<InstanceType<typeof ScrollPane> | null>(null);

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
  mainScrollbar.value?.scrollTo({ top: 0 });
};

const fetchFollowPosts = async (config = { query: [] }) => {
  postsLoading.value = true;
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

const refresh = async () => {
  if (forumStore.refreshFollows) {
    posts.value = [];
    fetchFollowPosts();
    scrollToTop();
    forumStore.refreshFollows = false;
  }
};

onActivated(async () => {
  refresh();
});

defineExpose({
  refresh,
});
</script>
