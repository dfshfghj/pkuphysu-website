<template>
  <ScrollPane>
    <div class="mx-auto min-h-lvh w-full max-w-4xl px-4 py-6">
      <div class="mb-4 flex items-center gap-3">
        <ChevronLeft :stroke-width="3" class="size-5 cursor-pointer" @click="router.back()" />
        <h1 class="text-xl font-bold sm:font-serif">关于本站</h1>
        <div class="flex-1"></div>
        <RouterLink to="/" class="text-sm text-(--c-secondary) hover:text-(--c-title)">进入论坛</RouterLink>
      </div>

      <Tabs v-model="currentDoc" class="mt-px gap-0">
        <TabsList
          class="h-10 w-full items-stretch justify-start gap-10 rounded-none border-b border-(--c-border) bg-transparent p-0"
        >
          <TabsTrigger
            v-for="doc in docs"
            :key="doc.name"
            :value="doc.name"
            class="h-full flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-[15px] text-(--c-secondary) shadow-none data-[state=active]:border-(--c-brand) data-[state=active]:bg-transparent data-[state=active]:text-(--c-brand) data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
          >
            {{ doc.label }}
          </TabsTrigger>
        </TabsList>
        <TabsContent v-for="doc in docs" :key="doc.name" :value="doc.name" class="pt-[14px]">
          <div class="markdown-body" v-html="doc.html"></div>
        </TabsContent>
      </Tabs>
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import ScrollPane from "@/components/ScrollPane.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderMarkdown } from "@/utils/markdown";
import { ChevronLeft } from "lucide-vue-next";
import "@/styles/github-markdown.css";
import "katex/dist/katex.min.css";

interface DocEntry {
  name: string;
  label: string;
  html: string;
}

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
