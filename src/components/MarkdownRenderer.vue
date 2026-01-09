<template>
  <div class="markdown-body">
    <div class="math-markdown-content">
      <MarkdownRenderer :content="props.content" />
    </div>
  </div>
</template>

<script setup>
import MarkdownRenderer from "markstream-vue";
import "markstream-vue/index.css";
import "katex/dist/katex.min.css";
import "../styles/github-markdown.css";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.markdown-body {
  background-color: transparent;
}

:deep(.node-slot:first-child *) {
  margin-top: 0;
}

:deep(.heading-node) {
  font-family: "KaTeX_Main", serif;
}

:deep(.admonition) {
  background: transparent;
}

.math-markdown-content :deep(.katex-error) {
  color: #cc0000;
  background: #ffeeee;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.math-markdown-content :deep(.katex-error-block) {
  color: #cc0000;
  background: #ffeeee;
  padding: 10px;
  border-radius: 4px;
  margin: 1em 0;
  font-family: monospace;
  text-align: center;
}
</style>
