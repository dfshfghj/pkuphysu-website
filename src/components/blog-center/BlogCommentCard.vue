<template>
  <div class="card comment-card bg-(--c-card) md:bg-transparent" :key="comment.cid">
    <CollapsibleDiv max-height="300" @click="onClick">
      <div class="card-header unselectable">
        <div class="flex">
          <UserAvatar :userid="comment.userid" />
          <div class="flex-1">
            <span> {{ comment.username }} </span>
            <el-icon :size="16" class="copy-btn" @click="handleCopy">
              <CopyDocument />
            </el-icon>
            <div>
              <div class="float-right mr-4" @click="handleLike">
                {{ likeNum }}
                <el-icon :size="12">
                  <IconRiHeartFill v-if="isLiked" />
                  <IconRiHeartLine v-else />
                </el-icon>
              </div>
              <span>
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
</template>

<script setup>
import { computed } from "vue";
import { CopyDocument } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { formatTime } from "../../utils";
import { requestApi } from "../../api/api";
import CollapsibleDiv from "../CollapsibleDiv.vue";
import MarkdownRenderer from "../MarkdownRenderer-backend.vue";
import UserAvatar from "../UserAvatar.vue";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["like-update", "click"]);

// 使用 computed 确保状态始终与 props 同步，符合项目规范
const isLiked = computed(() => props.comment.is_like);
const likeNum = computed(() => props.comment.likenum);

const handleLike = async () => {
  try {
    const res = await requestApi(`/api/v2/forum/comment/like/${props.comment.cid}`, {
      method: "POST",
    });

    if (!res.ok) throw new Error("操作失败");

    // 通知父组件更新评论数据
    emit("like-update", {
      cid: props.comment.cid,
      is_like: !props.comment.is_like,
      likenum: props.comment.is_like ? props.comment.likenum - 1 : props.comment.likenum + 1,
    });
  } catch (error) {
    ElMessage.error("网络错误");
    console.error("Like operation failed:", error);
  }
};

const handleCopy = async () => {
  if (!navigator.clipboard) return alert("当前浏览器环境不支持复制");
  try {
    const res = await requestApi(`/api/v2/forum/comments/raw/${props.comment.cid}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await navigator.clipboard.writeText(data.data.content);
    ElMessage.success("复制成功");
  } catch {
    ElMessage.error("复制失败");
  }
};

const onClick = () => {
  emit("click");
};
</script>

<style scoped>
.card {
  padding: 0px;
  border-radius: 5px;
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
