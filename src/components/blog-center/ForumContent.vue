<template>
  <div ref="rootRef">
    <MarkdownRenderer :content="content" />
    <PostQuoteHoverCard ref="quoteCardRef" />
    <TreeholeQuoteHoverCard ref="treeholeQuoteCardRef" />
  </div>
</template>

<script setup lang="ts">
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import PostQuoteHoverCard from "@/components/blog-center/PostQuoteHoverCard.vue";
import TreeholeQuoteHoverCard from "@/components/blog-center/TreeholeQuoteHoverCard.vue";
import { parsePostQuoteLink } from "@/utils/post-quote";
import { parseTreeholeQuoteLink } from "@/utils/treehole-quote";

defineProps({
  content: {
    type: String,
    default: "",
  },
});

const rootRef = ref<HTMLDivElement | null>(null);
const quoteCardRef = ref<InstanceType<typeof PostQuoteHoverCard> | null>(null);
const treeholeQuoteCardRef = ref<InstanceType<typeof TreeholeQuoteHoverCard> | null>(null);

const annotateQuoteLinks = () => {
  rootRef.value?.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    const postId = parsePostQuoteLink(link.textContent, href);
    if (postId !== null) {
      link.dataset.postQuote = String(postId);
      return;
    }
    const treeholeId = parseTreeholeQuoteLink(link.textContent, href);
    if (treeholeId !== null) {
      link.dataset.treeholeQuote = String(treeholeId);
    }
  });
};

const handleMouseOver = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  const link = target?.closest?.("a[data-post-quote], a[data-treehole-quote]") as HTMLAnchorElement | null;
  if (!link) {
    return;
  }
  if (link.dataset.postQuote) {
    quoteCardRef.value?.show(link);
  } else if (link.dataset.treeholeQuote) {
    treeholeQuoteCardRef.value?.show(link);
  }
};

onMounted(() => {
  annotateQuoteLinks();
  rootRef.value?.addEventListener("mouseover", handleMouseOver);
});

onBeforeUnmount(() => {
  rootRef.value?.removeEventListener("mouseover", handleMouseOver);
});
</script>
