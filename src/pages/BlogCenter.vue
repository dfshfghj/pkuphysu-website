<template>
  <div class="flex">
    <div class="bg-(--sidebar) hidden sm:flex flex-col">
      <div
        class="control-btn sm:font-serif font-bold pt-5"
        @click="
          forumStore.setBrowseType('posts');
          forumStore.resetSearchConfig();
          forumStore.fetchPosts();
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
          forumStore.setBrowseType('follow');
          forumStore.fetchPosts();
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
    <el-scrollbar ref="mainScrollbar" class="trans h-screen! flex-1" distance="400" @end-reached="loadMorePosts">
      <el-backtop
        target="#app > div > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default > div > div > div.el-scrollbar.active > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
        :right="20"
        :bottom="30"
      >
      </el-backtop>
      <div class="bg-(--sidebar) p-1 sticky top-0 z-999 hidden sm:block md:hidden">
        <div class="control-search p-1 m-2 bg-(--card)">
          <el-input-tag
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            v-model="forumStore.searchConfig.query"
            trigger="Space"
            placeholder="搜索内容 或 #id 或 :tag"
          />
          <el-icon
            :size="20"
            @click="
              forumStore.setBrowseType('search');
              forumStore.fetchPosts(forumStore.searchConfig);
            "
          >
            <Search />
          </el-icon>
        </div>
      </div>
      <div
        class="text-(--c-title) pb-[0.7em] sticky top-0 left-0 w-full shadow-[0_0_25px_rgba(0,0,0,0.4)] bg-(--card) z-10 unselectable sm:hidden"
      >
        <div class="control-bar">
          <div
            class="control-btn p-2"
            @click="
              forumStore.setBrowseType('posts');
              forumStore.resetSearchConfig();
              forumStore.fetchPosts();
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
              forumStore.setBrowseType('follow');
              forumStore.fetchPosts();
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
              v-model="forumStore.searchConfig.query"
              trigger="Space"
              placeholder="搜索内容 或 #id 或 :tag"
            />
            <el-icon :size="20" @click="forumStore.fetchPosts(forumStore.searchConfig)">
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
        <h2 class="sm:font-serif pl-6 mt-0 pt-6" v-if="forumStore.browseType === 'follow'">关注</h2>
        <h2 class="sm:font-serif pl-6 mt-0 pt-6" v-else-if="forumStore.browseType === 'search'">搜索结果</h2>
        <h2 class="sm:font-serif pl-6 mt-0 pt-6" v-else>主页</h2>
        <BlogPostCard
          v-for="post in forumStore.posts"
          :key="post.id"
          :post="post"
          @card-click="router.push(`/blog/${post.id}`)"
        />
      </div>
    </el-scrollbar>
    <div class="bg-(--sidebar) flex-col trans w-3/10 border-l border-(--c-border) hidden md:flex">
      <div class="control-search p-1 m-3">
        <el-input-tag
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="3"
          v-model="forumStore.searchConfig.query"
          trigger="Space"
          placeholder="搜索内容 或 #id 或 :tag"
        />
        <el-icon
          :size="20"
          @click="
            forumStore.setBrowseType('search');
            forumStore.fetchPosts(forumStore.searchConfig);
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
  <BlogPostEditor v-model:visible="editing" :dark-mode="isDark" @success="forumStore.fetchPosts()" />
  <PasswordDialog @success="forumStore.fetchPosts()" />

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
import { useForumStore } from "../stores/forum";
import { requestApi } from "../api/api";
import { onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import UserAvatar from "../components/UserAvatar.vue";

const router = useRouter();
const userStore = useUserStore();
const forumStore = useForumStore();

const mainScrollbar = ref();

const editing = ref(false);

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

const loadMorePosts = async (direction) => {
  if (direction === "bottom") {
    await forumStore.loadMorePosts();
  }
};

const loadNotifications = async () => {
  const res = await requestApi("/api/v2/notifications");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(data);
};

// 引用外部图片绕过防盗链
onBeforeMount(() => {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "no-referrer";
  document.head.appendChild(meta);
});
onMounted(() => {
  forumStore.fetchPosts();
  loadNotifications();
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
  background-color: color-mix(in srgb, var(--card), transparent 10%);
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
}

.dark .bg-img {
  background: url("/images/bg.webp") center center / cover rgb(255, 255, 255);
}

:deep(.vditor) {
  --panel-background-color: var(--card);
  --textarea-background-color: var(--card);
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
