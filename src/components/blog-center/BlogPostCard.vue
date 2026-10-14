<template>
  <div
    class="group post-card bg-card flex cursor-pointer items-start gap-2 px-5 py-4 border-b-2 border-background md:pr-12.5 md:pl-6"
    :key="post.id"
    @click="handleClick"
  >
    <div class="hidden shrink-0 sm:flex">
      <HoverCard :open="hoverCardOpen" @update:open="handleHoverOpen">
        <HoverCardTrigger class="flex">
          <UserAvatar :userid="post.userid" :size="40" @click.stop="goProfile" />
        </HoverCardTrigger>
        <HoverCardContent v-if="!hoverCardDismissed" class="w-60">
          <div class="flex items-center gap-3">
            <UserAvatar :userid="post.userid" :size="50" @click.stop="goProfile" />
            <span class="min-w-0 flex-1 cursor-pointer truncate font-bold hover:underline" @click.stop="goProfile">
              {{ post.username }}
            </span>
          </div>
          <div class="mt-3 flex items-center border-t border-(--border) pt-2 text-center">
            <div class="flex flex-1 flex-col">
              <span class="font-bold">{{ hoverStats?.post_count ?? "-" }}</span>
              <span class="text-xs text-muted-foreground">帖子</span>
            </div>
            <div class="flex flex-1 flex-col">
              <span class="font-bold">{{ hoverStats?.comment_count ?? "-" }}</span>
              <span class="text-xs text-muted-foreground">评论</span>
            </div>
            <div class="flex flex-1 flex-col">
              <span class="font-bold">{{ hoverStats?.likes_received ?? "-" }}</span>
              <span class="text-xs text-muted-foreground">获赞</span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="unselectable flex items-center gap-2 text-sm">
        <div class="shrink-0 sm:hidden">
          <UserAvatar :userid="post.userid" :size="28" @click.stop="goProfile" />
        </div>
        <span class="min-w-0 cursor-pointer truncate font-bold hover:underline" @click.stop="goProfile">{{ post.username }}</span>
        <code class="shrink-0">#{{ post.id }}</code>
        <span class="ml-auto shrink-0 text-xs text-muted-foreground">
          {{ timeInfo.relativeTime }}
          <span class="hidden sm:inline">{{ timeInfo.formattedTime }}</span>
        </span>
      </div>
      <div v-if="post.tags?.length" class="mt-2 mr-1">
        <span class="text-sm bg-muted px-3 py-1 mr-3 mb-2 rounded-full" v-for="tag in post.tags" :key="tag">
          {{ tag }}
        </span>
      </div>

      <CollapsibleDiv :max-height="500">
        <ForumContent :content="post.text" />
      </CollapsibleDiv>

      <PostPoll v-if="poll" :post-id="post.id" :poll="poll" @voted="handlePollVoted" />

      <PostSurvey v-if="survey" :survey="survey" />

      <div class="mt-1 flex items-center text-xs text-muted-foreground">
        <span v-if="post.edit_count">已编辑 {{ post.edit_count }} 次</span>
        <div class="ml-auto flex items-center gap-4">
          <div v-if="post.reply" class="flex cursor-pointer items-center gap-1" @click.stop="">
            {{ post.reply }}
            <MessageSquare class="size-3" />
          </div>
          <div class="flex cursor-pointer items-center gap-1" @click.stop="handleLike">
            {{ likeNum }}
            <IconRiHeartFill v-if="isLiked" class="size-3" />
            <IconRiHeartLine v-else class="size-3" />
          </div>
          <div class="flex cursor-pointer items-center gap-1" @click.stop="handleFollow">
            {{ followNum }}
            <Star class="size-3 fill-current" v-if="isFollowed" />
            <Star v-else class="size-3" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Ellipsis class="size-4 scale-125 fill-current cursor-pointer" @click.stop />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleCopy">复制</DropdownMenuItem>
              <DropdownMenuItem v-if="post.edit_count" @click="historyVisible = true">历史版本</DropdownMenuItem>
              <DropdownMenuItem v-if="isOwn" @click="handleEdit">编辑</DropdownMenuItem>
              <DropdownMenuItem @click="reportVisible = true">举报</DropdownMenuItem>
              <DropdownMenuItem v-if="canDelete" class="text-destructive" @click="deleteVisible = true">
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        v-if="showPreviewComments && (previewComments.length || moreReplies)"
        class="my-2 flex flex-col gap-0.5 rounded-md bg-muted p-2 text-xs"
      >
        <div v-for="comment in previewComments" :key="comment.cid" class="line-clamp-2 break-words text-muted-foreground">
          <span class="text-foreground">{{ comment.username }}</span
          >: <span v-if="comment.mention" class="mr-1 text-foreground">{{ comment.mention }}</span
          ><span v-html="comment.html"></span>
        </div>
        <div v-if="moreReplies" class="pt-0.5 text-muted-foreground">还有 {{ moreReplies }} 条回复</div>
      </div>
    </div>
  </div>
  <ForumReportDialog v-model="reportVisible" :target-id="post.id" />
  <AdminDeleteDialog
    v-model="deleteVisible"
    :endpoint="deleteEndpoint"
    :title="isOwn ? '删除帖子' : '删除帖子（管理员）'"
    :description="`确认删除帖子 #${post.id} 吗？此操作不可撤销。`"
    success-message="帖子已删除"
    @success="emit('deleted', post.id)"
  />
  <BlogPostEditor
    v-if="editMounted"
    v-model:visible="editVisible"
    :edit-target="editTarget"
    :dark-mode="darkMode"
    @success="emit('updated', post.id)"
  />
  <PostHistoryDialog v-model="historyVisible" :post-id="post.id" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Ellipsis, MessageSquare, Star } from "lucide-vue-next";
