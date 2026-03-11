<template>
  <el-scrollbar distance="200" @end-reached="loadMorePosts" style="height: 100vh">
    <div class="title-bar unselectable">
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
            style="padding-left: 10px; width: 50%; display: none"
          >
            <el-option label="全部" value=""></el-option>
            <el-option v-for="tag in tags" :label="tag.tag_name" :value="tag.tag_name" :key="tag.id"> </el-option>
          </el-select>
          <el-input-tag
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            v-model="searchConfig.query"
            trigger="Space"
            placeholder="搜索内容 或 #id"
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
        <div class="control-btn" @click="router.push('/settings')">
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
                <!----<el-dropdown-item command="profile">个人资料</el-dropdown-item>-->
                <el-dropdown-item command="logout" divided style="color: #f56c6c"> 退出登录 </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-button v-else link type="primary" plain @click="$router.push('/login')" class="border-none">
          登录
        </el-button>
      </div>
    </div>
    <div class="posts-container">
      <div v-for="post in posts" class="card" :key="post.id">
        <CollapsibleDiv max-height="500">
          <div class="card-header unselectable">
            <div style="display: flex">
              <UserAvatar :userid="post.userid" />
              <div style="flex: 1">
                <span> {{ post.username }} </span>
                <code class="card-id"> #{{ post.id }} </code>
                <el-icon :size="16" class="copy-btn" @click="copyText(post.text)">
                  <CopyDocument />
                </el-icon>
                <div>
                  <div class="header-badge" @click="handleFollowPost(post.id)">
                    {{ post.follownum }}
                    <el-icon :size="12">
                      <StarFilled v-if="post.is_follow" />
                      <Star v-else />
                    </el-icon>
                  </div>
                  <div class="header-badge" @click="handleLikePost(post.id)">
                    {{ post.likenum }}
                    <el-icon :size="12">
                      <IconRiHeartFill v-if="post.is_like" />
                      <IconRiHeartLine v-else />
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
                </div>
              </div>
            </div>
            <div style="margin: 10px 0 0 5px">
              <span class="tag" v-for="tag in post.tags" :key="tag">
                {{ tag }}
              </span>
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
  <el-backtop
    target="#app > div > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default > div > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
    :right="20"
    :bottom="30"
  >
  </el-backtop>

  <div v-if="editing" class="edit-panel acrylic unselectable">
    <div class="editor">
      <div style="margin: 10px 0 0 10px">
        <el-icon size="20" @click="editing = false">
          <Close />
        </el-icon>
      </div>
      <AutoCompleteTagInput v-model="selectedTags" :suggestions="tagSuggestions" />
      <MarkdownEditor v-model="content">
        <div style="display: flex; align-items: baseline">
          <el-upload
            style="padding-top: 20px; flex: 1"
            v-model:file-list="fileList"
            action="/api/v2/files/upload"
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
              上传附件
            </el-button>
            <template #tip>
              <div class="el-upload__tip" style="color: white">文件小于 5MB.</div>
            </template>
          </el-upload>
          <div class="btn-panel">
            <el-button @click="editing = false" :disabled="content ? false : true" style="display: none">
              保存草稿
            </el-button>
            <el-button @click="submitPost" :disabled="content ? false : true"> 发布 </el-button>
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
            style="display: none"
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
      <el-scrollbar class="card-list" distance="100" @end-reached="loadMoreComments($event, currentPost.id)">
        <!-- 添加当前帖子的显示区域 -->
        <div class="card comment-card" v-if="currentPost">
          <CollapsibleDiv max-height="300">
            <div class="card-header unselectable">
              <div style="display: flex">
                <UserAvatar :userid="currentPost.userid" />
                <div style="flex: 1">
                  <span> {{ currentPost.username }} </span>
                  <code class="card-id"> #{{ currentPost.id }} </code>
                  <el-icon :size="16" class="copy-btn" @click="copyText(currentPost.text)">
                    <CopyDocument />
                  </el-icon>
                  <div>
                    <div class="header-badge" @click="handleFollowPost(currentPost.id)">
                      {{ currentPost.follownum }}
                      <el-icon :size="12">
                        <StarFilled v-if="currentPost.is_follow" />
                        <Star v-else />
                      </el-icon>
                    </div>
                    <div class="header-badge" @click="handleLikePost(currentPost.id)">
                      {{ currentPost.likenum }}
                      <el-icon :size="12">
                        <IconRiHeartFill v-if="currentPost.is_like" />
                        <IconRiHeartLine v-else />
                      </el-icon>
                    </div>
                    <div class="header-badge" v-if="currentPost.reply">
                      {{ currentPost.reply }}
                      <el-icon :size="12">
                        <ChatLineRound />
                      </el-icon>
                    </div>
                    <span>
                      {{ formatTime(currentPost.timestamp).relativeTime }}
                      {{ formatTime(currentPost.timestamp).formattedTime }}
                    </span>
                    &nbsp;
                    <el-tag v-if="currentPost.tag">
                      {{ currentPost.tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div style="margin: 10px 0 0 5px">
                <span class="tag" v-for="tag in currentPost.tags" :key="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
            <MarkdownRenderer :dark-mode="isDark" :content="currentPost.text" />
          </CollapsibleDiv>
        </div>
        <div v-for="comment in comments" class="card comment-card" :key="comment.cid">
          <CollapsibleDiv
            max-height="300"
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
          >
            <div class="card-header unselectable">
              <div style="display: flex">
                <UserAvatar :userid="comment.userid" />
                <div style="flex: 1">
                  <span> {{ comment.username }} </span>
                  <el-icon :size="16" class="copy-btn" @click="copyText(comment.text)">
                    <CopyDocument />
                  </el-icon>
                  <div>
                    <div class="header-badge" @click="handleLikeComment(comment.cid)">
                      {{ comment.likenum }}
                      <el-icon :size="12">
                        <IconRiHeartFill v-if="comment.is_like" />
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
            <span v-if="comment.quote" style="font-size: 14px; color: var(--c-secondary)">
              {{ `@${comment.quote.username}: ` }}
            </span>
            <MarkdownRenderer :dark-mode="isDark" :content="comment.text" />
          </CollapsibleDiv>
        </div>
        <div v-if="endOfComments" class="end-flag">
          <span> 加载完毕 </span>
        </div>
      </el-scrollbar>
      <el-backtop
        target="#app > div > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default > div > div.comment-panel.acrylic > div.el-scrollbar.card-list > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
        :right="20"
        :bottom="60"
      >
      </el-backtop>
      <transition name="slide" mode="out-in">
        <div class="reply-simp" v-if="!editReply" key="simp">
          <div style="flex: 1">
            <div v-if="quote">
              <span style="font-size: 14px; color: var(--c-secondary)">
                {{ `@${quoteName}: ` }}
              </span>
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
          <div style="width: 100%; display: flex; flex-direction: column-reverse">
            <MarkdownEditor v-model="content">
              <div style="display: flex; align-items: baseline; padding: 5px">
                <el-upload
                  v-model:file-list="fileList"
                  action="/api/v2/files/upload"
                  :show-file-list="false"
                  :on-success="handleUploadSuccess"
                  style="flex: 1"
                >
                  <el-button>
                    <el-icon>
                      <Link />
                    </el-icon>
                    上传附件
                  </el-button>
                </el-upload>
                <el-button style="width: 100px; background: var(--c-card)" @click="submitComment(currentPost.id)">
                  <el-icon>
                    <Promotion />
                  </el-icon>
                </el-button>
                <el-icon @click="editReply = false" style="padding-left: 20px">
                  <ArrowDownBold />
                </el-icon>
              </div>
            </MarkdownEditor>
            <div v-if="quote">
              <span style="font-size: 14px; color: var(--c-secondary)">
                {{ `@${quoteName}: ` }}
              </span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
  <!-- 设置密码弹窗 -->
  <el-dialog v-model="showSetPasswordDialog" title="设置密码" width="500" align-center>
    <el-form :model="passwordForm" label-width="auto">
      <el-form-item label="新密码">
        <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入至少6位密码" />
      </el-form-item>
      <el-form-item label="确认密码">
        <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showSetPasswordDialog = false">稍后设置</el-button>
        <el-button type="primary" @click="setPassword">提交</el-button>
      </div>
    </template>
  </el-dialog>

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
import { formatTime, sha256 } from "../utils";
import { onBeforeMount } from "vue";
import { ElMessage } from "element-plus";
import UserAvatar from "../components/UserAvatar.vue";
// 导入 AutoCompleteTagInput 组件
import AutoCompleteTagInput from "../components/AutoCompleteTagInput.vue";

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
  query: [],
});

