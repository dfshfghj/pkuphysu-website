<template>
  <MarkdownRenderer :key="html" :content="html" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import { renderMarkdown } from "@/utils/markdown";

const props = defineProps({
  source: {
    type: String,
    default: "",
  },
});

const html = computed(() => renderMarkdown(props.source));
</script>
