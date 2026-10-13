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
import { applyLazyMedia } from "@/utils/lazy-media";
import "@/styles/github-markdown.css";

const vditorRef = ref<HTMLDivElement | null>(null);
const router = useRouter();
let cleanupLazyMedia: (() => void) | null = null;

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});

const handleContentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!link) {
    return;
  }

  const href = link.getAttribute("href") ?? "";
  if (!href.startsWith("/")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  router.push(href);
};

onMounted(() => {
  const root = vditorRef.value;
  if (!root) {
    return;
  }

  root.innerHTML = props.content;
  Vditor.mathRender(root, { cdn: `/vditor/${vditorPackage.version}`, math: { inlineDigit: true } });
  cleanupLazyMedia = applyLazyMedia(root);
  root.addEventListener("click", handleContentClick, true);
});

onBeforeUnmount(() => {
  cleanupLazyMedia?.();
  cleanupLazyMedia = null;
  vditorRef.value?.removeEventListener("click", handleContentClick, true);
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
  font-family: var(--md-font-heading);
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
  --fgColor-accent: var(--primary);
}

.markdown-body :deep(iframe) {
  border: none;
  border-radius: 4px;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
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