import ForumContent from "@/components/blog-center/ForumContent.vue";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import { requestApi } from "@/api/api";
import { formatTime, shouldIgnoreCardClick } from "@/utils";
import { buildPreviewComments } from "@/utils/preview";
import UserAvatar from "@/components/UserAvatar.vue";
import { useForumStore, type Poll } from "@/stores/forum";
import { useUserStore } from "@/stores/user";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "vue-sonner";
import AdminDeleteDialog from "@/components/blog-center/AdminDeleteDialog.vue";
import ForumReportDialog from "@/components/blog-center/ForumReportDialog.vue";
import BlogPostEditor from "@/components/blog-center/BlogPostEditor.vue";
import PostPoll from "@/components/blog-center/PostPoll.vue";
import PostSurvey from "@/components/survey/PostSurvey.vue";
import { type SurveySummary } from "@/utils/survey";
import PostHistoryDialog from "@/components/blog-center/PostHistoryDialog.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const forumStore = useForumStore();
const userStore = useUserStore();
const router = useRouter();

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  darkMode: {
    type: Boolean,
    default: undefined,
  },
  showPreviewComments: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["card-click", "deleted", "updated"]);

const isLiked = ref(props.post.is_like);
const isFollowed = ref(props.post.is_follow);
const likeNum = ref(props.post.likenum);
const followNum = ref(props.post.follownum);
const poll = ref<Poll | null>(props.post.poll ?? null);
const survey = ref<SurveySummary | null>(props.post.survey ?? null);
const reportVisible = ref(false);
const deleteVisible = ref(false);
const editVisible = ref(false);
const historyVisible = ref(false);
const editTarget = ref<{ id: number; content: string; tags: string[] } | null>(null);
const editMounted = ref(false);
watch(editVisible, (visible) => {
  if (visible) editMounted.value = true;
});
const timeInfo = computed(() => formatTime(props.post.timestamp));
watch(
  () => props.post.poll,
  (next) => {
    poll.value = next ?? null;
  }
);
watch(
  () => props.post.survey,
  (next) => {
    survey.value = next ?? null;
  }
);
const previewComments = computed(() => buildPreviewComments(props.post.comments));
const moreReplies = computed(() => Math.max(0, (props.post.reply ?? 0) - previewComments.value.length));
const isAdmin = computed(() => userStore.role === 2);
const isOwn = computed(() => Number(props.post.userid) === Number(userStore.userid));
const canDelete = computed(() => isOwn.value || isAdmin.value);
const deleteEndpoint = computed(() =>
  isOwn.value ? `/api/v2/forum/posts/${props.post.id}` : `/api/v2/admin/forum/posts/${props.post.id}`
);

