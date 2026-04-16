<template>
  <el-scrollbar :distance="400" @end-reached="forumStore.loadMoreComments(pid)">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh">
      <h2 class="flex items-center text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">
        <el-icon :size="20" class="cursor-pointer" @click="router.back()">
          <ArrowLeftBold />
        </el-icon>
        <span>详情</span>
      </h2>
      <BlogPostCard v-if="forumStore.getPostById(pid)" :post="forumStore.getPostById(pid)" />
      <div class="border-b border-(--c-border)"></div>

      <div class="flex pl-6 pt-3">
        <span class="text-lg sm:font-serif font-bold"> 评论 </span>
        <div
          class="flex items-center content-center cursor-pointer text-sm pl-4"
          @click="
            forumStore.toggleCommentSort();
            forumStore.fetchComments(pid);
          "
        >
          <el-icon>
            <Histogram />
          </el-icon>
          <span> {{ forumStore.ascSort ? "顺序" : "逆序" }} </span>
        </div>
      </div>
      <BlogCommentCard
        v-for="comment in forumStore.comments"
        :key="comment.cid"
        :comment="comment"
        @click="toggleQuote(comment.cid, comment.username)"
      />
      <div class="text-center mt-5" v-if="forumStore.comments.length === 0">
        <span class="text-sm"> 暂无更多评论 </span>
      </div>
      <div class="pb-50"></div>
      <BlogCommentEditor
        :post-id="pid"
        :quote="quote"
        :quote-name="quoteName"
        :dark-mode="isDark"
        @success="forumStore.fetchComments(pid)"
      />
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { Histogram, ArrowLeftBold } from "@element-plus/icons-vue";
import { isDark } from "@/composables/theme";
import { useRoute, useRouter } from "vue-router";
import { useForumStore } from "@/stores/forum";
import { computed, onMounted, ref, watch } from "vue";

const route = useRoute();
const router = useRouter();
const forumStore = useForumStore();

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
    forumStore.comments = [];
    await forumStore.fetchComments(newPid);
  }
});

onMounted(async () => {
  if (!forumStore.getPostById(pid.value)) {
    forumStore.fetchPostById(pid.value);
  }
  await forumStore.fetchComments(pid.value);
});

onUnmounted(() => {
  forumStore.comments = [];
});
</script>

<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

:deep(.el-input-tag__wrapper) {
  box-shadow: none !important;
  background-color: transparent !important;
}

.control-search:deep(.el-select__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

.control-search {
  display: flex;
  align-items: center;
  border: 1px solid var(--c-border);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.editor:deep(.vditor-editor) {
  max-height: calc(100vh - 200px);
}

:deep(.vditor) {
  --panel-background-color: var(--card);
  --textarea-background-color: var(--card);
}
</style>
