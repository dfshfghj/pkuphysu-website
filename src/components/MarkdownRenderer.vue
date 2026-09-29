<template>
  <div class="markdown-body">
    <div ref="vditorRef" class="markdown-content overflow-auto"></div>
  </div>
</template>

<script setup lang="ts">
import katex from "katex";
import "katex/dist/katex.min.css";
window.katex = katex as typeof import("katex");
const fakeScript = (id: string) => {
  if (!document.getElementById(id)) {
    const script = document.createElement("script");
    script.id = id;
    document.head.appendChild(script);
  }
};

const fakeStyle = (id: string) => {
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "";
    document.head.appendChild(link);
  }
};

fakeStyle("vditorKatexStyle");
fakeScript("vditorKatexScript");
fakeScript("vditorKatexChemScript");

import Vditor from "vditor";
import vditorPackage from "vditor/package.json";
import "@/styles/github-markdown.css";

const vditorRef = ref<HTMLDivElement | null>(null);

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});

const initMarkdown = () => {
  vditorRef.value!.innerHTML = props.content;
  Vditor.mathRender(vditorRef.value!, {
    cdn: `/vditor/${vditorPackage.version}`,
  });
};

onMounted(() => {
  initMarkdown();
});
</script>

<style scoped>
.markdown-body {
  background-color: transparent;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  font-family: "KaTeX_Main", serif;
}

@media (max-width: 640px) {
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    font-family: "KaTeX_Main";
  }
}

:deep(h1:first-child),
:deep(h2:first-child),
:deep(h3:first-child),
:deep(h4:first-child),
:deep(h5:first-child),
:deep(h6:first-child) {
  margin-top: 0px;
}

.markdown-body {
  --bgColor-default: transparent;
}

.markdown-body :deep(iframe) {
  border: none;
  border-radius: 4px;
}

/* KaTeX 相关样式 */
.markdown-body:deep(.katex-display) {
  overflow: auto;
  overflow-y: hidden;
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
