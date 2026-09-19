<template>
  <div class="group rounded-sm my-2 py-3 comment-card bg-card md:bg-transparent" :key="comment.cid">
    <CollapsibleDiv :max-height="300" @click="onClick">
      <div class="text-sm pt-4 pb-2 mb-2 border-b border-(--c-border) unselectable">
        <div class="flex">
          <UserAvatar class="mr-2" :userid="comment.userid" />
          <div class="flex-1">
            <span> {{ comment.username }} </span>
            <el-icon
              :size="16"
              class="float-right text-center opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
              @click.stop="handleCopy"
            >
              <CopyDocument />
            </el-icon>
            <el-button
              link
              class="float-right mr-2! h-auto! px-0! text-xs! font-normal! text-(--c-secondary)! opacity-0 transition-all group-hover:opacity-100 hover:text-(--red-6)!"
              @click.stop="reportVisible = true"
            >
              举报
            </el-button>
            <el-button
              v-if="isAdmin"
              link
              class="float-right mr-2! h-auto! px-0! text-xs! font-normal! text-(--c-secondary)! opacity-0 transition-all group-hover:opacity-100 hover:text-(--red-6)!"
              @click.stop="deleteVisible = true"
            >
              删除
            </el-button>
            <div class="flex flex-row-reverse w-full">
              <div class="float-right mr-4" @click.stop="handleLike">
                {{ props.comment.likenum }}
                <el-icon :size="12">
                  <IconRiHeartFill v-if="props.comment.is_like" />
                  <IconRiHeartLine v-else />
                </el-icon>
              </div>
              <span class="flex-1">
                {{ formatTime(comment.timestamp).relativeTime }}
                {{ formatTime(comment.timestamp).formattedTime }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <span v-if="comment.quote" class="text-sm text-(--c-secondary)!">
        {{ `@${comment.quote.username}: ` }}
      </span>
      <MarkdownRenderer :content="comment.text" />
    </CollapsibleDiv>
  </div>
  <ForumReportDialog
    v-model="reportVisible"
    :target-id="comment.cid"
    :endpoint="`/api/v2/forum/comments/${comment.cid}/report`"
  />
  <AdminDeleteDialog
    v-model="deleteVisible"
    :endpoint="`/api/v2/admin/forum/comments/${comment.cid}`"
    title="删除评论"
    :description="`确认删除评论 #${comment.cid} 吗？此操作不可撤销。`"
    success-message="评论已删除"
    @success="emit('deleted', comment.cid)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CopyDocument } from "@element-plus/icons-vue";
import { formatTime } from "@/utils";
import { requestApi } from "@/api/api";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import { useForumStore } from "@/stores/forum";
import { useUserStore } from "@/stores/user";
import { toast } from "vue-sonner";
import AdminDeleteDialog from "@/components/blog-center/AdminDeleteDialog.vue";
import ForumReportDialog from "@/components/blog-center/ForumReportDialog.vue";

const forumStore = useForumStore();
const userStore = useUserStore();
const emit = defineEmits(["like-update", "deleted"]);

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});
const reportVisible = ref(false);
const deleteVisible = ref(false);
const isAdmin = computed(() => userStore.role === 2);

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

    forumStore.updateCommentLike(
      updatedComment.cid,
      updatedComment.is_like,
      updatedComment.likenum
    );
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

const onClick = () => {
  // 不再需要 emit，直接通过 props 传递事件
};
</script>
