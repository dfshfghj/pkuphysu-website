<template>
  <div class="container">
    <div class="sidebar"></div>
    <el-scrollbar
      distance="500"
      @end-reached="loadMorePosts"
      style="height: calc(100vh - 64px)"
    >
      <div
        v-for="post in posts"
        :key="post.id"
        ref="postRefs"
        class="post-item card"
      >
        <div class="card-header unselectable">
          <UserAvatar :userid="post.userid" />
          <div style="flex: 1">
            <span> {{ post.username }} </span>
            <code class="card-id"> #{{ post.id }} </code>
            <el-icon :size="16" class="copy-btn" @click="copyText(post.text)">
              <CopyDocument />
            </el-icon>
            <div>
              <span>
                {{ formatTime(post.timestamp).relativeTime }}
                {{ formatTime(post.timestamp).formattedTime }}
              </span>
              &nbsp;
              <el-tag v-if="post.tag"> {{ post.tag }} </el-tag>
            </div>
          </div>
        </div>
        <CollapsibleDiv max-height="500">
          <MarkdownRenderer :dark-mode="isDark" :content="post.text" />
        </CollapsibleDiv>
        <el-row style="text-align: center; margin-bottom: 12px">
          <el-col :span="12">
            <el-button text size="small" @click="handleFollow(post.id)">
              <el-icon>
                <StarFilled v-if="post.is_follow" />
                <Star v-else />
              </el-icon>
              &nbsp; {{ post.likenum }} 点赞
            </el-button>
          </el-col>
          <el-col :span="12">
            <el-button
              text
              size="small"
              type="info"
              @click="
                fetchComments(post.id);
                toggleComments(post.id);
              "
            >
              <el-icon>
                <ChatDotRound />
              </el-icon>
              &nbsp; {{ post.reply }} 评论
            </el-button>
          </el-col>
        </el-row>
        <div v-if="activeCommentPanel == post.id">
          <div
            v-for="comment in comments[post.id]"
            :key="comment.cid"
            class="card comment-card"
          >
            <div class="card-header unselectable">
              <UserAvatar :userid="comment.userid" />
              <div style="flex: 1">
                <span> {{ comment.username }} </span>
                <el-icon
                  :size="16"
                  class="copy-btn"
                  @click="copyText(comment.text)"
                >
                  <CopyDocument />
                </el-icon>
                <div>
                  <span>
                    {{ formatTime(comment.timestamp).relativeTime }}
                    {{ formatTime(comment.timestamp).formattedTime }}
                  </span>
                </div>
              </div>
            </div>
            <CollapsibleDiv max-height="300">
              <span
                v-if="comment.quote"
                style="
                  margin-left: 20px;
                  font-size: 14px;
                  color: var(--c-secondary);
                "
              >
                {{ `@${comment.quote.username}: ` }}
              </span>
              <MarkdownRenderer
                :dark-mode="isDark"
                :content="comment.text"
                @click="
                  () => {
                    if (quote !== comment.cid) {
                      quote = comment.cid;
                      quoteName = comment.username;
                    } else {
                      quote = null;
                      quoteName = null;
                    }
                  }
                "
              />
            </CollapsibleDiv>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="text-align: center; padding: 24px">
        <p style="margin-top: 12px">加载中...</p>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import {
  ChatDotRound,
  Star,
  StarFilled,
  CopyDocument,
} from "@element-plus/icons-vue";
import { requestApi } from "../../api/api";
import { formatTime } from "../../utils";
import CollapsibleDiv from "../../components/CollapsibleDiv.vue";
import UserAvatar from "../../components/UserAvatar.vue";
import MarkdownRenderer from "../../components/MarkdownRenderer.vue";

// State
const posts = ref([]);
const loading = ref(false);
const postRefs = ref([]);
const activeCommentPanel = ref("");
const comments = ref({});
const AscSort = ref(true);

const endOfPosts = ref(false);
const endOfComments = ref(false);
const quote = ref(null);
const quoteName = ref("");

const copyText = async (text) => {
  if (!navigator.clipboard) return alert("当前浏览器环境不支持复制");
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("复制成功");
  } catch {
    ElMessage.error("复制失败");
  }
};

const loadMorePosts = async () => {
  if (loading.value || endOfPosts.value) return;
  loading.value = true;
  try {
    const res =
      posts.value.length > 0
        ? await requestApi(
            `/api/blogs/posts?limit=10&begin=${posts.value.at(-1).id}`,
          )
        : await requestApi(`/api/blogs/posts?limit=10&page=1`);
    const data = await res.json();
    if (data.data.length === 0) {
      endOfPosts.value = true;
    } else {
      const newPosts = data.data.map((post) => ({
        ...post,
        formattedTime: formatTime(post.timestamp),
      }));
      posts.value.push(...newPosts);
    }
  } catch (error) {
    console.error("Error loading more posts:", error);
  } finally {
    loading.value = false;
  }
};

