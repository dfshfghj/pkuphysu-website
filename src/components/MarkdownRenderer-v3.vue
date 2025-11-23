<template>
  <div class="markdown-body">
    <div class="math-markdown-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import MarkdownIt from 'markdown-it';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import '../styles/github-markdown.css';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const renderedContent = ref('');

// 唯一的占位符标识
const INLINE_PLACEHOLDER = 'INLINE_MATH_';
const BLOCK_PLACEHOLDER = 'BLOCK_MATH_';

const renderMarkdown = () => {
  if (!props.content.trim()) {
    renderedContent.value = '';
    return;
  }

  try {
    let content = props.content;
    const inlineFormulas = [];
    const blockFormulas = [];

    // 1. 提取行间公式 $$...$$
    content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      const index = blockFormulas.length;
      blockFormulas.push(formula.trim());
      return `${BLOCK_PLACEHOLDER}${index}`;
    });

    content = content.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (match, formula) => {
      const index = blockFormulas.length;
      blockFormulas.push(formula.trim());
      return `${BLOCK_PLACEHOLDER}${index}`;
    });

    // 2. 提取行内公式 $...$
    content = content.replace(/\$([^\$]+?)\$/g, (match, formula) => {
      const index = inlineFormulas.length;
      inlineFormulas.push(formula.trim());
      return `${INLINE_PLACEHOLDER}${index}`;
    });

    content = content.replace(/\\\((.*?)\\\)/g, (match, formula) => {
      const index = inlineFormulas.length;
      inlineFormulas.push(formula.trim());
      return `${INLINE_PLACEHOLDER}${index}`;
    });

    // 3. 使用 markdown-it 渲染处理后的文本
    const md = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true,
      breaks: true
    });
    
    let rendered = md.render(content);

    // 4. 替换行间公式占位符
    rendered = rendered.replace(new RegExp(`${BLOCK_PLACEHOLDER}(\\d+)`, 'g'), (match, index) => {
      const formula = blockFormulas[parseInt(index)];
      if (formula === undefined) return match;
      
      try {
        return `<div class="katex-block">${katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false,
          errorColor: '#cc0000'
        })}</div>`;
      } catch (error) {
        console.warn('KaTeX block render error:', error);
        return `<span class="katex-error">$$${formula}$$</span>`;
      }
    });

    // 5. 替换行内公式占位符
    rendered = rendered.replace(new RegExp(`${INLINE_PLACEHOLDER}(\\d+)`, 'g'), (match, index) => {
      const formula = inlineFormulas[parseInt(index)];
      if (formula === undefined) return match;
      
      try {
        return katex.renderToString(formula, {
          displayMode: false,
          throwOnError: false,
          errorColor: '#cc0000'
        });
      } catch (error) {
        console.warn('KaTeX inline render error:', error);
        return `<span class="katex-error">$${formula}$</span>`;
      }
    });

    renderedContent.value = rendered;
    
  } catch (error) {
    console.error('Markdown rendering error:', error);
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
    position: relative;
}

/* KaTeX 相关样式 */
.markdown-body:deep(.katex-block) {
  overflow: auto;
}

.markdown-body:deep(.katex-block .katex-html) {
  position: static;
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