<template>
  <div class="flex">
    <div class="bg-sidebar hidden sm:flex flex-col lg:min-w-30">
      <div class="control-btn sm:font-serif font-bold pt-5" @click="goPosts">
        <el-icon :size="20">
          <Refresh />
        </el-icon>
        <span class="control-btn-label">最新</span>
      </div>
      <div class="flex-1" id="space"></div>
      <div class="control-btn mb-4 px-2">
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center bg-transparent border-0 cursor-pointer">
            <UserAvatar />
            <h3 class="sm:font-serif control-btn-label max-w-25 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ userStore.username }}
            </h3>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="router.push('/settings')"> 设置 </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              @click="
                userStore.logout();
                router.push('/login?redirect=/');
              "
            >
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div class="flex flex-col flex-1 min-w-0 h-screen">
      <div class="bg-sidebar p-1 sticky top-0 z-999 hidden sm:block md:hidden">
        <div class="control-search p-1 m-2 bg-card">
          <el-input-tag
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            v-model="treeholeStore.searchConfig.query"
            trigger="Space"
            placeholder="搜索内容 或 #id 或 :tag"
          />
          <el-icon :size="20" @click="navigateToSearch()">
            <Search />
          </el-icon>
        </div>
      </div>
      <div
        class="text-(--c-title) pb-[0.7em] sticky top-0 left-0 w-full shadow-[0_0_25px_rgba(0,0,0,0.4)] bg-card z-10 unselectable sm:hidden"
      >
        <div class="control-bar">
          <div class="control-btn p-2" @click="goPosts">
            <el-icon :size="20">
              <Refresh />
            </el-icon>
            <span class="control-btn-label">最新</span>
          </div>
          <div class="control-btn p-2" @click="goFollow">
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
              v-model="treeholeStore.searchConfig.query"
              trigger="Space"
              placeholder="搜索内容 或 #id 或 :tag"
            />
            <el-icon :size="20" @click="navigateToSearch()">
              <Search />
            </el-icon>
          </div>
          <div class="control-btn p-2" @click="editing = true">
            <el-icon :size="20">
              <Plus />
            </el-icon>
            <span class="control-btn-label">发布</span>
          </div>
          <div class="control-btn p-2" @click="router.push('/messages')">
            <el-icon :size="20">
              <Message />
            </el-icon>
            <span class="control-btn-label">消息</span>
          </div>
          <div v-if="userStore.isLoggedIn" class="flex">
            <DropdownMenu>
              <DropdownMenuTrigger class="flex items-center bg-transparent border-0 cursor-pointer">
                <UserAvatar />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem @click="router.push('/settings')"> 设置 </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="userStore.logout()">
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <el-button v-else link type="primary" plain @click="router.push('/login')" class="border-none">
            登录
          </el-button>
        </div>
      </div>
      <router-view v-slot="{ Component, route }">
        <keep-alive :include="['PostsView', 'FollowView']">
          <component :is="Component" :key="route.path" ref="currentPageRef" />
        </keep-alive>
      </router-view>
    </div>
    <div class="flex-col w-3/10 border-l border-(--c-border) hidden md:flex">
      <div class="control-search p-1 m-3">
        <el-input-tag
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="3"
          v-model="treeholeStore.searchConfig.query"
          trigger="Space"
          placeholder="搜索内容 或 #id 或 :tag"
        />
        <el-icon :size="20" @click="navigateToSearch()">
          <Search />
        </el-icon>
      </div>
      <Accordion type="single" collapsible class="p-5" default-value="item-3">
        <AccordionItem value="item-1">
          <AccordionTrigger>热门话题</AccordionTrigger>
          <AccordionContent>
            <p>暂无</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>最近更新</AccordionTrigger>
          <AccordionContent>
            <p>暂无</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>公告</AccordionTrigger>
          <AccordionContent>
            <p>项目地址:</p>
            <p>
              <a class="no-underline text-(--c-text)!" href="https://github.com/dfshfghj/pkuphysu-website"
                >pkuphysu-website</a
              >,
              <a class="no-underline text-(--c-text)!" href="https://github.com/dfshfghj/pkuphysu-backend"
                >pkuphysu-backend</a
              >
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div class="flex-1"></div>
    </div>
  </div>
  <PasswordDialog @success="treeholeStore.fetchPosts()" />

  <div class="bg-img"></div>
</template>

<script setup lang="ts">
import { Star, Refresh, Search, Message, Plus, Setting } from "@element-plus/icons-vue";
import PasswordDialog from "@/components/blog-center/PasswordDialog.vue";
import { isDark } from "@/composables/theme";
import { useUserStore } from "@/stores/user";
import { useTreeholeStore } from "@/stores/treehole";
import { onBeforeMount, onUnmounted, ref } from "vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar.vue";
import PostsView from "./PostsView.vue";
import FollowView from "./FollowView.vue";
import { RouterView, type LocationQueryRaw } from "vue-router";
import { Accordion } from "@/components/ui/accordion";

const router = useRouter();
const userStore = useUserStore();
const treeholeStore = useTreeholeStore();

const editing = ref(false);
const currentPageRef = ref<InstanceType<typeof PostsView> | InstanceType<typeof FollowView> | null>(null);

const handleRefresh = () => {
  if (!currentPageRef.value) {
    return;
  }
  currentPageRef.value.refresh();
};

const goPosts = () => {
  treeholeStore.resetSearchConfig();
  treeholeStore.endOfPosts = false;
  treeholeStore.refreshPosts = true;
  if (router.currentRoute.value.name == "TreeholePostsView") {
    handleRefresh();
  } else {
    router.push("/treehole");
  }
};

const goFollow = () => {
  treeholeStore.refreshFollows = true;
  if (router.currentRoute.value.name == "TreeholeFollowView") {
    handleRefresh();
  } else {
    router.push("/treehole/follow");
  }
};

const navigateToSearch = () => {
  if (treeholeStore.searchConfig.query.length > 0) {
    const keywords: string[] = [];
    const tags: string[] = [];

    treeholeStore.searchConfig.query.forEach((item) => {
      if (item.startsWith(":")) {
        tags.push(item.substring(1)); // 移除冒号
      } else if (!item.startsWith("#")) {
        keywords.push(item);
      }
    });

    const query: LocationQueryRaw = {};

    if (keywords.length > 0) {
      query.keyword = keywords.length === 1 ? keywords[0] : keywords;
    }

    if (tags.length > 0) {
      query.tag = tags.length === 1 ? tags[0] : tags;
    }

    const idQuery = treeholeStore.searchConfig.query.find((item) => item.startsWith("#"));
    if (idQuery) {
      query.id = idQuery.substring(1);
    }

    if (!query.keyword && !query.tag && !query.id) {
      router.push({ path: "/treehole" });
    } else {
      router.push({ path: "/treehole/search", query });
    }
  } else {
    router.push({ path: "/treehole" }); // 当搜索条件为空时，跳转到首页
  }
};

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
  font-size: 16px;
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

.bg-img {
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

:deep(.vditor) {
  --panel-background-color: var(--card);
  --textarea-background-color: var(--card);
}

@media (max-width: 1024px) {
  .card {
    margin: 5px;
  }

  .control-btn-label {
    display: none;
  }
}
</style>
