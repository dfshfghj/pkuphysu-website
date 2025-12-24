<template>
  <el-scrollbar
    distance="500"
    @end-reached="loadMorePosts"
    style="height: 100vh"
  >
    <div class="title-bar unselectable">
      <div class="aux-margin">
        <div class="title">
          <img
            src="../assets/logo_white.svg"
            class="logo"
            v-if="isDark"
            @click="router.push('/')"
          />
          <img
            src="../assets/logo_black.svg"
            class="logo"
            v-else
            @click="router.push('/')"
          />
          <h4>交流论坛</h4>
        </div>
      </div>
      <div class="control-bar">
        <div
          class="control-btn"
          @click="
            browseType = 'posts';
            endOfPosts = false;
            fetchPosts();
          "
        >
          <el-icon :size="20">
            <Refresh />
          </el-icon>
          <span class="control-btn-label">最新</span>
        </div>
        <div
          class="control-btn"
          @click="
            browseType = 'follow';
            fetchPosts();
          "
        >
          <el-icon :size="20">
            <Star />
          </el-icon>
          <span class="control-btn-label">关注</span>
        </div>
        <div class="control-search">
          <el-select
            v-model="searchConfig.tag"
            placeholder="选择分类"
            style="padding-left: 10px; width: 50%"
          >
            <el-option label="全部" value=""></el-option>
            <el-option
              v-for="tag in tags"
              :label="tag.tag_name"
              :value="tag.tag_name"
              :key="tag.id"
            >
            </el-option>
          </el-select>
          <el-input
            v-model="searchConfig.query"
            placeholder="搜索内容 或 #PID"
          />
          <el-icon :size="20" @click="fetchPosts((config = searchConfig))">
            <Search />
          </el-icon>
        </div>
        <div class="control-btn" @click="editing = true">
          <el-icon :size="20">
            <Plus />
          </el-icon>
          <span class="control-btn-label">发布</span>
        </div>
        <div class="control-btn">
          <el-icon :size="20">
            <Message />
          </el-icon>
          <span class="control-btn-label">消息</span>
        </div>
        <div class="control-btn">
          <el-icon :size="20">
            <Setting />
          </el-icon>
          <span class="control-btn-label">设置</span>
        </div>
        <div v-if="userStore.isLoggedIn" style="display: flex">
          <el-dropdown @command="handleCommand">
            <UserAvatar />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item
                  command="logout"
                  divided
                  style="color: #f56c6c"
                >
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-button
          v-else
          link
          type="primary"
          plain
          @click="$router.push('/login')"
          class="border-none"
        >
          登录
        </el-button>
      </div>
    </div>
    <div class="posts-container">
      <div v-for="post in posts" class="card" :key="post.id">
        <CollapsibleDiv max-height="500">
          <div class="card-header unselectable">
            <UserAvatar :userid="post.userid" />
            <div style="flex: 1">
              <span> {{ post.username }} </span>
              <code class="card-id"> #{{ post.id }} </code>
              <el-icon :size="16" class="copy-btn" @click="copyText(post.text)">
                <CopyDocument />
              </el-icon>
              <div>
                <div class="header-badge" v-if="post.likenum">
                  {{ post.likenum }}
                  <el-icon :size="12">
                    <StarFilled v-if="post.is_follow" />
                    <Star v-else />
                  </el-icon>
                </div>
                <div class="header-badge" v-if="post.reply">
                  {{ post.reply }}
                  <el-icon :size="12">
                    <ChatLineRound />
                  </el-icon>
                </div>
                <span>
                  {{ formatTime(post.timestamp).relativeTime }}
                  {{ formatTime(post.timestamp).formattedTime }}
                </span>
                &nbsp;
                <el-tag v-if="post.tag"> {{ post.tag }} </el-tag>
              </div>
            </div>
          </div>
          <MarkdownRenderer
            :dark-mode="isDark"
            :content="post.text"
            @click="
              fetchComments(post.id);
              currentPost = post;
              content = '';
              quote = null;
              quoteName = null;
            "
          />
        </CollapsibleDiv>
      </div>
      <div v-if="endOfPosts" class="end-flag">
        <span> 加载完毕 </span>
      </div>
    </div>
  </el-scrollbar>

  <div v-if="editing" class="edit-panel acrylic unselectable">
    <div class="editor">
      <MarkdownEditor v-model="content">
        <div style="display: flex; align-items: baseline">
          <el-upload
            style="padding-top: 20px; flex: 1"
            v-model:file-list="fileList"
            action="/api/files/upload"
            :on-preview="handlePreview"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :limit="50"
            :on-exceed="handleExceed"
          >
            <el-button>
              <el-icon>
                <Link />
              </el-icon>
              上传文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip" style="color: white">
                files with a size less than 5MB.
              </div>
            </template>
          </el-upload>
          <div class="btn-panel">
            <el-button @click="editing = false"> 取消编辑 </el-button>
            <el-button
              @click="editing = false"
              :disabled="content ? false : true"
            >
              保存草稿
            </el-button>
            <el-select v-model="tag" placeholder="选择tag" style="width: 100px">
              <el-option
                v-for="tag in tags"
                :label="tag.tag_name"
                :value="tag.tag_name"
                :key="tag.id"
              >
              </el-option>
            </el-select>
            <el-button @click="submitPost" :disabled="content ? false : true">
              发布
            </el-button>
          </div>
        </div>
      </MarkdownEditor>
    </div>
  </div>
  <transition name="slide-from-side">
    <div v-if="currentPost" class="comment-panel acrylic">
      <div
        class="shadow"
        @click="
          currentPost = null;
          comments = [];
          endOfComments = false;
          editReply = false;
        "
      ></div>
      <div
        style="
          width: 100%;
          background-color: var(--c-card);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border-radius: 0 0 0 5px;
          border: 1px solid var(--c-border);
        "
        class="unselectable"
      >
        <div>
          <el-icon
            @click="
              currentPost = null;
              comments = [];
              endOfComments = false;
              editReply = false;
            "
          >
            <Close />
          </el-icon>
          <b
            ><code> POST #{{ currentPost.id }}</code></b
          >
        </div>
        <div style="display: flex; align-items: center; margin-right: 20px">
          <div class="control-btn" @click="fetchComments(currentPost.id)">
            <el-icon>
              <Refresh />
            </el-icon>
            <span> 刷新 </span>
          </div>
          <div
            class="control-btn"
            @click="
              handleFollow(currentPost.id);
              currentPost.is_follow = !currentPost.is_follow;
            "
          >
            <el-icon>
              <StarFilled v-if="currentPost.is_follow" />
              <Star v-else />
            </el-icon>
            <span> 关注 </span>
          </div>
          <div
            class="control-btn"
            @click="
              AscSort = !AscSort;
              fetchComments(currentPost.id);
            "
          >
            <el-icon>
              <Histogram />
            </el-icon>
            <span> {{ AscSort ? "顺序" : "逆序" }} </span>
          </div>
        </div>
      </div>
      <el-scrollbar
        class="card-list"
        distance="300"
        @end-reached="loadMoreComments($event, currentPost.id)"
      >
        <div
          v-for="comment in comments"
          class="card comment-card"
          :key="comment.cid"
        >
          <CollapsibleDiv max-height="300">
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
        <div v-if="endOfComments" class="end-flag">
          <span> 加载完毕 </span>
        </div>
      </el-scrollbar>
      <transition name="slide" mode="out-in">
        <div class="reply-simp" v-if="!editReply" key="simp">
          <div style="flex: 1">
            <div v-if="quote">
              <span> {{ `@${quoteName}: ` }} </span>
            </div>
            <div class="reply-btn unselectable" @click="editReply = true">
              <span> {{ content ? content : "评论" }} </span>
            </div>
          </div>
          <el-icon @click="editReply = true">
            <ArrowUpBold />
          </el-icon>
        </div>
        <div class="reply unselectable" v-else key="full">
          <div
            style="width: 100%; display: flex; flex-direction: column-reverse"
          >
            <MarkdownEditor v-model="content">
              <div style="display: flex; align-items: baseline; padding: 5px">
                <el-upload
                  v-model:file-list="fileList"
                  action="/api/files/upload"
                  :show-file-list="false"
                  :on-success="handleUploadSuccess"
                  style="flex: 1"
                >
                  <el-button>
                    <el-icon>
                      <Link />
                    </el-icon>
                    上传文件
                  </el-button>
                </el-upload>
                <el-button
                  style="width: 100px; background: var(--c-card)"
                  @click="submitComment(currentPost.id)"
                >
                  <el-icon>
                    <Promotion />
                  </el-icon>
                </el-button>
                <el-icon @click="editReply = false" style="padding-left: 20px">
                  <ArrowDownBold />
                </el-icon>
              </div>
            </MarkdownEditor>
          </div>
        </div>
      </transition>
    </div>
  </transition>
  <div class="bg-img"></div>
