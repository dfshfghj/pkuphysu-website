<template>
    <div class="markdown-body">
        <div ref="vditorRef" class="markdown-content"></div>
    </div>
</template>

<script setup>
import Vditor from 'vditor';
//import '../styles/github-markdown.css';

const vditorRef = ref(null);
const vditor = ref(null);

const props = defineProps({
    content: {
        type: String,
        default: ''
    },
    darkMode: {
        type: Boolean,
        default: false
    },
});

const isDarkMode = ref(props.darkMode);

const initMarkdown = () => {
    const preview_theme = isDarkMode.value ? 'dark' : 'light';
    const hljs_style = isDarkMode.value ? 'github-dark' : 'github';
    Vditor.preview(vditorRef.value, props.content, {
        cdn: '/vditor',
        theme: {
            current: preview_theme,
        },
        markdown: {
            mark: true,
            autoSpace: true,
        },
        math: {
            inlineDigit: true,
            macros: {},
        },
        hljs: {
            style: hljs_style,
            lineNumber: true,
        },
    });
};

onMounted(async () => {
    await nextTick();
    initMarkdown();
});

onBeforeUnmount(() => {
    if (vditor.value) {
        vditor.value.destroy();
        vditor.value = null;
    }
});
</script>

<style scoped>
.markdown-body {
    --bgColor-default: transparent;
}

/* KaTeX 相关样式 */
.markdown-body:deep(.katex-display) {
  overflow: auto;
}
</style>