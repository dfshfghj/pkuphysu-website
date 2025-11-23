<template>
  <div class="markdown-body">
    <div class="math-markdown-content" v-html="renderedContent"></div>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it';
import katex from 'katex';
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

// 数学公式插件 - 修正版本
const mathPlugin = (md) => {
  // 行间公式: $$...$$ (优先级更高)
  md.block.ruler.before('paragraph', 'math_block', (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    
    // 检查是否以 $$ 开头
    if (pos + 1 >= state.eMarks[startLine] || state.src.slice(pos, pos + 2) !== '$$') {
      return false;
    }
    
    if (silent) return true;
    
    let nextLine = startLine + 1;
    let foundEnd = false;
    
    // 查找结束的 $$
    for (; nextLine < endLine; nextLine++) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      
      if (lineStart < lineEnd && state.src.slice(lineStart, lineStart + 2) === '$$') {
        foundEnd = true;
        break;
      }
    }
    
    if (!foundEnd) return false;
    
    // 提取公式内容
    let content = '';
    for (let i = startLine + 1; i < nextLine; i++) {
      const lineStart = state.bMarks[i] + state.tShift[i];
      const lineEnd = state.eMarks[i];
      content += state.src.slice(lineStart, lineEnd) + (i < nextLine - 1 ? '\n' : '');
    }
    
    state.line = nextLine + 1;
    
    const token = state.push('math_block', '', 0);
    token.block = true;
    token.content = content;
    token.info = 'math';
    token.map = [startLine, state.line];
    
    return true;
  });

  // 行内公式: $...$
  md.inline.ruler.before('text', 'math_inline', (state, silent) => {
    const start = state.pos;
    
    if (start >= state.src.length || state.src[start] !== '$') {
      return false;
    }
    
    if (start + 1 < state.src.length && state.src[start + 1] === '$') {
      return false;
    }
    
    // 🆕 限制搜索范围为当前解析上下文
    let matchPos = -1;
    const maxSearch = Math.min(state.src.length, state.posMax || state.src.length);
    
    for (let i = start + 1; i < maxSearch; i++) {
      if (state.src[i] === '$') {
        if (i > 0 && state.src[i - 1] === '\\') continue;
        matchPos = i;
        break;
      }
    }
    
    if (matchPos === -1) return false;
    
    const content = state.src.slice(start + 1, matchPos);
    if (!content.trim()) return false;
    
    if (silent) return true;
    
    const token = state.push('math_inline', 'span', 0);
    token.content = content;
    token.markup = '$';
    token.level = state.level;
    
    // 🆕 确保不超出当前解析范围
    state.pos = matchPos + 1;
    
    return true;
  });

  // 渲染器
  md.renderer.rules.math_inline = (tokens, idx) => {
    try {
      return katex.renderToString(tokens[idx].content, {
        ...props.katexOptions,
        strict: 'ignore',
        displayMode: false
      });
    } catch (error) {
      console.warn('KaTeX inline render error:', error);
      return `<span class="katex-error" title="${error.message}">$${tokens[idx].content}$</span>`;
    }
  };
  
  md.renderer.rules.math_block = (tokens, idx) => {
    try {
      return `<div class="katex-block">` + 
             katex.renderToString(tokens[idx].content, {
               ...props.katexOptions,
               displayMode: true
             }) + 
             `</div>`;
    } catch (error) {
      console.warn('KaTeX block render error:', error);
      return `<div class="katex-error-block" title="${error.message}">$$${tokens[idx].content}$$</div>`;
    }
  };
};

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
    md.use(mathPlugin);
    
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