<template>
  <el-scrollbar :distance="400" @end-reached="loadMoreComments">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh">
      <h2 class="hidden sm:flex items-center text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">
        <el-icon :size="20" class="cursor-pointer" @click="router.back()">
          <ArrowLeftBold />
        </el-icon>
        <span>详情</span>
      </h2>
      <BlogPostCard
        v-if="forumStore.getPostById(pid)"
        :post="forumStore.getPostById(pid)"
        @deleted="handlePostDeleted"
        @updated="forumStore.fetchPostById(pid)"
      />
      <div class="border-b border-(--c-border)"></div>

      <div class="flex pl-6 pt-3">
        <span class="text-lg sm:font-serif font-bold"> 评论 </span>
        <div
          class="sort-toggle flex items-center content-center cursor-pointer text-sm pl-4"
          @click="
            toggleSort();
          "
        >
          <el-icon>
            <Histogram />
          </el-icon>
          <span> {{ ascSort ? "顺序" : "逆序" }} </span>
        </div>
      </div>
      <BlogCommentCard
        v-for="comment in comments"
        :key="comment.cid"
        :comment="comment"
        @like-update="handleLikeUpdate"
        @deleted="handleCommentDeleted"
        @click="toggleQuote(comment.cid, comment.username)"
      />
      <div class="text-center mt-5" v-if="comments.length === 0">
        <span class="text-sm"> 暂无更多评论 </span>
      </div>
      <div class="pb-50"></div>
      <BlogCommentEditor
        :post-id="pid"
        :quote="quote"
        :quote-name="quoteName"
        :dark-mode="isDark"
        @success="fetchComments(pid)"
      />
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { Histogram, ArrowLeftBold } from "@element-plus/icons-vue";
import { isDark } from "@/composables/theme";
import { requestApi } from "@/api/api";
import { useRoute, useRouter } from "vue-router";
import { type Comment, useForumStore } from "@/stores/forum";
import { computed, onMounted, ref, watch } from "vue";

const route = useRoute();
const router = useRouter();
const forumStore = useForumStore();

const pid = computed(() => Number(route.params.id));
const comments = ref<Comment[]>([]);
const endOfComments = ref(false);
const commentsLoading = ref(false);
const ascSort = ref(false);
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

const fetchComments = async (postId: number) => {
  try {
    endOfComments.value = false;
    const res = await requestApi(`/api/v2/forum/comments/${postId}?limit=20&sort=${ascSort.value ? "asc" : "desc"}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    comments.value = data.data;
    if (data.data.length < 20) {
      endOfComments.value = true;
    }
  } catch (error) {
    console.error("Fetch comments failed:", error);
  }
};

const loadMoreComments = async (direction?: string) => {
  if ((direction && direction !== "bottom") || endOfComments.value || commentsLoading.value || comments.value.length === 0) {
    return;
  }

  commentsLoading.value = true;
  try {
    const res = await requestApi(
      `/api/v2/forum/comments/${pid.value}?limit=20&begin=${comments.value.at(-1)!.cid}&sort=${ascSort.value ? "asc" : "desc"}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    comments.value = [...comments.value, ...data.data];
    if (data.data.length < 20) {
      endOfComments.value = true;
    }
  } catch (error) {
    console.error("Load more comments failed:", error);
  } finally {
    commentsLoading.value = false;
  }
};

const toggleSort = async () => {
  ascSort.value = !ascSort.value;
  await fetchComments(pid.value);
};

const handleLikeUpdate = (updatedComment: Pick<Comment, "cid" | "is_like" | "likenum">) => {
  const index = comments.value.findIndex((comment) => comment.cid === updatedComment.cid);
  if (index !== -1) {
    comments.value[index].is_like = updatedComment.is_like;
    comments.value[index].likenum = updatedComment.likenum;
  }
};

const handleCommentDeleted = (commentId: number) => {
  comments.value = comments.value.filter((comment) => comment.cid !== commentId);
};

const handlePostDeleted = async () => {
  await router.push({ name: "PostsView" });
};

watch(pid, async (newPid, oldPid) => {
  if (newPid !== oldPid) {
    comments.value = [];
    ascSort.value = false;
    quote.value = 0;
    quoteName.value = "";
    await fetchComments(newPid);
  }
});

onMounted(async () => {
  if (!forumStore.getPostById(pid.value)) {
    await forumStore.fetchPostById(pid.value);
  }
  await fetchComments(pid.value);
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
