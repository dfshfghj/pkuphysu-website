<template>
  <div class="markdown-body">
    <div class="math-markdown-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it';
import { katex } from "@mdit/plugin-katex";
import 'katex/dist/katex.min.css';
import '../styles/github-markdown.css';

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  katexOptions: {
    type: Object,
    default: () => ({
      throwOnError: false,
      errorColor: '#cc0000',
      macros: {}
    })
  }
});

const renderedContent = ref('');
const renderMarkdown = () => {
  if (!props.content.trim()) {
    renderedContent.value = '';
    return;
  }

  try {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true
    });
    
    // 使用数学公式插件
    md.use(katex);
    
    // 渲染内容
    renderedContent.value = md.render(props.content);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    renderedContent.value = `<p class="error">渲染失败: ${error.message}</p>`;
  }
};

// 监听内容变化
watch(() => props.content, renderMarkdown, { immediate: true });

// 组件挂载时渲染
onMounted(renderMarkdown);
</script>

<style scoped>
.markdown-body {
    padding-left: 50px;
    padding-right: 50px;
    --bgColor-default: var(--c-card);
}

/* KaTeX 相关样式 */
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