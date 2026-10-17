<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMediaQuery } from "@vueuse/core";
import { ArrowLeft, Check } from "lucide-vue-next";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";
import PollComposerDialog from "@/components/blog-center/PollComposerDialog.vue";
import SurveyComposerDialog from "@/components/survey/SurveyComposerDialog.vue";
import ScrollPane from "@/components/ScrollPane.vue";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user";
import { useOnboardingStore } from "@/stores/onboarding";
import { buildQuoteMarkdown, type QuoteSelection } from "@/utils/quote";
import type { PollConfig } from "@/utils/poll";
import { countQuestionBlocks, SURVEY_QUESTION_TYPES, type SurveyDraft, type SurveyDraftBlock } from "@/utils/survey";
import {
  DEFAULT_EDITOR_TOOLBAR,
  POST_MOBILE_TOOLBAR,
  postExtraToolbar,
  commentExtraToolbar,
} from "@/utils/editor-toolbar";

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const onboarding = useOnboardingStore();
const narrow = useMediaQuery("(max-width: 639px)");
const kind = computed(() => (route.query.editor === "comment" ? "comment" : "post"));
const mobilePost = computed(() => kind.value === "post" && narrow.value);
const editor = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const topic = ref("upload");
const completed = ref(false);
const quoteVisible = ref(false);
const pollVisible = ref(false);
const pollConfig = ref<PollConfig | null>(null);
const surveyVisible = ref(false);
const surveyConfig = ref<SurveyDraft | null>(null);
const drafts = ref({
  post: "在这里试试工具栏，练习内容不会发布。\n\n选中这句话，试试加粗或插入链接。",
  comment: "在这里练习写评论，可以使用格式、图片和帖子引用。",
});
const topics = computed(() => [
  ...(!mobilePost.value
    ? [
        {
          id: "bold",
          label: "文字格式",
          text: "先选中文字，再点击 B 加粗、I 斜体或链接图标。标题、列表、代码和表格也可以从工具栏插入。",
          example: "**加粗**　*斜体*　[链接](https://example.com)",
        },
      ]
    : []),
  {
    id: "upload",
    label: "图片/文件",
    text: "点击上传按钮选择并上传文件，也可以直接粘贴图片。",
    example: "![图片说明](图片地址) / [文件说明](文件地址)",
  },
  {
    id: "quote-post",
    label: "引用帖子",
    text: "引用帖子按钮会打开选择器，支持论坛和树洞帖子。",
    example: "[#101](/101)",
  },
  ...(kind.value === "post"
    ? [
        {
          id: "poll",
          label: "发起投票",
          text: "柱状图图标用于配置单选或多选投票。练习区可以完整配置、编辑和移除投票，但不会提交到数据库。",
          example: "选择单选 / 多选 → 填写选项 → 确认 → 查看配置",
        },
        {
          id: "survey",
          label: "发起问卷",
          text: "清单图标用于添加问卷，可以组合题目和说明文字。练习区可以完整配置、编辑和移除问卷，但不会提交到数据库。",
          example: "添加题目 → 配置题型 → 确认 → 查看配置",
        },
      ]
    : []),
  ...(!mobilePost.value
    ? [
        {
          id: "edit-mode",
          label: "编辑模式",
          text: "编辑模式按钮可以切换即时渲染、所见即所得和 Markdown 源码模式。更多菜单中还有分屏预览等功能。",
          example: "即时渲染：输入 Markdown 后直接看到排版效果",
        },
      ]
    : []),
]);
const current = computed(() => topics.value.find((item) => item.id === topic.value) ?? topics.value[0]!);
const insert = (value: string) => {
  if (editor.value?.vditor) {
    editor.value.vditor.insertValue(value);
    drafts.value[kind.value] = editor.value.vditor.getValue();
  } else drafts.value[kind.value] += value;
};
const openQuote = () => {
  topic.value = "quote-post";
  quoteVisible.value = true;
};
const insertQuote = (selection: QuoteSelection) => {
  insert(`\n\n${buildQuoteMarkdown(selection)}\n\n`);
};
const openPoll = () => {
  topic.value = "poll";
  pollVisible.value = true;
};
const openSurvey = () => {
  topic.value = "survey";
  surveyVisible.value = true;
};
const confirmPoll = (config: PollConfig) => {
  pollConfig.value = config;
};
const confirmSurvey = (draft: SurveyDraft) => {
  surveyConfig.value = draft;
};
const surveyBlockLabel = (block: SurveyDraftBlock) => {
  if (block.kind === "markdown") {
    const firstLine = block.content.trim().split("\n")[0] ?? "";
    return firstLine ? firstLine.slice(0, 40) : "（Markdown）";
  }
  return SURVEY_QUESTION_TYPES.find((item) => item.value === block.type)?.label ?? block.type;
};
const extraToolbar = computed(() =>
  kind.value === "post" ? postExtraToolbar(openQuote, openPoll, openSurvey) : commentExtraToolbar(openQuote)
);
const toolbar = computed(() => (mobilePost.value ? POST_MOBILE_TOOLBAR : DEFAULT_EDITOR_TOOLBAR));
const selectEditor = (value: string) => router.replace({ query: { ...route.query, editor: value } });
watch(kind, () => {
  topic.value = "upload";
  pollConfig.value = null;
  surveyConfig.value = null;
});
watch(
  () => (user.isLoggedIn ? user.userid : null),
  (id) => {
    onboarding.identify(id ? String(id) : null);
    onboarding.start();
    completed.value = false;
  },
  { immediate: true }
);
const complete = () => {
  if (completed.value) return;
  onboarding.complete();
  completed.value = true;
  void router.push({ name: "PostsView" });
};
</script>

