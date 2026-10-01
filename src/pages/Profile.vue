<template>
  <el-scrollbar ref="mainScrollbar" :distance="400" @end-reached="loadMorePosts">
    <el-backtop
      target="#app > div.flex > div.flex-1.min-w-0.h-screen > div.el-scrollbar > div.el-scrollbar__wrap.el-scrollbar__wrap--hidden-default"
      :right="20"
      :bottom="30"
    >
    </el-backtop>
    <div class="min-h-lvh pb-10">
      <template v-if="notFound">
        <div class="px-6 py-20 text-center text-(--c-secondary)">该用户不存在或已被删除</div>
      </template>

      <template v-else>
        <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">用户主页</h2>

        <div class="flex items-start gap-4 px-6 pt-5">
          <UserAvatar :userid="String(userid)" :size="72" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="truncate text-lg font-bold sm:font-serif">{{ user.username || "加载中…" }}</span>
              <el-tag v-if="user.verified" size="small" effect="plain" type="success">已认证</el-tag>
              <el-tag v-if="user.role === 2" size="small" effect="plain">管理员</el-tag>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-(--c-secondary) unselectable">
              <span><b class="text-(--c-title)">{{ stats.post_count }}</b> 帖子</span>
              <span><b class="text-(--c-title)">{{ stats.comment_count }}</b> 评论</span>
              <span><b class="text-(--c-title)">{{ stats.likes_received }}</b> 获赞</span>
            </div>
          </div>
          <Button v-if="isSelf" class="shrink-0" variant="outline" size="sm" @click="openEditor">编辑主页</Button>
        </div>

        <section class="mt-6 px-6">
          <div class="rounded-md border border-(--c-border) p-4">
            <div class="mb-2 flex items-center justify-between gap-3">
              <span class="text-base font-bold sm:font-serif">自定义内容</span>
              <span v-if="profile.updated_at" class="text-xs text-(--c-secondary)">
                更新于 {{ formatTime(profile.updated_at).formattedTime }}
              </span>
            </div>
            <MarkdownRenderer v-if="profile.content" :key="profile.content" :content="profile.content" />
            <p v-else class="text-sm text-(--c-secondary)">
              {{ isSelf ? "还没有自定义内容，点「编辑主页」写点什么吧。" : "TA 还没有填写自定义内容。" }}
            </p>
          </div>
        </section>

        <section class="mt-6">
          <h3 class="pl-6 text-base font-bold sm:font-serif">最近发布</h3>
          <BlogPostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            @card-click="router.push(`/${post.id}`)"
            @deleted="handlePostDeleted"
            @updated="refreshPost"
          />
          <p v-if="!posts.length && loaded" class="px-6 py-10 text-center text-sm text-(--c-secondary)">
            TA 还没有公开的帖子
          </p>
          <p v-if="endOfPosts && posts.length" class="end-flag">没有更多了</p>
        </section>
      </template>
    </div>

    <Dialog :open="editorVisible" @update:open="editorVisible = $event">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑主页内容</DialogTitle>
          <DialogDescription>支持 Markdown，会展示在你的用户主页上，所有人可见。</DialogDescription>
        </DialogHeader>
        <MarkdownEditor v-model="draft" :dark-mode="isDark" :min-height="260" />
        <div class="flex items-center justify-between text-xs text-(--c-secondary)">
          <span>{{ draft.length }} / {{ maxLength }}</span>
          <span v-if="draft.length > maxLength" class="text-(--red-6)">内容过长</span>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="saving" @click="editorVisible = false">取消</Button>
          <Button :disabled="saving || draft.length > maxLength" @click="saveProfile">
            {{ saving ? "保存中…" : "保存" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { requestApi } from "@/api/api";
import { useUserStore } from "@/stores/user";
import UserAvatar from "@/components/UserAvatar.vue";
import BlogPostCard from "@/components/blog-center/BlogPostCard.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import Button from "@/components/ui/button/Button.vue";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isDark } from "@/composables/theme";
import { formatTime } from "@/utils";
import { toast } from "vue-sonner";

interface ProfileUser {
  id: number;
  username: string;
  bio: string;
  role: number;
  verified: boolean;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const PAGE_SIZE = 10;

const userid = computed(() => Number(route.params.id));
const mainScrollbar = ref();
const user = ref<Partial<ProfileUser>>({});
const profile = ref<{ content: string; updated_at: number | null }>({ content: "", updated_at: null });
const stats = ref({ post_count: 0, comment_count: 0, likes_received: 0 });
const posts = ref<any[]>([]);
const endOfPosts = ref(false);
const postsLoading = ref(false);
const loaded = ref(false);
const notFound = ref(false);

const isSelf = computed(() => Number(userStore.userid) === userid.value);

const editorVisible = ref(false);
const draft = ref("");
const maxLength = ref(5000);
const saving = ref(false);

const scrollToTop = () => {
  if (mainScrollbar.value) {
    mainScrollbar.value.scrollTo({ top: 0 });
  }
};

const loadProfile = async () => {
  notFound.value = false;
  try {
    const res = await requestApi(`/api/v2/users/${userid.value}/profile?limit=${PAGE_SIZE}`);
    if (res.status === 404) {
      notFound.value = true;
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    const data = result.data;
    user.value = data.user;
    profile.value = data.profile;
    stats.value = data.stats;
    posts.value = data.posts ?? [];
    endOfPosts.value = posts.value.length < PAGE_SIZE;
  } catch (error) {
    toast.error("加载用户主页失败");
    console.error("Load user profile failed:", error);
  } finally {
    loaded.value = true;
  }
};

const loadMorePosts = async () => {
  if (endOfPosts.value || postsLoading.value || !posts.value.length) return;

  postsLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("limit", String(PAGE_SIZE));
    params.append("begin", String(posts.value.at(-1).id));

    const res = await requestApi(`/api/v2/users/${userid.value}/profile?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    const more = result.data.posts ?? [];
    posts.value = [...posts.value, ...more];
    if (more.length < PAGE_SIZE) {
      endOfPosts.value = true;
    }
  } catch (error) {
    console.error("Load more profile posts failed:", error);
  } finally {
    postsLoading.value = false;
  }
};

const handlePostDeleted = (postId: number) => {
  posts.value = posts.value.filter((post) => post.id !== postId);
  stats.value.post_count = Math.max(0, stats.value.post_count - 1);
};

const refreshPost = async (postId: number) => {
  const res = await requestApi(`/api/v2/forum/posts/${postId}`);
  if (!res.ok) return;
  const result = await res.json();
  const index = posts.value.findIndex((post) => post.id === postId);
  if (index !== -1) {
    posts.value[index] = result.data;
  }
};

const openEditor = async () => {
  try {
    const res = await requestApi("/api/v2/user/me/profile");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    draft.value = result.data.content ?? "";
    maxLength.value = result.data.max_length ?? 5000;
    editorVisible.value = true;
  } catch (error) {
    toast.error("加载主页内容失败");
    console.error("Load my profile failed:", error);
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const res = await requestApi("/api/v2/user/me/profile", {
      method: "PUT",
      body: JSON.stringify({ content: draft.value }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || `HTTP ${res.status}`);

    profile.value = { content: result.data.content, updated_at: Math.floor(Date.now() / 1000) };
    editorVisible.value = false;
    toast.success("主页内容已更新");
  } catch (error) {
    toast.error(error instanceof Error && error.message ? error.message : "保存失败");
    console.error("Save my profile failed:", error);
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadProfile();
  scrollToTop();
});

watch(
  () => route.params.id,
  async () => {
    posts.value = [];
    endOfPosts.value = false;
    loaded.value = false;
    await loadProfile();
    scrollToTop();
  }
);
</script>
