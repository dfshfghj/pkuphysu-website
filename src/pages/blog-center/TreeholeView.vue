<template>
  <el-scrollbar ref="mainScrollbar" :distance="400" @end-reached="loadMorePosts($event)">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh">
      <h2 class="text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">树洞</h2>
      <BlogPostCard
        v-for="post in forumStore.posts"
        :key="post.id"
        :post="post"
        @card-click="router.push(`/${post.id}`)"
      />
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { useForumStore } from "@/stores/forum";
import { requestApi } from "@/api/api";
import { ref } from "vue";

const router = useRouter();
const forumStore = useForumStore();

const mainScrollbar = ref();

const endOfPosts = ref(false);
const postsLoading = ref(false);

const scrollToTop = () => {
  if (mainScrollbar.value) {
    mainScrollbar.value.scrollTo({ top: 0 });
  }
};

const loadMorePosts = async (direction: string) => {
  console.log("loadMorePosts", endOfPosts.value);
  if (direction !="bottom" || endOfPosts.value || postsLoading.value || forumStore.posts.length === 0) return;

  postsLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("limit", "20");
    params.append("begin", String(forumStore.posts.at(-1)!.id));
    const apiUrl = `/api/dev/pku_hole?${params.toString()}`;

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    forumStore.posts = [...forumStore.posts, ...data.data];
    if (data.data.length < 20) {
      endOfPosts.value = true;
    }
  } catch {
    console.error("Fetch posts failed:");
  } finally {
    postsLoading.value = false;
  }
};

const loadNotifications = async () => {
  const res = await requestApi("/api/v2/notifications");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(data);
};

const refresh = async () => {
  if (forumStore.refreshPosts) {
    endOfPosts.value = false;
    forumStore.posts = [];
    forumStore.fetchTreeholePosts();
    scrollToTop();
    forumStore.refreshPosts = false;
  }
};

onMounted(async () => {
    forumStore.fetchTreeholePosts();
    console.log("onActivated");
  console.log(forumStore.refreshPosts);
  refresh();
  loadNotifications();
});

defineExpose({
  refresh,
});
</script>
