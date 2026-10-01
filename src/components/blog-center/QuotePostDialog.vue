<template>
  <Dialog :open="visible" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>引用帖子</DialogTitle>
      </DialogHeader>

      <Input v-model="query" placeholder="搜索关键词或#pid" @keydown.enter.prevent="selectFirst" />

      <div class="quote-list">
        <p v-if="loading" class="quote-hint">正在加载</p>
        <template v-else>
          <button v-for="item in results" :key="item.id" type="button" class="quote-option" @click="select(item.id)">
            <span class="quote-option-meta"> #{{ item.id }} · {{ item.username }} </span>
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface QuoteOption {
  id: number;
  username: string;
  excerpt: string;
}

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible", "select"]);

const DIRECT_ID_PATTERN = /^#?\s*(\d+)$/;
const SEARCH_LIMIT = 8;
const DEBOUNCE_MS = 300;

const query = ref("");
const results = ref<QuoteOption[]>([]);
const loading = ref(false);
const searched = ref(false);
let debounceTimer: number | undefined;

const close = () => emit("update:visible", false);

const select = (id: number) => {
  emit("select", id);
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
  results.value = [];
  searched.value = false;
};

const toOption = (post: any): QuoteOption => ({
  id: post.id,
  username: post.username ?? "未知用户",
  excerpt: buildCommentPreview(post.text ?? "") || "（该帖暂无正文）",
});

const lookupById = async (id: number) => {
  const res = await requestApi(`/api/v2/forum/posts/${id}`);
  if (!res.ok) {
    results.value = [];
    return;
  }

  const result = await res.json();
  results.value = result?.data ? [toOption(result.data)] : [];
};

const search = async (keyword: string) => {
  const params = new URLSearchParams({
    keyword,
    limit: String(SEARCH_LIMIT),
    comment_limit: "0",
  });

  const res = await requestApi(`/api/v2/forum/posts?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const result = await res.json();
  const list = Array.isArray(result?.data) ? result.data : [];
  results.value = list.map(toOption);
};

const run = async () => {
  const keyword = query.value.trim();
  if (!keyword) {
    results.value = [];
    searched.value = false;
    return;
  }

  loading.value = true;
  searched.value = false;
  try {
    const directId = DIRECT_ID_PATTERN.exec(keyword);
    if (directId) {
      await lookupById(Number(directId[1]));
    } else {
      await search(keyword);
    }
  } catch (error) {
    results.value = [];
    console.error("Quote post lookup failed:", error);
  } finally {
    loading.value = false;
    searched.value = true;
  }
};

watch(query, () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(run, DEBOUNCE_MS);
});

onBeforeUnmount(() => window.clearTimeout(debounceTimer));
</script>

<style scoped>
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
