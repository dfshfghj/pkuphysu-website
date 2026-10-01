<template>
  <div class="group rounded-sm my-2 py-3" :key="post.id">
    <CollapsibleDiv :max-height="500">
      <div class="text-sm pt-4 pb-2 mb-2 border-b border-(--c-border) unselectable">
        <div class="flex">
          <HoverCard :open="hoverCardOpen" @update:open="handleHoverOpen">
            <HoverCardTrigger>
              <UserAvatar class="mr-2" :userid="post.userid" @click.stop="goProfile" />
            </HoverCardTrigger>
            <HoverCardContent v-if="!hoverCardDismissed" class="w-60">
              <div class="flex items-center gap-3">
                <UserAvatar :userid="post.userid" :size="50" @click.stop="goProfile" />
                <span class="min-w-0 flex-1 cursor-pointer truncate font-bold hover:underline" @click.stop="goProfile">
                  {{ post.username }}
                </span>
              </div>
              <div class="mt-3 flex items-center border-t border-(--c-border) pt-2 text-center">
                <div class="flex flex-1 flex-col">
                  <span class="font-bold">{{ hoverStats?.post_count ?? "-" }}</span>
                  <span class="text-xs text-(--c-secondary)">帖子</span>
                </div>
                <div class="flex flex-1 flex-col">
                  <span class="font-bold">{{ hoverStats?.comment_count ?? "-" }}</span>
                  <span class="text-xs text-(--c-secondary)">评论</span>
                </div>
                <div class="flex flex-1 flex-col">
                  <span class="font-bold">{{ hoverStats?.likes_received ?? "-" }}</span>
                  <span class="text-xs text-(--c-secondary)">获赞</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <div class="flex-1">
            <span class="cursor-pointer hover:underline" @click.stop="goProfile"> {{ post.username }} </span>
            <code> #{{ post.id }} </code>
            <div class="flex flex-row-reverse w-full items-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <el-icon :size="16" class="mr-4 cursor-pointer text-(--c-secondary)" @click.stop>
                    <MoreFilled />
                  </el-icon>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleCopy">复制</DropdownMenuItem>
                  <DropdownMenuItem v-if="post.edit_count" @click="historyVisible = true">历史版本</DropdownMenuItem>
                  <DropdownMenuItem v-if="isOwn" @click="handleEdit">编辑</DropdownMenuItem>
                  <DropdownMenuItem @click="reportVisible = true">举报</DropdownMenuItem>
                  <DropdownMenuItem v-if="canDelete" class="text-(--red-6)" @click="deleteVisible = true">
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div class="float-right mr-4" @click.stop="handleFollow">
                {{ followNum }}
                <el-icon :size="12">
                  <StarFilled v-if="isFollowed" />
                  <Star v-else />
                </el-icon>
              </div>
              <div class="float-right mr-4" @click.stop="handleLike">
                {{ likeNum }}
                <el-icon :size="12">
                  <IconRiHeartFill v-if="isLiked" />
                  <IconRiHeartLine v-else />
                </el-icon>
              </div>
              <div class="float-right mr-4" v-if="post.reply" @click.stop="">
                {{ post.reply }}
                <el-icon :size="12">
                  <ChatLineRound />
                </el-icon>
              </div>
              <span class="flex min-w-0 flex-1 items-center">
                <span class="truncate">
                  {{ timeInfo.relativeTime }}
                  {{ timeInfo.formattedTime }}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div class="mt-2.5 mr-1">
          <span class="text-sm bg-(--gray-2) px-3 py-1 mr-3 mb-2 rounded-full" v-for="tag in post.tags" :key="tag">
            {{ tag }}
          </span>
        </div>
      </div>

      <ForumContent :content="post.text" class="cursor-pointer" @click="handleClick" />
    </CollapsibleDiv>
    <div
      v-if="previewComments.length"
      class="flex cursor-pointer flex-col gap-0.5 px-5 pt-1 text-xs md:px-12.5"
      @click="handleClick"
    >
      <div v-for="comment in previewComments" :key="comment.cid" class="line-clamp-2 break-words text-(--c-secondary)">
        <span class="text-(--c-title)">{{ comment.username }}</span
        >: <span v-if="comment.mention" class="mr-1 text-(--c-title)">{{ comment.mention }}</span
        ><span v-html="comment.html"></span>
      </div>
    </div>
    <div v-if="post.edit_count" class="px-5 text-xs text-(--c-secondary) md:px-12.5">
      已编辑 {{ post.edit_count }} 次
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
    v-model:visible="editVisible"
    :edit-target="editTarget"
    :dark-mode="darkMode"
    @success="emit('updated', post.id)"
  />
  <PostHistoryDialog v-model="historyVisible" :post-id="post.id" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Star, StarFilled, ChatLineRound, MoreFilled } from "@element-plus/icons-vue";
import ForumContent from "@/components/blog-center/ForumContent.vue";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import { requestApi } from "@/api/api";
import { formatTime } from "@/utils";
import { buildPreviewComments } from "@/utils/preview";
import UserAvatar from "@/components/UserAvatar.vue";
import { useForumStore } from "@/stores/forum";
import { useUserStore } from "@/stores/user";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "vue-sonner";
import AdminDeleteDialog from "@/components/blog-center/AdminDeleteDialog.vue";
import ForumReportDialog from "@/components/blog-center/ForumReportDialog.vue";
import BlogPostEditor from "@/components/blog-center/BlogPostEditor.vue";
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
});

const emit = defineEmits(["card-click", "deleted", "updated"]);

const isLiked = ref(props.post.is_like);
const isFollowed = ref(props.post.is_follow);
const likeNum = ref(props.post.likenum);
const followNum = ref(props.post.follownum);
const reportVisible = ref(false);
const deleteVisible = ref(false);
const editVisible = ref(false);
const historyVisible = ref(false);
const editTarget = ref<{ id: number; content: string; tags: string[] } | null>(null);
const timeInfo = computed(() => formatTime(props.post.timestamp));
const previewComments = computed(() => buildPreviewComments(props.post.comments));
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

const handleClick = () => {
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
  try {
    const res = await requestApi(`/api/v2/forum/like/${props.post.id}`, {
      method: "POST",
    });

    // 更新本地状态
    isLiked.value = !isLiked.value;
    likeNum.value = isLiked.value ? likeNum.value + 1 : likeNum.value - 1;

    // 更新store中的帖子数据
    forumStore.updatePostLike(props.post.id, isLiked.value, likeNum.value);

    if (!res.ok) throw new Error("操作失败");
  } catch (error) {
    toast.error("操作失败");
    console.error("Like operation failed:", error);
  }
};

const handleFollow = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/follow/${props.post.id}`, {
      method: "POST",
    });

    // 更新本地状态
    isFollowed.value = !isFollowed.value;
    followNum.value = isFollowed.value ? followNum.value + 1 : followNum.value - 1;

    if (!res.ok) throw new Error("操作失败");
  } catch (error) {
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