const posts = ref([]);
const browseType = ref("posts");
const comments = ref([]);
const AscSort = ref(true);

const content = ref("");
// 将原来的单个 tag 改为 selectedTags 数组
const selectedTags = ref([]);
const editing = ref(false);

const currentPost = ref(null);
const endOfPosts = ref(false);
const endOfComments = ref(false);
const quote = ref(null);
const quoteName = ref("");

const editReply = ref(false);

// 添加密码设置相关状态
const showSetPasswordDialog = ref(false);
const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

const fileList = ref([]);

// 用于 AutoCompleteTagInput 的 suggestions 格式
const tagSuggestions = ref([]);

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
  if (["png", "jpg", "jpeg", "gif", "webp", "eps", "svg", "bmp", "ico", "tiff"].includes(response.ext)) {
    content.value += `\n![${uploadFile.name}](/api/v2/static${response.url})\n`;
  } else {
    content.value += `\n[${uploadFile.name}](/api/v2/static${response.url})\n`;
  }

  console.log(response, uploadFile, uploadFiles);
};

const handleExceed = (files, uploadFiles) => {
  ElMessage.warning(
    `you selected ${files.length} files this time, add up to ${files.length + uploadFiles.length} totally`
  );
};

const handleFollow = async (id) => {
  try {
    const res = await requestApi(`/api/v2/forum/follow/${id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

const handleLikePost = async (id) => {
  try {
    const res = await requestApi(`/api/v2/forum/like/${id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const post = posts.value.find((p) => p.id === id);
    if (post) {
      post.is_like = !post.is_like;
      post.likenum = post.is_like ? post.likenum + 1 : post.likenum - 1;
    }
  } catch (err) {
    console.error("Like post failed:", err);
    ElMessage.error("点赞操作失败");
  }
};

const handleFollowPost = async (id) => {
  try {
    const res = await requestApi(`/api/v2/forum/follow/${id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const post = posts.value.find((p) => p.id === id);
    if (post) {
      post.is_follow = !post.is_follow;
      post.follownum = post.is_follow ? post.follownum + 1 : post.follownum - 1;
    }
  } catch (err) {
    console.error("Follow post failed:", err);
    ElMessage.error("关注操作失败");
  }
};

const handleLikeComment = async (id) => {
  try {
    const res = await requestApi(`/api/v2/forum/comment/like/${id}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // 更新本地状态
    const comment = comments.value.find((c) => c.cid === id);
    if (comment) {
      comment.is_like = !comment.is_like;
      comment.likenum = comment.is_like ? comment.likenum + 1 : comment.likenum - 1;
    }
  } catch (err) {
    console.error("Like comment failed:", err);
    ElMessage.error("点赞操作失败");
  }
};

const fetchConfig = async () => {
  try {
    const res = await requestApi("/api/v2/forum/tags");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    tags.value = data.data;
    // 转换为 AutoCompleteTagInput 需要的格式
    tagSuggestions.value = data.data.map((tag) => ({ value: tag.tag_name }));
    console.log(tagSuggestions.value);
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

// 添加检查用户密码状态的函数
const checkUserPasswordStatus = async () => {
  if (!userStore.isLoggedIn) return;

  try {
    const res = await requestApi("/api/v2/user/me");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 检查 has_password 字段
    if (data.data && data.data.has_password === false) {
      ElMessage.warning("您尚未设置密码，请尽快设置以保障账户安全");
      showSetPasswordDialog.value = true;
    }
  } catch (err) {
    console.error("Check user password status failed:", err);
  }
};

const fetchPosts = async (config = { tag: "", query: [] }) => {
  try {
    const params = new URLSearchParams();

    // 处理搜索查询数组
    const hashQuery = config.query.find((item) => typeof item === "string" && item.trim().startsWith("#"));
    if (hashQuery) {
      // 如果有 # 开头的查询，只取第一个这样的元素查询单个帖子
      const trimmedHashQuery = hashQuery.trim();
      if (/^#\d+$/.test(trimmedHashQuery)) {
        const postId = trimmedHashQuery.slice(1);
        const res = await requestApi(`/api/v2/forum/posts/${postId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        posts.value = [data.data];
        endOfPosts.value = true;
        return;
      }
    } else {
      // 如果没有 # 开头的查询，处理关键词搜索
      const keywords = config.query
        .filter((item) => typeof item === "string" && item.trim() && !item.trim().startsWith("#"))
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (keywords.length > 0) {
        // 将关键词添加到参数中，每个关键词作为一个 keyword 参数
        keywords.forEach((keyword) => {
          params.append("keyword", keyword);
        });
      }
    }

    // 添加标签参数（仅在非关注模式下）
    if (config.tag && browseType.value !== "follow") {
      params.append("tag", config.tag);
    }

    // 默认不传 begin 参数（相当于第一页）
    params.append("limit", "10");

    let apiUrl;
    if (browseType.value === "follow") {
      // 关注模式使用不同的API端点
      apiUrl = `/api/v2/forum/follow?${params.toString()}`;
    } else {
      // 普通模式
      apiUrl = `/api/v2/forum/posts?${params.toString()}`;
    }

    const res = await requestApi(apiUrl);
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
    const res = await requestApi(`/api/v2/forum/comments/${id}?limit=10&sort=${AscSort.value ? "asc" : "desc"}`);
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
      const params = new URLSearchParams();
      params.append("limit", "10");
      params.append("begin", posts.value.at(-1).id);

      // 添加标签参数（仅在非关注模式下）
      if (searchConfig.value.tag && browseType.value !== "follow") {
        params.append("tag", searchConfig.value.tag);
      }

      // 处理搜索查询数组（分页时不应该有 # 查询，因为 # 查询只返回单个帖子）
      const keywords = searchConfig.value.query
        .filter((item) => typeof item === "string" && item.trim() && !item.trim().startsWith("#"))
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (keywords.length > 0) {
        // 将关键词添加到参数中，每个关键词作为一个 keyword 参数
        keywords.forEach((keyword) => {
          params.append("keyword", keyword);
        });
      }

      let apiUrl;
      if (browseType.value === "follow") {
        // 关注模式使用不同的API端点
        apiUrl = `/api/v2/forum/follow?${params.toString()}`;
      } else {
        // 普通模式
        apiUrl = `/api/v2/forum/posts?${params.toString()}`;
      }

      const res = await requestApi(apiUrl);
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
      const res = await requestApi(`/api/v2/forum/comments/${id}?limit=10&begin=${comments.value.at(-1).cid}`);
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
    const res = await requestApi("/api/v2/forum/posts", {
      method: "POST",
      body: JSON.stringify({
        text: content.value,
        // 将 selectedTags 作为 tags 字段发送
        tags: selectedTags.value,
      }),
    });
    if (!res.ok) throw new Error("上传失败");
    editing.value = false;
    content.value = "";
    selectedTags.value = [];
  } catch (err) {
    ElMessage.error(err.message || "网络错误");
    console.error(err);
  } finally {
    fetchPosts();
    endOfPosts.value = false;
  }
};

// 修改 submitComment 函数
const submitComment = async (id) => {
  console.log(content.value);
  console.log(quote.value);
  try {
    const res = await requestApi("/api/v2/forum/comments", {
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

// 添加设置密码函数
const setPassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error("两次输入的密码不一致");
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    ElMessage.error("密码长度至少6位");
    return;
  }

  try {
    const res = await requestApi("/api/v2/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        // 由于是首次设置密码，没有旧密码，所以 oldPassword 传空字符串或特殊标记
        oldPassword: await sha256("", "hello_pkuphysu"),
        newPassword: await sha256(passwordForm.newPassword, "hello_pkuphysu"),
      }),
    });

    const result = await res.json();
    if (res.ok) {
      ElMessage.success("密码设置成功");
      showSetPasswordDialog.value = false;
      // 重置表单
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
    } else {
      ElMessage.error(result.message || "设置密码失败");
    }
  } catch (err) {
    ElMessage.error("网络错误");
    console.error(err);
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
  // 添加检查用户密码状态
  checkUserPasswordStatus();
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
  top: 0px;
  left: 0;
  width: 100%;
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
  padding-top: 10px;
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

:deep(.el-input-tag__wrapper) {
  box-shadow: none !important;
  background-color: transparent !important;
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
  align-content: center;
  overflow: auto;
}

.editor {
  margin: 0 50px;
  padding: 8px;
  align-content: center;
  background: var(--c-background);
  border-radius: 6px;
}

:deep(.el-tabs) {
  max-height: 100%;
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

.tag {
  font-size: 14px;
  background: var(--gray-2);
  padding: 2px 12px;
  margin: 0 12px 8px 0;
  border: 1px solid var(--gray-2);
  border-radius: 9999px;
}

.comment-card {
  margin: 5px;
  max-width: none;
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

.card:not(.comment-card):hover {
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
    margin: 0px 5px;
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
