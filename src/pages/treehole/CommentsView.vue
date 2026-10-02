<template>
  <ScrollPane :distance="400" back-top @end-reached="treeholeStore.loadMoreComments(pid)">
    <div class="min-h-lvh">
      <h2 class="hidden sm:flex items-center text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">
        <ChevronLeft :stroke-width="3" class="size-5 cursor-pointer" @click="router.back()" />
        <span>详情</span>
      </h2>
      <TreeholePostCard v-if="treeholeStore.getPostById(pid)" :post="treeholeStore.getPostById(pid)" />
      <div class="border-b border-(--c-border)"></div>

      <div class="flex pl-6 pt-3">
        <span class="text-lg sm:font-serif font-bold"> 评论 </span>
        <div
          class="flex items-center content-center cursor-pointer text-sm pl-4"
          @click="
            treeholeStore.toggleCommentSort();
            treeholeStore.fetchComments(pid);
          "
        >
          <ChartColumn class="size-4" />
          <span> {{ treeholeStore.ascSort ? "顺序" : "逆序" }} </span>
        </div>
      </div>
      <ListLoading v-if="treeholeStore.commentsLoading && !treeholeStore.comments.length" />
      <EmptyState v-else-if="!treeholeStore.comments.length" description="还没有评论" />
      <template v-else>
        <TreeholeCommentCard
          v-for="comment in treeholeStore.comments"
          :key="comment.cid"
          :comment="comment"
          @click="toggleQuote(comment.cid, comment.username)"
        />
      </template>
      <ListLoading v-if="treeholeStore.commentsLoading && treeholeStore.comments.length" />
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useRoute, useRouter } from "vue-router";
import { useTreeholeStore } from "@/stores/treehole";
import { ChartColumn, ChevronLeft } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const treeholeStore = useTreeholeStore();

const pid = computed(() => Number(route.params.id));
const quote = ref(0);
const quoteName = ref("");

const toggleQuote = (id: number, name: string) => {
  if (quote.value !== id) {
    quote.value = id;
    quoteName.value = name;
  } else {
    quote.value = 0;
    quoteName.value = "";
  }
};

watch(pid, async (newPid, oldPid) => {
  if (newPid !== oldPid) {
    treeholeStore.comments = [];
    await treeholeStore.fetchComments(newPid);
  }
});

onMounted(async () => {
  if (!treeholeStore.getPostById(pid.value)) {
    treeholeStore.fetchPostById(pid.value);
  }
  await treeholeStore.fetchComments(pid.value);
});

onUnmounted(() => {
  treeholeStore.comments = [];
});
</script>
