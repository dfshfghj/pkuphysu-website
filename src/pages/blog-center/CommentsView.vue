<template>
  <ScrollPane :distance="400" back-top @end-reached="loadMoreComments">
    <div class="min-h-lvh">
      <h2 class="hidden sm:flex items-center text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">
        <ChevronLeft :stroke-width="3" class="size-5 cursor-pointer" @click="router.back()" />
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
        <div class="sort-toggle flex items-center content-center cursor-pointer text-sm pl-4" @click="toggleSort()">
          <ChartColumn class="size-4" />
          <span> {{ ascSort ? "顺序" : "逆序" }} </span>
        </div>
      </div>
      <ListLoading v-if="commentsLoading && !comments.length" />
      <EmptyState v-else-if="!comments.length" description="还没有评论" />
      <template v-else>
        <BlogCommentCard
          v-for="comment in comments"
          :key="comment.cid"
          :comment="comment"
          @like-update="handleLikeUpdate"
          @deleted="handleCommentDeleted"
          @click="toggleQuote(comment.cid, comment.username)"
        />
      </template>
      <ListLoading v-if="commentsLoading && comments.length" />
      <div class="pb-50"></div>
      <BlogCommentEditor
        :post-id="pid"
        :quote="quote"
        :quote-name="quoteName"
        :dark-mode="isDark"
        @success="fetchComments(pid)"
      />
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import { isDark } from "@/composables/theme";
import { requestApi } from "@/api/api";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useRoute, useRouter } from "vue-router";
import { type Comment, useForumStore } from "@/stores/forum";
import { ChartColumn, ChevronLeft } from "lucide-vue-next";

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
  commentsLoading.value = true;
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
  } finally {
    commentsLoading.value = false;
  }
};

const loadMoreComments = async () => {
  if (endOfComments.value || commentsLoading.value || comments.value.length === 0) {
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
