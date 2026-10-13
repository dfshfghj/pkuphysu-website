<template>
  <div
    class="group comment-card bg-card flex cursor-pointer items-start gap-2 rounded-sm px-5 py-4 border-b-2 border-background md:pr-12.5 md:pl-6"
    :key="comment.cid"
    @click="handleCardClick"
  >
    <div class="hidden shrink-0 sm:flex">
      <UserAvatar :userid="comment.userid" :size="40" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="unselectable flex items-center gap-2 text-sm">
        <div class="shrink-0 sm:hidden">
          <UserAvatar :userid="comment.userid" :size="28" />
        </div>
        <span class="min-w-0 truncate font-bold">{{ comment.username }}</span>
        <span class="ml-auto shrink-0 text-xs text-muted-foreground">
          {{ timeInfo.relativeTime }}
          <span class="hidden sm:inline">{{ timeInfo.formattedTime }}</span>
        </span>
      </div>

      <CollapsibleDiv :max-height="300">
        <span v-if="comment.quote" class="text-sm text-muted-foreground!">
          <a
            :href="`/u/${comment.quote.userid}`"
            :data-mention="String(comment.quote.userid)"
            class="text-primary hover:underline"
            @click="openQuoteAuthor"
            @mouseenter="showQuoteAuthorCard"
            >@{{ comment.quote.username }}</a
          >:
        </span>
        <ForumContent :content="comment.text" />
      </CollapsibleDiv>

      <div class="mt-1 flex items-center text-xs text-muted-foreground">
        <div class="ml-auto flex items-center gap-4">
          <div class="flex cursor-pointer items-center gap-1" @click.stop="handleLike">
            {{ props.comment.likenum }}
            <IconRiHeartFill v-if="props.comment.is_like" class="size-3" />
            <IconRiHeartLine v-else class="size-3" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Ellipsis class="size-4 scale-125 fill-current cursor-pointer" @click.stop />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleCopy">复制</DropdownMenuItem>
              <DropdownMenuItem @click="reportVisible = true">举报</DropdownMenuItem>
              <DropdownMenuItem v-if="canDelete" class="text-destructive" @click="deleteVisible = true">
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </div>
  <UserMentionHoverCard ref="mentionCardRef" />
  <ForumReportDialog
    v-model="reportVisible"
    :target-id="comment.cid"
    :endpoint="`/api/v2/forum/comments/${comment.cid}/report`"
  />
  <AdminDeleteDialog
    v-model="deleteVisible"
    :endpoint="deleteEndpoint"
    :title="isOwn ? '删除评论' : '删除评论（管理员）'"
    :description="`确认删除评论 #${comment.cid} 吗？此操作不可撤销。`"
    success-message="评论已删除"
    @success="emit('deleted', comment.cid)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Ellipsis } from "lucide-vue-next";
import { formatTime, shouldIgnoreCardClick } from "@/utils";
import { requestApi } from "@/api/api";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import ForumContent from "@/components/blog-center/ForumContent.vue";
import UserMentionHoverCard from "@/components/blog-center/UserMentionHoverCard.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import { useForumStore } from "@/stores/forum";
import { useUserStore } from "@/stores/user";
import { toast } from "vue-sonner";
import AdminDeleteDialog from "@/components/blog-center/AdminDeleteDialog.vue";
import ForumReportDialog from "@/components/blog-center/ForumReportDialog.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const forumStore = useForumStore();
const userStore = useUserStore();
const router = useRouter();
const emit = defineEmits(["click", "like-update", "deleted"]);

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});
const reportVisible = ref(false);
const deleteVisible = ref(false);
const mentionCardRef = ref<InstanceType<typeof UserMentionHoverCard> | null>(null);

const openQuoteAuthor = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  router.push(`/u/${props.comment.quote.userid}`);
};

const handleCardClick = (event: MouseEvent) => {
  if (shouldIgnoreCardClick(event)) return;
  emit("click");
};

const showQuoteAuthorCard = (event: MouseEvent) => {
  mentionCardRef.value?.show(event.currentTarget as HTMLAnchorElement);
};

const isAdmin = computed(() => userStore.role === 2);
const isOwn = computed(() => Number(props.comment.userid) === Number(userStore.userid));
const timeInfo = computed(() => formatTime(props.comment.timestamp));
const canDelete = computed(() => isOwn.value || isAdmin.value);
const deleteEndpoint = computed(() =>
  isOwn.value ? `/api/v2/forum/comments/${props.comment.cid}` : `/api/v2/admin/forum/comments/${props.comment.cid}`
);

const handleLike = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/comment/like/${props.comment.cid}`, {
      method: "POST",
    });

    if (!res.ok) throw new Error("操作失败");

    const updatedComment = {
      cid: props.comment.cid,
      is_like: Number(!props.comment.is_like),
      likenum: props.comment.is_like ? props.comment.likenum - 1 : props.comment.likenum + 1,
    };

    forumStore.updateCommentLike(updatedComment.cid, updatedComment.is_like, updatedComment.likenum);
    emit("like-update", updatedComment);
  } catch (error) {
    toast.error("操作失败");
    console.error("Like operation failed:", error);
  }
};

const handleCopy = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/comments/raw/${props.comment.cid}`);
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
