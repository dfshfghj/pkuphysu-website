<template>
  <el-scrollbar ref="mainScrollbar" :distance="400" @end-reached="loadMorePosts">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">主页</h2>
      <BlogPostCard
        v-for="post in forumStore.posts"
        :key="post.id"
        :post="post"
        @card-click="router.push(`/${post.id}`)"
        @deleted="handlePostDeleted"
        @updated="forumStore.fetchPostById($event)"
      />
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { requestApi } from "@/api/api";
import { useForumStore } from "@/stores/forum";
import { ref } from "vue";

const router = useRouter();
const forumStore = useForumStore();

const mainScrollbar = ref();

const scrollToTop = () => {
  if (mainScrollbar.value) {
    mainScrollbar.value.scrollTo({ top: 0 });
  }
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
