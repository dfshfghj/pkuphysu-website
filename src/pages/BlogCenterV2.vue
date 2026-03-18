<template>
  <div class="flex">
    <div class="bg-(--c-sidebar) hidden sm:flex flex-col">
      <div
        class="control-btn sm:font-serif font-bold pt-5"
        @click="
          browseType = 'posts';
          endOfPosts = false;
          searchConfig.query = [];
          fetchPosts();
          scrollToTop();
        "
      >
        <el-icon :size="20">
          <Refresh />
        </el-icon>
        <span class="control-btn-label">最新</span>
      </div>
      <div
        class="control-btn sm:font-serif font-bold pt-5"
        @click="
          browseType = 'follow';
          fetchPosts();
          scrollToTop();
        "
      >
        <el-icon :size="20">
          <Star />
        </el-icon>
        <span class="control-btn-label">关注</span>
      </div>
      <div class="control-btn sm:font-serif font-bold pt-5" @click="editing = true">
        <el-icon :size="20">
          <Plus />
        </el-icon>
        <span class="control-btn-label">发布</span>
      </div>
      <div class="control-btn sm:font-serif font-bold pt-5">
        <el-icon :size="20">
          <Message />
        </el-icon>
        <span class="control-btn-label">消息</span>
      </div>
      <div class="control-btn sm:font-serif font-bold pt-5" @click="router.push('/settings')">
        <el-icon :size="20">
          <Setting />
        </el-icon>
        <span class="control-btn-label">设置</span>
      </div>
      <div class="flex-1" id="space"></div>
      <div v-if="userStore.isLoggedIn" class="control-btn mb-4 pl-3">
        <el-dropdown @command="handleCommand">
          <UserAvatar />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings"> 个人设置 </el-dropdown-item>
              <el-dropdown-item command="logout" divided style="color: #f56c6c"> 退出登录 </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <h3 class="sm:font-serif control-btn-label w-25 whitespace-nowrap overflow-hidden text-ellipsis">
          {{ userStore.username }}
        </h3>
      </div>
      <el-button v-else link type="primary" plain @click="$router.push('/login')" class="border-none"> 登录 </el-button>
    </div>
    <el-scrollbar
      ref="mainScrollbar"
      class="trans h-screen! flex-1"
      :class="!currentPost ? 'active' : ''"
      distance="400"
      @end-reached="loadMorePosts"
      v-show="!currentPost"
    >
      <el-backtop
        target="#app > div > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default > div > div > div.el-scrollbar.active > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
        :right="20"
        :bottom="30"
      >
      </el-backtop>
      <div class="bg-(--c-sidebar) p-1 sticky top-0 z-999 hidden sm:block md:hidden">
        <div class="control-search p-1 m-2 bg-(--c-card)">
          <el-input-tag
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            v-model="searchConfig.query"
            trigger="Space"
            placeholder="搜索内容 或 #id 或 :tag"
          />
          <el-icon
            :size="20"
            @click="
              browseType = 'search';
              fetchPosts((config = searchConfig));
            "
          >
            <Search />
          </el-icon>
        </div>
      </div>
      <div
        class="text-(--c-title) pb-[0.7em] sticky top-0 left-0 w-full shadow-[0_0_25px_rgba(0,0,0,0.4)] bg-(--c-card) z-10 unselectable sm:hidden"
      >
        <div class="control-bar">
          <div
            class="control-btn p-2"
            @click="
              browseType = 'posts';
              endOfPosts = false;
              searchConfig.query = [];
              fetchPosts();
              scrollToTop();
            "
          >
            <el-icon :size="20">
              <Refresh />
            </el-icon>
            <span class="control-btn-label">最新</span>
          </div>
          <div
            class="control-btn p-2"
            @click="
              browseType = 'follow';
              fetchPosts();
              scrollToTop();
            "
          >
            <el-icon :size="20">
              <Star />
            </el-icon>
            <span class="control-btn-label">关注</span>
          </div>
          <div class="control-search flex-1">
            <el-input-tag
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
              v-model="searchConfig.query"
              trigger="Space"
              placeholder="搜索内容 或 #id 或 :tag"
            />
            <el-icon :size="20" @click="fetchPosts((config = searchConfig))">
              <Search />
            </el-icon>
          </div>
          <div class="control-btn p-2" @click="editing = true">
            <el-icon :size="20">
              <Plus />
            </el-icon>
            <span class="control-btn-label">发布</span>
          </div>
          <div class="control-btn p-2">
            <el-icon :size="20">
              <Message />
            </el-icon>
            <span class="control-btn-label">消息</span>
          </div>
          <div v-if="userStore.isLoggedIn" class="flex">
            <el-dropdown @command="handleCommand">
              <UserAvatar />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="settings"> 个人设置 </el-dropdown-item>
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
      <div class="min-h-lvh">
        <h2 class="sm:font-serif pl-6 mt-0 pt-6" v-if="browseType === 'follow'">关注</h2>
        <h2 class="sm:font-serif pl-6 mt-0 pt-6" v-else-if="browseType === 'search'">搜索结果</h2>
        <h2 class="sm:font-serif pl-6 mt-0 pt-6" v-else>主页</h2>
        <BlogPostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @card-click="
            fetchComments(post.id);
            currentPost = post;
            content = '';
            quote = null;
            quoteName = null;
          "
        />
      </div>
    </el-scrollbar>
    <el-scrollbar
      ref="commentScrollbar"
      class="trans h-screen! flex-1"
      :class="currentPost ? 'active' : ''"
      distance="400"
      @end-reached="loadMoreComments($event, currentPost.id)"
      v-if="currentPost"
    >
      <el-backtop
        target="#app > div > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default > div > div > div.el-scrollbar.active > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
        :right="20"
        :bottom="30"
      >
      </el-backtop>
      <div class="min-h-lvh">
        <h2 class="sm:font-serif pl-6 mt-0 pt-6">
          <el-icon :size="20" class="cursor-pointer" @click="currentPost = null">
            <ArrowLeftBold />
          </el-icon>
          详情
        </h2>
        <BlogPostCard :post="currentPost" />
        <div class="border-b border-(--c-border)"></div>

        <div class="flex pl-6 pt-3">
          <span class="text-lg sm:font-serif font-bold"> 评论 </span>
          <div
            class="control-btn text-sm pl-4"
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
        <BlogCommentCard
          v-for="comment in comments"
          :key="comment.cid"
          :comment="comment"
          @like-update="handleCommentLikeUpdate"
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
        <div class="text-center mt-5" v-if="comments.length === 0">
          <span class="text-sm"> 暂无更多评论 </span>
        </div>
        <div class="pb-50"></div>
        <BlogCommentEditor
          :post-id="currentPost.id"
          :quote="quote"
          :quote-name="quoteName"
          :dark-mode="isDark"
          @success="fetchComments(currentPost.id)"
        />
      </div>
    </el-scrollbar>
    <div class="bg-(--c-sidebar) flex-col trans w-3/10 border-l border-(--c-border) hidden md:flex">
      <div class="control-search p-1 m-3">
        <el-input-tag
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="3"
          v-model="searchConfig.query"
          trigger="Space"
          placeholder="搜索内容 或 #id 或 :tag"
        />
        <el-icon
          :size="20"
          @click="
            browseType = 'search';
            fetchPosts((config = searchConfig));
          "
        >
          <Search />
        </el-icon>
      </div>
      <div class="p-5">
        <h3 class="sm:font-serif">热门话题</h3>
        <div class="pl-8">
          <span> 暂无 </span>
        </div>
      </div>
      <div class="p-5">
        <h3 class="sm:font-serif">最近更新</h3>
        <div class="pl-8">
          <span> 暂无 </span>
        </div>
      </div>
      <div class="p-5">
        <h3 class="sm:font-serif">公告</h3>
        <div class="pl-8">
          <p>项目地址:</p>
          <p>
            <a class="no-underline text-(--c-text)!" href="https://github.com/dfshfghj/pkuphysu-website"
              >pkuphysu-website</a
            >,
            <a class="no-underline text-(--c-text)!" href="https://github.com/dfshfghj/pkuphysu-backend"
              >pkuphysu-backend</a
            >
          </p>
        </div>
      </div>
      <div class="flex-1"></div>
    </div>
  </div>
  <BlogPostEditor v-model:visible="editing" :dark-mode="isDark" @success="fetchPosts()" />
  <PasswordDialog @success="fetchPosts()" />

  <div class="bg-img"></div>
