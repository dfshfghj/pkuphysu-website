<template>
  <div class="markdown-body">
    <div class="math-markdown-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup>
import MarkdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import { imgLazyload } from "@mdit/plugin-img-lazyload";
import { obsidianImgSize } from "@mdit/plugin-img-size";
import { ins } from "@mdit/plugin-ins";
import { mark } from "@mdit/plugin-mark";
import { tasklist } from "@mdit/plugin-tasklist";
import { full as emoji } from 'markdown-it-emoji';
import "katex/dist/katex.min.css";
import "../styles/github-markdown.css";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
  katexOptions: {
    type: Object,
    default: () => ({
      throwOnError: false,
      errorColor: "#cc0000",
      delimiters: 'all',
    }),
  },
});

const renderedContent = ref("");
const renderMarkdown = () => {
  if (!props.content.trim()) {
    renderedContent.value = "";
    return;
  }

  try {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
      
    });

    md.use(katex, props.katexOptions).use(emoji).use(imgLazyload).use(obsidianImgSize).use(ins).use(mark).use(tasklist);

    renderedContent.value = md.render(props.content);
  } catch (error) {
    console.error("Markdown rendering error:", error);
    renderedContent.value = `<p class="error">渲染失败: ${error.message}</p>`;
  }
};

watch(() => props.content, renderMarkdown, { immediate: true });

onMounted(renderMarkdown);
</script>

<style scoped>
.markdown-body {
  padding-left: 50px;
  padding-right: 50px;
  --bgColor-default: var(--c-card);
}

.markdown-body:deep(.katex-block) {
  overflow: auto;
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
