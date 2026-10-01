<template>
  <div ref="rootRef">
    <MarkdownRenderer :content="content" />
    <PostQuoteHoverCard ref="quoteCardRef" />
  </div>
</template>

<script setup lang="ts">
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import PostQuoteHoverCard from "@/components/blog-center/PostQuoteHoverCard.vue";
import { parsePostQuoteLink } from "@/utils/post-quote";

defineProps({
  content: {
    type: String,
    default: "",
  },
});

const rootRef = ref<HTMLDivElement | null>(null);
const quoteCardRef = ref<InstanceType<typeof PostQuoteHoverCard> | null>(null);

const annotateQuoteLinks = () => {
  rootRef.value?.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const id = parsePostQuoteLink(link.textContent, link.getAttribute("href"));
    if (id !== null) {
      link.dataset.postQuote = String(id);
    }
  });
};

const handleMouseOver = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  const link = target?.closest?.("a[data-post-quote]") as HTMLAnchorElement | null;
  if (link) {
    quoteCardRef.value?.show(link);
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