</template>

<script setup>
import { Star, Refresh, Search, Message, Plus, Histogram, Setting, ArrowLeftBold } from "@element-plus/icons-vue";
import BlogPostCard from "../components/blog-center/BlogPostCard.vue";
import BlogCommentCard from "../components/blog-center/BlogCommentCard.vue";
import BlogCommentEditor from "../components/blog-center/BlogCommentEditor.vue";
import BlogPostEditor from "../components/blog-center/BlogPostEditor.vue";
import PasswordDialog from "../components/blog-center/PasswordDialog.vue";
import { isDark } from "../composables/theme";
import { useUserStore } from "../stores/user";
import { requestApi } from "../api/api";
import { onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import UserAvatar from "../components/UserAvatar.vue";

const router = useRouter();
const userStore = useUserStore();

const mainScrollbar = ref();

const searchConfig = ref({
  mode: "page",
  count: 1,
  query: [],
});

const posts = ref([]);
const browseType = ref("posts");
const comments = ref([]);
const AscSort = ref(false);

const content = ref("");
const editing = ref(false);

const currentPost = ref(null);
const endOfPosts = ref(false);
const endOfComments = ref(false);
const quote = ref(null);
const quoteName = ref("");

const postsLoading = ref(false);
const commentsLoading = ref(false);

const handleCommand = (command) => {
  if (command === "logout") {
    userStore.logout();
    ElMessage.success("已退出登录");
    router.push("/login");
  } else {
    router.push(`/${command}`);
  }
};

const scrollToTop = () => {
  if (mainScrollbar.value) {
    mainScrollbar.value.scrollTo({ top: 0 });
  }
};

const fetchPosts = async (config = { tag: "", query: [] }) => {
  try {
    const params = new URLSearchParams();
    const hashQuery = config.query.find((item) => typeof item === "string" && item.trim().startsWith("#"));
    if (hashQuery) {
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
      const keywords = config.query
        .filter(
          (item) =>
            typeof item === "string" && item.trim() && !item.trim().startsWith("#") && !item.trim().startsWith(":")
        )
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (keywords.length > 0) {
        keywords.forEach((keyword) => {
          params.append("keyword", keyword);
        });
      }

      const tagQueries = config.query
        .filter((item) => typeof item === "string" && item.trim().startsWith(":"))
        .map((item) => item.trim().substring(1))
        .filter((item) => item.length > 0);

      if (tagQueries.length > 0) {
        tagQueries.forEach((tag) => {
          params.append("tag", tag);
        });
      }
    }

    if (config.tag && browseType.value !== "follow") {
      params.append("tag", config.tag);
    }

    params.append("limit", "20");

    let apiUrl;
    if (browseType.value === "follow") {
      apiUrl = `/api/v2/forum/follow?${params.toString()}`;
    } else {
      apiUrl = `/api/v2/forum/posts?${params.toString()}`;
    }

    const res = await requestApi(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 20) {
      endOfPosts.value = true;
    }

    posts.value = data.data;
  } catch {
    console.error("Fetch posts failed:");
  }
};

const fetchComments = async (id) => {
  try {
    endOfComments.value = false;
    const res = await requestApi(`/api/v2/forum/comments/${id}?limit=20&sort=${AscSort.value ? "asc" : "desc"}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data.length < 20) {
      endOfComments.value = true;
    }

    comments.value = data.data;
  } catch (err) {
    console.error("Fetch posts failed:", err);
  }
};

const loadMorePosts = async (direction) => {
  if (direction === "bottom" && !endOfPosts.value && !postsLoading.value) {
    postsLoading.value = true;
    try {
      const params = new URLSearchParams();
      params.append("limit", "20");
      params.append("begin", posts.value.at(-1).id);

      const keywords = searchConfig.value.query
        .filter(
          (item) =>
            typeof item === "string" && item.trim() && !item.trim().startsWith("#") && !item.trim().startsWith(":")
        )
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // 提取以冒号开头的tag查询
      const tagQueries = searchConfig.value.query
        .filter((item) => typeof item === "string" && item.trim().startsWith(":"))
        .map((item) => item.trim().substring(1)) // 去掉冒号前缀
        .filter((item) => item.length > 0);

      if (keywords.length > 0) {
        // 将关键词添加到参数中，每个关键词作为一个 keyword 参数
        keywords.forEach((keyword) => {
          params.append("keyword", keyword);
        });
      }

      // 将tag查询添加到参数中，每个tag作为一个 tag 参数
      if (tagQueries.length > 0) {
        tagQueries.forEach((tag) => {
          params.append("tag", tag);
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
      if (data.data.length < 20) {
        endOfPosts.value = true;
      }
    } catch {
      console.error("Fetch posts failed:");
    } finally {
      postsLoading.value = false;
    }
  }
};

const loadMoreComments = async (direction, id) => {
  if (direction === "bottom" && !endOfComments.value && !commentsLoading.value) {
    commentsLoading.value = true;
    try {
      const res = await requestApi(
        `/api/v2/forum/comments/${id}?limit=20&begin=${comments.value.at(-1).cid}&sort=${AscSort.value ? "asc" : "desc"}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      comments.value = [...comments.value, ...data.data];
      if (data.data.length < 20) {
        endOfComments.value = true;
      }
    } catch {
      console.error("Fetch posts failed:");
    } finally {
      commentsLoading.value = false;
    }
  }
};

const handleCommentLikeUpdate = (updatedComment) => {
  const index = comments.value.findIndex((comment) => comment.cid === updatedComment.cid);
  if (index !== -1) {
    // 创建新的评论对象，确保响应式更新
    comments.value[index] = {
      ...comments.value[index],
      is_like: updatedComment.is_like,
      likenum: updatedComment.likenum,
    };
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
  fetchPosts();
});

onUnmounted(() => {
  const meta = document.querySelector('meta[name="referrer"]');
  if (meta) meta.remove();
});
</script>

<style scoped>
.control-bar {
  line-height: 2em;
  padding-top: 10px;
  display: flex;
  align-items: center;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.control-btn-label {
  margin-left: 0.25rem;
  font-size: 20px;
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

.control-search {
  display: flex;
  align-items: center;
  border: 1px solid var(--c-border);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
}

:deep(.el-tabs) {
  max-height: 100%;
}

.end-flag {
  text-align: center;
  font-size: 18px;
  padding-top: 10px;
  padding-bottom: 20px;
}

.trans {
  background-color: color-mix(in srgb, var(--c-card), transparent 10%);
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

.editor:deep(.vditor-editor) {
  max-height: calc(100vh - 200px);
}

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

.bg-img {
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("/images/bg-light.webp") center center / cover rgb(255, 255, 255);
}

.dark .bg-img {
  background: url("/images/bg.webp") center center / cover rgb(255, 255, 255);
}

:deep(.vditor) {
  --panel-background-color: var(--c-card);
  --textarea-background-color: var(--c-card);
}

@media (max-width: 1036px) {
  .card {
    margin: 5px;
  }

  .control-btn-label {
    display: none;
  }
}
</style>