</template>

<script setup>
import {
  Promotion,
  Close,
  Refresh,
  Star,
  Search,
  Message,
  Setting,
  Plus,
  ChatLineRound,
  Histogram,
  StarFilled,
  Link,
  ArrowUpBold,
  ArrowDownBold,
  CopyDocument,
} from "@element-plus/icons-vue";
import MarkdownEditor from "../components/MarkdownEditor-v2.vue";
import MarkdownRenderer from "../components/MarkdownRenderer.vue";
import CollapsibleDiv from "../components/CollapsibleDiv.vue";
import { isDark } from "../composables/theme";
import { useUserStore } from "../stores/user";
import { requestApi } from "../api/api";
import { formatTime } from "../utils";
import { onBeforeMount } from "vue";
import { ElMessage } from "element-plus";
import UserAvatar from "../components/UserAvatar.vue";

const router = useRouter();
const userStore = useUserStore();

const tags = ref([]);

const copyText = async (text) => {
  if (!navigator.clipboard) return alert("当前浏览器环境不支持复制");
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("复制成功");
  } catch {
    ElMessage.error("复制失败");
  }
};

const searchConfig = ref({
  mode: "page",
  count: 1,
  tag: "",
  query: "",
});

const posts = ref([]);
const browseType = ref("posts");
const comments = ref([]);
const AscSort = ref(true);