const handleFollow = async (id) => {
  try {
    const res = await requestApi(`/api/blogs/follow/${id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const post = posts.value.find((p) => p.id === id);
    if (post) {
      post.is_follow = !post.is_follow;
      post.likenum += post.is_follow ? 1 : -1;
    }
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

const fetchComments = async (id) => {
  try {
    const res = await requestApi(
      `/api/blogs/comments/${id}?limit=10&page=1&sort=${AscSort.value ? "asc" : "desc"}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 10) {
      endOfComments.value = true;
    }
    console.log(comments.value);
    comments.value[id] = data.data;
    console.log(comments.value);
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};
const toggleComments = (id) => {
  const post = posts.value.find((p) => p.id === id);
  if (post) {
    post.showComments = !post.showComments;
    if (post.showComments) {
      activeCommentPanel.value = id.toString();
    } else if (activeCommentPanel.value === id.toString()) {
      activeCommentPanel.value = "";
    }
  }
};

onMounted(() => {
  loadMorePosts();
});
// 引用外部图片绕过防盗链
onBeforeMount(() => {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "no-referrer";
  document.head.appendChild(meta);
});

onUnmounted(() => {
  const meta = document.querySelector('meta[name="referrer"]');
  if (meta) meta.remove();
});
</script>

<style scoped>
.container {
  display: flex;
  max-width: 100vw;
}

.sidebar {
  min-width: 320px;
  background-color: var(--c-card);
}

.card {
  padding: 0px;
  margin: 40px;
  border-radius: 5px;
  border: 1px solid var(--c-border);
  background-color: var(--c-card);
}

.title {
  font-size: 1.5em;
  padding-top: 10px;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
}

.title-bar {
  color: var(--c-title);
  padding-bottom: 0.7em;
  z-index: 10;
  position: sticky;
  top: -110px;
  left: 0;
  width: 100%;
  min-height: 9em;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.4);
  margin-bottom: 1em;
  background-color: var(--c-card);
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 28px;
  width: 28px;
}

.control-bar {
  line-height: 2em;
  margin-top: 5px;
  display: flex;
  align-items: center;
}

.control-btn {
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 100%;
  padding: 10px;
}

.control-btn-label {
  margin-left: 0.25rem;
  font-size: 0.9em;
  vertical-align: 0.05em;
}

:deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

.control-search:deep(.el-select__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

:deep(.reply textarea) {
  max-height: 300px;
}

.control-search {
  display: flex;
  align-items: center;
  padding: 2px 10px 2px 10px;
  border: 1px solid var(--c-border);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
  flex: 1;
}

.aux-margin {
  margin-bottom: 50px;
}

#edit-new {
  position: fixed;
  width: 40px;
  height: 40px;
  right: 20px;
  bottom: 100px;
  border-radius: 50%;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  font-size: 20px;
  -webkit-box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  z-index: 5;
  background-color: rgb(148, 7, 10);
  color: white;
}

.edit-panel {
  position: fixed;
  width: 100vw;
  height: 100vh;
  right: 0px;
  top: 0px;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  pointer-events: auto;
}

.editor {
  height: calc(100vh - 200px);
  padding: 50px 50px 0px 50px;
  align-content: center;
}

:deep(.el-tabs) {
  max-height: 100%;
}

:deep(.el-upload-list__item-file-name) {
  color: beige;
}

.header-badge {
  float: right;
  margin-right: 15px;
}

.end-flag {
  text-align: center;
  font-size: 18px;
  padding-top: 10px;
  padding-bottom: 20px;
}

.copy-btn {
  float: right;
  text-align: center;
  color: transparent;
  cursor: pointer;
}

.card:hover > .card-header .copy-btn {
  color: var(--c-text);
}

.dark .el-tag {
  background: #3c108f;
  border: #3c108f;
}

.el-tag {
  background: #c396ed;
  border: #3c108f;
  font-weight: bold;
}

.comment-card {
  margin: 5px;
  max-width: none;
  border: none;
  border-radius: 0px;
  border-top: 1px solid var(--c-border);
}

.card-header {
  font-size: 14px;
  padding: 15px 20px 5px 20px;
  margin-bottom: 10px;
  display: flex;
}

.el-avatar {
  margin-right: 10px;
}

.sidebar-card {
  border-radius: 12px;
}

.trending-item {
  padding: 12px 0;
  cursor: pointer;
  border-radius: 8px;
}

.trending-item:hover {
  background-color: #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-item {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
