<template>
  <div class="card mt-10 bg-(--c-card) md:bg-transparent" :key="post.id">
    <CollapsibleDiv max-height="500">
      <div class="card-header unselectable">
        <div class="flex">
          <UserAvatar :userid="post.userid" />
          <div class="flex-1">
            <span> {{ post.username }} </span>
            <code class="card-id"> #{{ post.id }} </code>
            <el-icon :size="16" class="copy-btn" @click.stop="handleCopy">
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
          <span class="tag" v-for="tag in post.tags" :key="tag">
            {{ tag }}
          </span>
        </div>
      </div>

      <MarkdownRenderer :dark-mode="darkMode" :content="post.text" class="cursor-pointer" @click="handleClick" />
    </CollapsibleDiv>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Star, StarFilled, ChatLineRound, CopyDocument } from "@element-plus/icons-vue";
import MarkdownRenderer from "../MarkdownRenderer-backend.vue";
import CollapsibleDiv from "../CollapsibleDiv.vue";
import { ElMessage } from "element-plus";
import { requestApi } from "../../api/api";
import { formatTime } from "../../utils";
import UserAvatar from "../UserAvatar.vue";

const props = defineProps({
  post: {
    type: Object,
    required: true,
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

    isLiked.value = !isLiked.value;
    likeNum.value = isLiked.value ? likeNum.value + 1 : likeNum.value - 1;

    if (!res.ok) throw new Error("操作失败");
  } catch (error) {
    ElMessage.error("网络错误");
    console.error("Like operation failed:", error);
  }
};

const handleFollow = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/follow/${props.post.id}`, {
      method: "POST",
    });

    isFollowed.value = !isFollowed.value;
    followNum.value = isFollowed.value ? followNum.value + 1 : followNum.value - 1;

    if (!res.ok) throw new Error("操作失败");
  } catch (error) {
    ElMessage.error("网络错误");
    console.error("Follow operation failed:", error);
  }
};

const handleCopy = async () => {
  if (!navigator.clipboard) return alert("当前浏览器环境不支持复制");
  try {
    const res = await requestApi(`/api/v2/forum/posts/raw/${props.post.id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await navigator.clipboard.writeText(data.data.content);
    ElMessage.success("复制成功");
  } catch {
    ElMessage.error("复制失败");
  }
};
</script>

<style scoped>
.card {
  padding: 0px;
  border-radius: 5px;
}

.tag {
  font-size: 14px;
  background: var(--gray-2);
  padding: 2px 12px;
  margin: 0 12px 8px 0;
  border: 1px solid var(--gray-2);
  border-radius: 9999px;
}

.card-header {
  font-size: 14px;
  padding: 15px 0 10px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--c-border);
}

.el-avatar {
  margin-right: 10px;
}

.copy-btn {
  float: right;
  text-align: center;
  color: transparent;
  cursor: pointer;
}

.card:hover .copy-btn {
  color: var(--c-text);
}
</style>
