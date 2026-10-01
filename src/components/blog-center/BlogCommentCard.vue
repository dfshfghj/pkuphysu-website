<template>
  <div class="group rounded-sm my-2 py-3 comment-card" :key="comment.cid" @click="emit('click')">
    <CollapsibleDiv :max-height="300">
      <div class="text-sm pt-4 pb-2 mb-2 border-b border-(--c-border) unselectable">
        <div class="flex">
          <UserAvatar class="mr-2" :userid="comment.userid" />
          <div class="flex-1">
            <span> {{ comment.username }} </span>
            <div class="flex flex-row-reverse w-full items-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <el-icon :size="16" class="mr-4 cursor-pointer text-(--c-secondary)" @click.stop>
                    <MoreFilled />
                  </el-icon>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleCopy">复制</DropdownMenuItem>
                  <DropdownMenuItem @click="reportVisible = true">举报</DropdownMenuItem>
                  <DropdownMenuItem v-if="canDelete" class="text-(--red-6)" @click="deleteVisible = true">
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div class="float-right mr-4" @click.stop="handleLike">
                {{ props.comment.likenum }}
                <el-icon :size="12">
                  <IconRiHeartFill v-if="props.comment.is_like" />
                  <IconRiHeartLine v-else />
                </el-icon>
              </div>
              <span class="flex min-w-0 flex-1 items-center">
                <span class="truncate">
                  {{ timeInfo.relativeTime }}
                  <span class="hidden sm:inline">{{ timeInfo.formattedTime }}</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <span v-if="comment.quote" class="text-sm text-(--c-secondary)!">
        {{ `@${comment.quote.username}: ` }}
      </span>
      <ForumContent :content="comment.text" />
    </CollapsibleDiv>
  </div>
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
import { MoreFilled } from "@element-plus/icons-vue";
import { formatTime } from "@/utils";
import { requestApi } from "@/api/api";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import ForumContent from "@/components/blog-center/ForumContent.vue";
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
const emit = defineEmits(["click", "like-update", "deleted"]);

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});
const reportVisible = ref(false);
const deleteVisible = ref(false);
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