const content = ref("");
const tag = ref("");
const editing = ref(false);

const currentPost = ref(null);
const endOfPosts = ref(false);
const endOfComments = ref(false);
const quote = ref(null);
const quoteName = ref("");

const editReply = ref(false);

const fileList = ref([]);

const windowWidth = ref(window.innerWidth);

const handleCommand = (command) => {
  if (command === "logout") {
    userStore.logout();
    ElMessage.success("已退出登录");
    router.push("/login");
  } else if (command === "profile") {
    router.push("/profile");
  }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const handleRemove = (file, uploadFiles) => {
  console.log(file, uploadFiles);
};

const handlePreview = (uploadFile) => {
  console.log(uploadFile);
};

const handleUploadSuccess = (response, uploadFile, uploadFiles) => {
  if (
    response.ext in
    [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".eps",
      ".svg",
      ".bmp",
      ".ico",
      ".tiff",
    ]
  ) {
    content.value += `\n![${uploadFile.name}](/api${response.url})\n`;
  } else {
    content.value += `\n[${uploadFile.name}](/api${response.url})\n`;
  }

  console.log(response, uploadFile, uploadFiles);
};

const handleExceed = (files, uploadFiles) => {
  ElMessage.warning(
    `you selected ${files.length} files this time, add up to ${
      files.length + uploadFiles.length
    } totally`,
  );
};

const handleFollow = async (id) => {
  try {
    const res = await requestApi(`/api/blogs/follow/${id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

const fetchConfig = async () => {
  try {
    const res = await requestApi("/api/blogs/tags");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    tags.value = data.data;
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

const fetchPosts = async (
  config = { mode: "page", count: 1, tag: "", query: "" },
) => {
  try {
    config.pid = "";
    config.keyword = "";
    const trimmedQuery = config.query.trim();
    if (/^#\d+$/.test(trimmedQuery)) {
      config.pid = trimmedQuery.slice(1);
    } else if (trimmedQuery) {
      config.keyword = trimmedQuery;
    }
    const res = await requestApi(
      `/api/blogs/${browseType.value}?limit=10&${config.mode}=${config.count}&tag=${config.tag}&pid=${config.pid}&keyword=${config.keyword}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 10) {
      endOfPosts.value = true;
    }

    posts.value = data.data;
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

    comments.value = data.data;
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

const loadMorePosts = async (direction) => {
  if (direction === "bottom" && !endOfPosts.value) {
    try {
      const res = await requestApi(
        `/api/blogs/${browseType.value}?limit=10&begin=${posts.value.at(-1).id}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      posts.value = [...posts.value, ...data.data];
      if (data.data.length < 10) {
        endOfPosts.value = true;
      }
    } catch (err) {
      console.error("Fetch posts failed:", err);
    }
  }
};

const loadMoreComments = async (direction, id) => {
  if (direction === "bottom" && !endOfComments.value) {
    try {
      const res = await requestApi(
        `/api/blogs/comments/${id}?limit=10&begin=${comments.value.at(-1).cid}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      comments.value = [...comments.value, ...data.data];
      if (data.data.length < 10) {
        endOfComments.value = true;
      }
    } catch (err) {
      console.error("Fetch posts failed:", err);
    }
  }
};

const submitPost = async () => {
  console.log(content.value);
  if (!content.value) {
    ElMessage.error("不能为空");
    return;
  }
  try {
    const res = await requestApi("/api/blogs/submit", {
      method: "POST",
      body: JSON.stringify({
        text: content.value,
        type: "text",
        tag: tag.value,
      }),
    });
    if (!res.ok) throw new Error("上传失败");
    editing.value = false;
    content.value = "";
    tag.value = "";
  } catch (err) {
    ElMessage.error(err.message || "网络错误");
    console.error(err);
  } finally {
    fetchPosts();
    endOfPosts.value = false;
  }
};

const submitComment = async (id) => {
  console.log(content.value);
  try {
    const res = await requestApi("/api/blogs/comments", {
      method: "POST",
      body: JSON.stringify({
        text: content.value,
        pid: id,
        quote: quote.value,
      }),
    });
    if (!res.ok) throw new Error("上传失败");
    editing.value = false;
    content.value = "";
  } catch (err) {
    ElMessage.error(err.message || "网络错误");
    console.error(err);
  } finally {
    fetchComments(id);
  }
};

// 引用外部图片绕过防盗链
onBeforeMount(() => {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "no-referrer";
  document.head.appendChild(meta);
});
onMounted(() => {
  window.addEventListener("resize", handleResize);
  fetchPosts();
  fetchConfig();
});

onUnmounted(() => {
  const meta = document.querySelector('meta[name="referrer"]');
  if (meta) meta.remove();
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
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

.card:hover .copy-btn {
  color: var(--c-text);
}

.comment-panel {
  user-select: text;
  position: fixed;
  top: 0;
  height: 100%;
  left: calc(100% - 550px);
  width: 550px;
  display: flex;
  flex-direction: column;
  z-index: 150;
}

.comment-panel :deep(.markdown-body) {
  padding-left: 30px;
  padding-right: 30px;
}

.shadow {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: -1;
}

.reply,
.reply-simp {
  box-sizing: border-box;
  display: flex;
  padding: 2px;
  background: var(--c-card);
  border-top: 1px solid var(--c-border);
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.slide-from-side-enter-active,
.slide-from-side-leave-active {
  transition: all 0.3s ease;
}

.slide-from-side-enter-from,
.slide-from-side-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.reply-simp {
  padding: 10px;
  align-items: center;
}

.reply-btn {
  padding: 5px;
  padding-left: 15px;
  margin-right: 30px;
  background: var(--c-background);
  border: 1px solid var(--c-border);
  border-radius: 9999px;
  -webkit-box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
  font-size: 13px;
}

.reply:deep(.vditor-editor) {
  max-height: 300px;
}

.editor:deep(.vditor-editor) {
  max-height: calc(100vh - 400px);
}

.card {
  padding: 0px;
  margin: 40px;
  border-radius: 5px;
  border: 1px solid var(--c-border);
  box-shadow: var(--c-box-shadow);
  transition: transform 0.3s ease;
  max-width: 500px;
  background-color: var(--c-card);
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

.card:hover {
  transform: translateX(5px);
}

.bg-img {
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("/images/bg.webp") center center / cover rgb(255, 255, 255);
}

@media (max-width: 768px) {
  .editor {
    padding: 100px 5px 0px 5px;
  }

  .btn-panel {
    text-align: center;
  }

  .card {
    margin: 5px;
  }

  .card:hover {
    transform: none;
  }

  .control-btn-label {
    display: none;
  }

  .comment-panel {
    left: 27px;
    width: calc(100% - 27px);
  }
}
</style>
