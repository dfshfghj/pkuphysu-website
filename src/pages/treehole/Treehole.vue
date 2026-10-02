<template>
  <div class="flex">
    <div class="bg-sidebar hidden sm:flex flex-col lg:min-w-30">
      <div class="control-btn sm:font-serif font-bold pt-5" @click="goPosts">
        <RotateCw class="size-5" />
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
    <div class="flex flex-col flex-1 min-w-0 h-screen pb-14 sm:pb-0">
      <div class="bg-sidebar p-1 sticky top-0 z-999 hidden sm:block md:hidden">
        <div class="control-search p-1 m-2 bg-card">
          <SearchTagInput v-model="treeholeStore.searchConfig.query" placeholder="搜索内容 或 #id 或 :tag" />
          <Search class="size-5 cursor-pointer" @click="navigateToSearch()" />
        </div>
      </div>
      <div
        class="text-(--c-title) pb-[0.7em] sticky top-0 left-0 w-full shadow-[0_0_25px_rgba(0,0,0,0.4)] bg-card z-10 unselectable sm:hidden"
      >
        <div class="control-bar">
          <template v-if="isDetail">
            <ChevronLeft :stroke-width="3" class="size-5 cursor-pointer ml-4 mr-2" @click="router.back()" />
            <span class="text-(--c-secondary)!">#{{ route.params.id }}</span>
            <span class="page-title">详情</span>
          </template>
          <template v-else>
            <div class="control-btn p-2" @click="goFollow">
              <Star v-if="isFollowPage" class="size-5 fill-current" />
              <Star v-else class="size-5" />
              <span class="control-btn-label">关注</span>
            </div>
            <div class="control-search flex-1">
              <SearchTagInput v-model="treeholeStore.searchConfig.query" placeholder="搜索内容 或 #id 或 :tag" />
              <Search class="size-5 cursor-pointer" @click="navigateToSearch()" />
            </div>
            <Button v-if="!userStore.isLoggedIn" variant="link" @click="router.push('/login')" class="border-none">
              登录
            </Button>
          </template>
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
        <SearchTagInput v-model="treeholeStore.searchConfig.query" placeholder="搜索内容 或 #id 或 :tag" />
        <Search class="size-5 cursor-pointer" @click="navigateToSearch()" />
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
      <div
        class="mx-5 mb-5 flex cursor-pointer items-center gap-2 text-sm transition-opacity hover:opacity-70"
        @click="router.push('/about')"
      >
        <FileText class="size-4" />
        <span>关于本站</span>
      </div>
      <div class="flex-1"></div>
    </div>
  </div>
  <PasswordDialog @success="treeholeStore.fetchPosts()" />

  <BottomNav
    :home-names="['TreeholePostsView', 'TreeholeCommentsView']"
    @home="goPosts"
    @post="toast.info('树洞发帖功能尚未接入')"
  />
  <div class="bg-img"></div>
</template>

<script setup lang="ts">
import PasswordDialog from "@/components/blog-center/PasswordDialog.vue";
import BottomNav from "@/components/layouts/BottomNav.vue";
import SearchTagInput from "@/components/SearchTagInput.vue";
import { Button } from "@/components/ui/button";
import { toast } from "vue-sonner";
import { useUserStore } from "@/stores/user";
import { useTreeholeStore } from "@/stores/treehole";
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
import { ChevronLeft, FileText, RotateCw, Search, Star } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const treeholeStore = useTreeholeStore();

const isFollowPage = computed(() => route.name === "TreeholeFollowView");
const isDetail = computed(() => route.name === "TreeholeCommentsView");
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
        tags.push(item.substring(1));
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
    router.push({ path: "/treehole" });
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
  padding-right: 0.5rem;
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

.page-title {
  font-size: 16px;
  font-weight: bold;
  padding-left: 0.5rem;
  white-space: nowrap;
}

.control-search {
  display: flex;
  align-items: center;
  border: 1px solid var(--c-border);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
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
  background: url("/images/bg-light.webp") center center / cover rgb(255, 255, 255);
}

.dark .bg-img {
  background: url("/images/bg.webp") center center / cover rgb(255, 255, 255);
}

.bg-img::after {
  content: "";
  position: absolute;
  inset: 0;
  background: color-mix(in oklab, var(--background) 70%, transparent);
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