const handleEdit = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/posts/raw/${props.post.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    editTarget.value = {
      id: props.post.id,
      content: data.data.content,
      tags: [...(props.post.tags ?? [])],
    };
    editVisible.value = true;
  } catch (error) {
    toast.error("加载原文失败");
    console.error("Load raw post failed:", error);
  }
};

const handleClick = (event: MouseEvent) => {
  if (shouldIgnoreCardClick(event)) return;
  emit("card-click");
};

const hoverStats = ref<{ post_count: number; comment_count: number; likes_received: number } | null>(null);
const hoverStatsLoading = ref(false);

const hoverCardOpen = ref(false);
const hoverCardDismissed = ref(false);

const loadHoverStats = async () => {
  if (hoverStats.value || hoverStatsLoading.value) return;

  hoverStatsLoading.value = true;
  try {
    const res = await requestApi(`/api/v2/users/${props.post.userid}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    hoverStats.value = result.data;
  } catch (error) {
    console.error("Load user stats failed:", error);
  } finally {
    hoverStatsLoading.value = false;
  }
};

const handleHoverOpen = (open: boolean) => {
  hoverCardOpen.value = open;
  if (!open) return;

  hoverCardDismissed.value = false;
  loadHoverStats();
};

const goProfile = async () => {
  hoverCardDismissed.value = true;
  hoverCardOpen.value = false;
  await nextTick();
  router.push({ name: "UserProfile", params: { id: props.post.userid } });
};

const handleLike = async () => {
  const prevLiked = isLiked.value;
  const prevNum = likeNum.value;
  isLiked.value = !prevLiked;
  likeNum.value = isLiked.value ? prevNum + 1 : prevNum - 1;
  forumStore.updatePostLike(props.post.id, isLiked.value, likeNum.value);

  try {
    const res = await requestApi(`/api/v2/forum/like/${props.post.id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {    isLiked.value = prevLiked;
    likeNum.value = prevNum;
    forumStore.updatePostLike(props.post.id, prevLiked, prevNum);
    toast.error("操作失败");
    console.error("Like operation failed:", error);
  }
};

const handlePollVoted = (updated: Poll) => {
  poll.value = updated;
  forumStore.updatePostPoll(props.post.id, updated);
};

const handleFollow = async () => {
  const prevFollowed = isFollowed.value;
  const prevNum = followNum.value;
  isFollowed.value = !prevFollowed;
  followNum.value = isFollowed.value ? prevNum + 1 : prevNum - 1;

  try {
    const res = await requestApi(`/api/v2/forum/follow/${props.post.id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {    isFollowed.value = prevFollowed;
    followNum.value = prevNum;
    toast.error("操作失败");
    console.error("Follow operation failed:", error);
  }
};

const handleCopy = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/posts/raw/${props.post.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.data.content;
    if (!navigator.clipboard) {
      return new Promise((resolve) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.width = "2em";
        textarea.style.height = "2em";
        textarea.style.padding = "0";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        textarea.style.boxShadow = "none";
        textarea.style.background = "transparent";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        try {
          const successful = document.execCommand("copy");
          toast.success("复制成功");
          resolve(successful);
        } catch (err) {
          toast.warning("当前浏览器环境不支持复制");
          console.error("Fallback copy failed", err);
          resolve(false);
        } finally {
          document.body.removeChild(textarea);
        }
      });
    }
    await navigator.clipboard.writeText(text);
    toast.success("复制成功");
  } catch {
    toast.error("复制失败");
  }
};
</script>