<template>
  <ScrollPane>
    <div class="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <RouterLink
        to="/"
        class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft class="size-4" />返回论坛
      </RouterLink>
      <h1 class="text-xl! font-semibold">编辑器工具栏教程</h1>
      <p class="mt-2 text-sm leading-6 text-muted-foreground">练习区可以做测试，不会发布内容。</p>
      <div class="mt-5 flex gap-2 border-b border-border pb-3" aria-label="教程类型">
        <Button
          :variant="kind === 'post' ? 'default' : 'ghost'"
          :aria-pressed="kind === 'post'"
          @click="selectEditor('post')"
          >发布帖子</Button
        >
        <Button
          :variant="kind === 'comment' ? 'default' : 'ghost'"
          :aria-pressed="kind === 'comment'"
          @click="selectEditor('comment')"
          >发表评论</Button
        >
      </div>
      <div class="mt-4 flex flex-wrap gap-2" aria-label="工具栏功能">
        <Button
          v-for="item in topics"
          :key="item.id"
          size="sm"
          :variant="current.id === item.id ? 'secondary' : 'ghost'"
          :aria-pressed="current.id === item.id"
          @click="topic = item.id"
          >{{ item.label }}</Button
        >
      </div>
      <section class="mt-3 rounded-lg border border-border bg-muted/40 p-4" aria-live="polite">
        <h2 class="text-sm font-semibold">{{ current.label }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ current.text }}</p>
        <code class="mt-3 block whitespace-normal break-words text-xs leading-6">{{ current.example }}</code>
      </section>
      <p v-if="mobilePost" class="mt-3 text-xs leading-5 text-muted-foreground">
        手机发帖工具栏保留图片、撤销、重做、引用帖子、投票和问卷。粗体、列表等格式可以直接输入 Markdown 标记。
      </p>
      <p v-if="kind === 'comment'" class="mt-3 text-sm leading-6 text-muted-foreground">
        回复某条评论：在帖子详情中点击一条评论，编辑框会显示引用作者；评论不包含投票和问卷入口。
      </p>
      <section class="mt-5 overflow-hidden rounded-lg border border-border bg-card">
        <div class="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <h2 class="text-sm font-medium">{{ kind === "post" ? "发帖" : "评论" }}练习区</h2>
        </div>
        <div :class="{ 'comment-practice': kind === 'comment' }">
          <MarkdownEditor
            ref="editor"
            :key="kind + String(narrow)"
            v-model="drafts[kind]"
            :height="kind === 'post' ? 260 : 200"
            :toolbar="toolbar"
            :extra-toolbar="extraToolbar"
            :cache-enabled="false"
            :highlight-toolbar-item="current.id"
          />
        </div>
        <div v-if="pollConfig" class="practice-summary">
          <div class="practice-summary__head">
            <span class="practice-summary__title">投票 · {{ pollConfig.multiple ? "多选" : "单选" }}</span>
            <div class="practice-summary__actions">
              <button type="button" @click="pollVisible = true">编辑</button>
              <button type="button" @click="pollConfig = null">移除</button>
            </div>
          </div>
          <ul class="practice-summary__options">
            <li v-for="(option, index) in pollConfig.options" :key="index">{{ option }}</li>
          </ul>
        </div>
        <div v-if="surveyConfig" class="practice-summary">
          <div class="practice-summary__head">
            <span class="practice-summary__title">问卷 · {{ countQuestionBlocks(surveyConfig.blocks) }} 题</span>
            <div class="practice-summary__actions">
              <button type="button" @click="surveyVisible = true">编辑</button>
              <button type="button" @click="surveyConfig = null">移除</button>
            </div>
          </div>
          <ul class="practice-summary__options">
            <li v-for="(block, index) in surveyConfig.blocks" :key="index">{{ surveyBlockLabel(block) }}</li>
          </ul>
        </div>
      </section>
      <p class="mt-3 text-xs leading-5 text-muted-foreground">
        工具栏显示不全时，使用左右箭头翻页。电脑上将鼠标停在图标上可以查看名称。真实编辑器中，帖子用「发布」，评论用「发送」。
      </p>
      <div class="mt-6 flex justify-end">
        <Button data-action="complete-guide" :disabled="completed" @click="complete"
          ><Check class="size-4" />{{ completed ? "已完成" : "结束教程" }}</Button
        >
      </div>
    </div>
    <QuotePostDialog v-model:visible="quoteVisible" @select="insertQuote" />
    <PollComposerDialog v-model:visible="pollVisible" :initial="pollConfig" @confirm="confirmPoll" />
    <SurveyComposerDialog v-model:visible="surveyVisible" :initial="surveyConfig" @confirm="confirmSurvey" />
  </ScrollPane>
</template>

<style scoped>
.comment-practice :deep(.vditor) {
  display: flex;
  flex-direction: column;
}
.comment-practice :deep(.vditor-content) {
  order: 0;
}
.comment-practice :deep(.vditor-toolbar) {
  order: 1;
  border-top: 1px solid var(--border);
  border-bottom: none;
}

.practice-summary {
  margin: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--muted);
}

.practice-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.practice-summary__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
}

.practice-summary__actions {
  display: flex;
  gap: 0.5rem;
}

.practice-summary__actions button {
  padding: 0.15rem 0.4rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  cursor: pointer;
}

.practice-summary__actions button:hover {
  background: var(--card);
}

.practice-summary__options {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
  list-style: disc;
  font-size: 0.8125rem;
  color: var(--foreground);
}
</style>
