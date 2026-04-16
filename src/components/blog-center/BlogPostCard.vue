<template>
  <div class="group rounded-sm my-2 py-3 bg-card md:bg-transparent" :key="post.id">
    <CollapsibleDiv :max-height="500">
      <div class="text-sm pt-4 pb-2 mb-2 border-b border-(--c-border) unselectable">
        <div class="flex">
          <HoverCard>
            <HoverCardTrigger>
              <UserAvatar class="mr-2" :userid="post.userid" />
            </HoverCardTrigger>
            <HoverCardContent>
              <UserAvatar :userid="post.userid" :size="50" />
            </HoverCardContent>
          </HoverCard>
          <div class="flex-1">
            <span> {{ post.username }} </span>
            <code> #{{ post.id }} </code>
            <el-icon
              :size="16"
              class="float-right text-center opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
              @click.stop="handleCopy"
            >
              <CopyDocument />
            </el-icon>
            <div>
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
              <span>
                {{ formatTime(post.timestamp).relativeTime }}
                {{ formatTime(post.timestamp).formattedTime }}
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

      <MarkdownRenderer :dark-mode="darkMode" :content="post.text" class="cursor-pointer" @click="handleClick" />
    </CollapsibleDiv>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Star, StarFilled, ChatLineRound, CopyDocument } from "@element-plus/icons-vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import { requestApi } from "@/api/api";
import { formatTime } from "@/utils";
import UserAvatar from "@/components/UserAvatar.vue";
import { useForumStore } from "@/stores/forum";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "vue-sonner";

const forumStore = useForumStore();

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["card-click"]);

const isLiked = ref(props.post.is_like);
const isFollowed = ref(props.post.is_follow);
const likeNum = ref(props.post.likenum);
const followNum = ref(props.post.follownum);

const handleClick = () => {
  emit("card-click");
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
