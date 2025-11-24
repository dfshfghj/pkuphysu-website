<script setup>
import { requestApi } from "../api/api";
import { toggleDark, isDark } from "../composables/theme";
import { useUserStore } from "../stores/user";
import { Search, Plus } from "@element-plus/icons-vue";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();
const userStore = useUserStore();
const username = computed(() => userStore.username);
const isScrolled = ref(false);

const articles = ref([]);

const userAvatar = computed(() => {
  const path = `${API_BASE}/api/avatars/${username.value}`;
  return path + "?t=" + Date.now();
});

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const formattedTime = `${month}-${day} ${hours}:${minutes}`;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  let relativeTime;

  if (diffInSeconds < 60) {
    relativeTime = "刚刚";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    relativeTime = `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    relativeTime = `${hours}小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    relativeTime = `${days}天前`;
  } else if (diffInSeconds < 604800) {
    const weeks = Math.floor(diffInSeconds / 604800);
    relativeTime = `${weeks}周前`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    relativeTime = `${months}月前`;
  }

  return {
    formattedTime: formattedTime,
    relativeTime: relativeTime,
  };
}

const handleCommand = (command) => {
  if (command === "logout") {
    userStore.logout();
    ElMessage.success("已退出登录");
    router.push("/login");
  } else if (command === "profile") {
    router.push("/profile");
  }
};

const fetchArticles = async (config = { mode: "page", count: 1 }) => {
  try {
    const res = await requestApi(
      `/api/blogs/articles?limit=10&${config.mode}=${config.count}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    articles.value = data.data;
  } catch (err) {
    console.error("Fetch articles failed:", err);
  }
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 80;
};

const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleResize);
  fetchArticles();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <el-scrollbar style="height: 100vh">
    <div :class="['menu-wrapper acrylic', { scrolled: isScrolled }]">
      <el-menu
        :class="{ scrolled: isScrolled }"
        mode="horizontal"
        :ellipsis="false"
        router
        popper-class="acrylic"
      >
        <el-menu-item index="/">
          <div
            class="flex items-center justify-center gap-2"
            style="display: flex; align-items: center"
          >
            <img src="../assets/logo_white.svg" class="logo" v-if="isDark" />
            <img src="../assets/logo_black.svg" class="logo" v-else />
          </div>
          <b id="title"> 论坛 </b>
        </el-menu-item>
        <div class="control-search">
          <!---
                <el-select placeholder="选择分类" style="padding-left: 10px; width: 50%;">
                    <el-option label="全部" value="all"></el-option>
                </el-select>
                --->
          <el-input placeholder="搜索内容" />
          <el-icon :size="20">
            <Search />
          </el-icon>
        </div>
        <el-menu-item index="/new-article" id="submit">
          <el-icon :size="20">
            <Plus />
          </el-icon>
          <span class="control-btn-label">发布</span>
        </el-menu-item>
        <el-menu-item h="full" @click="toggleDark()" id="toggleDark">
          <button
            class="cursor-pointer border-none bg-transparent"
            style="height: var(--ep-menu-item-height); padding: none"
          >
            <el-icon-sunny v-if="!isDark" width="20px" height="20px" />
            <el-icon-moon v-else width="20px" height="20px" />
          </button>
        </el-menu-item>
        <el-menu-item>
          <div v-if="userStore.isLoggedIn" style="display: flex">
            <el-dropdown @command="handleCommand">
              <el-avatar :size="40" :src="userAvatar" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile"
                    >个人资料</el-dropdown-item
                  >
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
        </el-menu-item>
      </el-menu>
    </div>
    <div class="articles-container">
      <div v-for="article in articles" :key="article.id" style="width: 100%">
        <div
          class="article-card"
          @click="router.push(`/chat/articles/${article.id}`)"
        >
          <div class="card-body">
            <h3>{{ article.title }}</h3>
            <div
              v-if="windowWidth <= 768"
              style="display: flex; align-items: center; margin-bottom: 10px"
            >
              <div class="card-info">
                <el-avatar
                  :size="22"
                  :src="`${API_BASE}/api/avatars/${article.author}`"
                />
              </div>
              <span style="white-space: nowrap; font-size: 13px">
                {{ formatTime(article.timestamp).relativeTime }}
              </span>
            </div>
            <span style="font-size: 14px">
              {{ article.content.slice(0, 50) }}
              {{ article.content.length > 50 ? "..." : "" }}</span
            >
            <div v-if="windowWidth <= 768" style="margin: 10px">
              <span>
                {{ article.likenum }} 关注 &nbsp; 丨 &nbsp;
                {{ article.reply }} 评论
              </span>
            </div>
          </div>
          <div
            v-if="windowWidth > 768"
            style="display: flex; align-items: center"
          >
            <div class="card-info">
              <el-avatar
                :size="35"
                :src="`${API_BASE}/api/avatars/${article.author}`"
              />
            </div>
            <span style="white-space: nowrap; font-size: 13px">
              {{ formatTime(article.timestamp).relativeTime }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

:deep(.el-select__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

.control-search {
  max-width: 400px;
  display: flex;
  align-items: center;
  margin: 5px;
  padding: 2px 10px 2px 10px;
  border: 2px solid var(--c-border);
  border-radius: 9999px;
  flex: 1;
}

.articles-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 750px;
  background: var(--c-card);
  margin: 100px auto;
  border: 1px solid var(--c-border);
  border-radius: 5px 5px 0 0;
}

.article-card {
  padding: 5px;
  margin: 0 20px 0 20px;
  border-bottom: 1px solid var(--c-border);
  background-color: var(--c-card);
  display: flex;
  align-items: center;
  cursor: pointer;
  justify-content: space-between;
}

.card-info {
  display: flex;
  margin: 0 30px 0 30px;
}

.comment-card {
  margin: 5px;
  max-width: none;
}

.card-body {
  font-size: 14px;
}

@media (max-width: 768px) {
  .control-btn-label {
    display: none;
  }

  .el-menu-item {
    padding: 5px;
  }

  .articles-container {
    width: 100%;
    background: transparent;
    margin-top: 0;
  }

  .article-card {
    background: transparent;
  }

  .card-info {
    margin: 0 10px 0 0;
  }
}
</style>
