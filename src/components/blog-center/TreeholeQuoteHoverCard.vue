<template>
  <HoverCard :open="open" :close-delay="0" @update:open="open = $event">
    <HoverCardExternalTrigger ref="externalTriggerRef" />
    <HoverCardContent :reference="reference" class="w-96 max-w-[calc(100vw-2rem)] p-0">
      <p v-if="!quote" class="post-quote-hint">加载中…</p>

      <template v-else-if="quote.available">
        <div class="post-quote-head">
          <span class="post-quote-badge">树洞</span>
          <span class="post-quote-id">#{{ quote.id }}</span>
          <span v-if="quoteTime" class="post-quote-time">{{ quoteTime }}</span>
        </div>
        <div v-if="quote.text" class="post-quote-body">
          <MarkdownRenderer :key="quote.id" :content="quote.text" />
        </div>
        <p v-else class="post-quote-hint">{{ quote.excerpt?.trim() || "（该帖暂无正文）" }}</p>
      </template>

      <p v-else class="post-quote-hint">引用的树洞帖子不存在、已被删除或当前不可见</p>
    </HoverCardContent>
  </HoverCard>
</template>

<script setup lang="ts">
import { formatTime } from "@/utils";
import { getCachedTreeholeQuote, loadTreeholeQuotes, type TreeholeQuote } from "@/utils/treehole-quote";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import HoverCardExternalTrigger from "@/components/ui/hover-card/HoverCardExternalTrigger.vue";

const open = ref(false);
const reference = ref<HTMLElement | null>(null);
const quote = ref<TreeholeQuote | null>(null);
const externalTriggerRef = ref<InstanceType<typeof HoverCardExternalTrigger> | null>(null);
let currentId: number | null = null;

const quoteTime = computed(() => (quote.value?.timestamp ? formatTime(quote.value.timestamp).formattedTime : ""));

const show = async (link: HTMLAnchorElement) => {
  const id = Number(link.dataset.treeholeQuote);
  if (!Number.isFinite(id)) {
    return;
  }

  externalTriggerRef.value?.setTriggerElement(link);
  reference.value = link;
  currentId = id;
  quote.value = getCachedTreeholeQuote(id) ?? null;
  open.value = true;

  if (quote.value) {
    return;
  }

  await loadTreeholeQuotes([id]);
  if (currentId !== id) {
    return;
  }
  quote.value = getCachedTreeholeQuote(id) ?? null;
};

onBeforeUnmount(() => externalTriggerRef.value?.setTriggerElement(null));

defineExpose({ show });
</script>

<style scoped>
.post-quote-head {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.6em 0.8em;
  border-bottom: 1px solid var(--c-border);
  font-size: 0.8em;
}

.post-quote-badge {
  flex: none;
  padding: 0 0.5em;
  border-radius: 9999px;
  background: var(--gray-2);
  color: var(--c-secondary);
}

.post-quote-id,
.post-quote-time {
  flex: none;
  color: var(--c-secondary);
}

.post-quote-body {
  max-height: 55vh;
  padding: 0.8em;
  overflow: auto;
  font-size: 0.9em;
}

.post-quote-hint {
  padding: 1em;
  color: var(--c-secondary);
  font-size: 0.875rem;
  text-align: center;
}
</style>
