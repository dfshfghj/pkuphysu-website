<template>
  <Dialog :open="visible" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>引用帖子</DialogTitle>
      </DialogHeader>

      <div class="quote-source">
        <button
          type="button"
          class="quote-source-tab"
          :class="{ 'quote-source-tab--active': source === 'forum' }"
          @click="switchSource('forum')"
        >
          站内
        </button>
        <button
          type="button"
          class="quote-source-tab"
          :class="{ 'quote-source-tab--active': source === 'treehole' }"
          @click="switchSource('treehole')"
        >
          树洞
        </button>
      </div>

      <Input
        v-model="query"
        :placeholder="source === 'treehole' ? '搜索树洞关键词或#pid' : '搜索关键词或#pid'"
        @keydown.enter.prevent="selectFirst"
      />

      <div class="quote-list">
        <p v-if="loading" class="quote-hint">正在加载</p>
        <template v-else>
          <button v-for="item in results" :key="item.id" type="button" class="quote-option" @click="select(item.id)">
            <span class="quote-option-meta">
              #{{ item.id }}<template v-if="item.username"> · {{ item.username }}</template>
            </span>
            <span class="quote-option-excerpt">{{ item.excerpt }}</span>
          </button>
          <p v-if="searched && !results.length" class="quote-hint">没有更多</p>
        </template>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">取消</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { requestApi } from "@/api/api";
import { buildCommentPreview } from "@/utils/preview";
import { type QuoteSelection, type QuoteSource } from "@/utils/quote";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface QuoteOption {
  id: number;
  username?: string;
  excerpt: string;
}

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  select: [selection: QuoteSelection];
}>();

const DIRECT_ID_PATTERN = /^#?\s*(\d+)$/;
const SEARCH_LIMIT = 8;
const DEBOUNCE_MS = 300;

const query = ref("");
const source = ref<QuoteSource>("forum");
const results = ref<QuoteOption[]>([]);
const loading = ref(false);
const searched = ref(false);
let debounceTimer: number | undefined;

const close = () => emit("update:visible", false);

const select = (id: number) => {
  emit("select", { source: source.value, id });
  close();
};

const selectFirst = () => {
  if (results.value.length > 0) {
    select(results.value[0].id);
  }
};

const handleOpenChange = (open: boolean) => {
  emit("update:visible", open);
  if (!open) {
    return;
  }

  query.value = "";
  source.value = "forum";
  results.value = [];
  searched.value = false;
};

const switchSource = (next: QuoteSource) => {
  if (source.value === next) {
    return;
  }
  source.value = next;
  query.value = "";
  results.value = [];
  searched.value = false;
};

const toForumOption = (post: any): QuoteOption => ({
  id: post.id,
  username: post.username ?? "未知用户",
  excerpt: buildCommentPreview(post.text ?? "") || "（该帖暂无正文）",
});

const toTreeholeOption = (post: any): QuoteOption => ({
  id: post.pid,
  excerpt: buildCommentPreview(post.text ?? "") || "（该帖暂无正文）",
});

const lookupById = async (id: number, from: QuoteSource) => {
  const url =
    from === "treehole" ? `/api/dev/chapi/api/v3/hole/get?pid=${id}` : `/api/v2/forum/posts/${id}`;
  const res = await requestApi(url);
  if (!res.ok) {
    results.value = [];
    return;
  }

  const result = await res.json();
  const post = result?.data;
  results.value = post ? [from === "treehole" ? toTreeholeOption(post) : toForumOption(post)] : [];
};

const search = async (keyword: string, from: QuoteSource) => {
  const params = new URLSearchParams({ keyword, limit: String(SEARCH_LIMIT) });
  let url: string;
  if (from === "treehole") {
    params.set("page", "1");
    params.set("comment_limit", "0");
    params.set("comment_stream", "1");
    url = `/api/dev/chapi/api/v3/hole/list_comments?${params.toString()}`;
  } else {
    params.set("comment_limit", "0");
    url = `/api/v2/forum/posts?${params.toString()}`;
  }

  const res = await requestApi(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const result = await res.json();
  const list = from === "treehole" ? result?.data?.list : result?.data;
  const items = Array.isArray(list) ? list : [];
  results.value = items.map(from === "treehole" ? toTreeholeOption : toForumOption);
};

const run = async () => {
  const keyword = query.value.trim();
  if (!keyword) {
    results.value = [];
    searched.value = false;
    return;
  }

  const from = source.value;
  loading.value = true;
  searched.value = false;
  try {
    const directId = DIRECT_ID_PATTERN.exec(keyword);
    if (directId) {
      await lookupById(Number(directId[1]), from);
    } else {
      await search(keyword, from);
    }
  } catch (error) {
    results.value = [];
    console.error("Quote post lookup failed:", error);
  } finally {
    if (source.value === from) {
      loading.value = false;
      searched.value = true;
    }
  }
};

watch(query, () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(run, DEBOUNCE_MS);
});

onBeforeUnmount(() => window.clearTimeout(debounceTimer));
</script>

<style scoped>
.quote-source {
  display: flex;
  gap: 0.25rem;
  padding: 0.2rem;
  border-radius: 8px;
  background: var(--gray-2);
}

.quote-source-tab {
  flex: 1;
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-secondary);
  font-size: 0.875rem;
  cursor: pointer;
}

.quote-source-tab--active {
  background: var(--card);
  color: var(--c-title);
  font-weight: 600;
}

.quote-list {
  max-height: 18rem;
  overflow-y: auto;
}

.quote-hint {
  padding: 0.75rem 0;
  color: var(--c-secondary);
  font-size: 0.875rem;
  text-align: center;
}

.quote-option {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.quote-option:hover {
  border-color: var(--c-border);
  background: color-mix(in srgb, var(--card) 65%, transparent);
}

.quote-option-meta {
  color: var(--c-secondary);
  font-size: 0.75rem;
}

.quote-option-excerpt {
  display: -webkit-box;
  overflow: hidden;
  color: var(--c-title);
  font-size: 0.875rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
