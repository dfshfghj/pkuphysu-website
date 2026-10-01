<template>
  <el-scrollbar>
    <div class="mx-auto min-h-lvh w-full max-w-4xl px-4 py-6">
      <div class="mb-4 flex items-center gap-3">
        <el-icon :size="20" class="cursor-pointer" @click="router.back()">
          <ArrowLeftBold />
        </el-icon>
        <h1 class="text-xl font-bold sm:font-serif">关于本站</h1>
        <div class="flex-1"></div>
        <RouterLink to="/" class="text-sm text-(--c-secondary) hover:text-(--c-title)">进入论坛</RouterLink>
      </div>

      <el-tabs v-model="currentDoc">
        <el-tab-pane v-for="doc in docs" :key="doc.name" :label="doc.label" :name="doc.name">
          <div class="markdown-body" v-html="doc.html"></div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ArrowLeftBold } from "@element-plus/icons-vue";
import { renderMarkdown } from "@/utils/markdown";
import "@/styles/github-markdown.css";
import "katex/dist/katex.min.css";

interface DocEntry {
  name: string;
  label: string;
  html: string;
}

// 仓库根目录的 .md 会自动出现在这里，新增文件不用改代码
const LABELS: Record<string, string> = {
  "CHANGELOG.md": "更新日志",
  "TODO.md": "待办事项",
  "README.md": "项目说明",
};

const modules = import.meta.glob("../../*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

const rank = (name: string) => {
  const index = Object.keys(LABELS).indexOf(name);
  return index === -1 ? Object.keys(LABELS).length : index;
};

const docs: DocEntry[] = Object.entries(modules)
  .map(([path, content]) => {
    const name = path.split("/").pop() ?? path;
    return { name, label: LABELS[name] ?? name, html: renderMarkdown(content) };
  })
  .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));

const currentDoc = ref(docs[0]?.name ?? "");
const router = useRouter();
</script>

<style scoped>
:deep(.el-tabs__item) {
  font-size: 15px;
}
</style>
