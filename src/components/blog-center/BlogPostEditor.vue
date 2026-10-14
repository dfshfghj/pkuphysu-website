<template>
  <div
    v-show="visible"
    class="fixed inset-0 bg-black/50 z-9999 pointer-events-auto overflow-auto acrylic unselectable content-center"
  >
    <div class="editor h-full w-full bg-background p-2 sm:h-auto sm:w-auto sm:mx-2 sm:rounded-md lg:mx-12">
      <div class="mt-2.5 ml-2.5 flex items-center">
        <X class="size-5 cursor-pointer" @click="close" />
        <span class="sm:hidden pl-4 text-lg font-bold">发布</span>
      </div>
      <AutoCompleteTagInput v-model="selectedTags" :suggestions="tagSuggestions" />
      <p class="p-2 sm:hidden border-t">正文</p>
      <MarkdownEditor
        ref="editorRef"
        v-model="content"
        :dark-mode="darkMode"
        :height="isNarrow ? 'calc(100vh - 210px)' : 800"
        :toolbar="isNarrow ? narrowToolbar : undefined"
        :extra-toolbar="extraToolbar"
      />
      <div v-if="pollConfig" class="poll-summary">
        <div class="poll-summary__head">
          <span class="poll-summary__title">投票 · {{ pollConfig.multiple ? "多选" : "单选" }}</span>
          <div class="poll-summary__actions">
            <button type="button" @click="pollVisible = true">编辑</button>
            <button type="button" @click="pollConfig = null">移除</button>
          </div>
        </div>
        <ul class="poll-summary__options">
          <li v-for="(option, index) in pollConfig.options" :key="index">{{ option }}</li>
        </ul>
      </div>
      <div v-if="surveyConfig" class="poll-summary">
        <div class="poll-summary__head">
          <span class="poll-summary__title">问卷 · {{ countQuestionBlocks(surveyConfig.blocks) }} 题</span>
          <div class="poll-summary__actions">
            <button type="button" @click="surveyVisible = true">编辑</button>
            <button type="button" @click="surveyConfig = null">移除</button>
          </div>
        </div>
        <ul class="poll-summary__options">
          <li v-for="(block, index) in surveyConfig.blocks" :key="index">{{ surveyBlockLabel(block) }}</li>
        </ul>
      </div>
      <Button type="outline" @click="submit" class="float-right mt-1.25 mb-1.25 h-6 rounded-full">
        {{ isEdit ? "保存" : "发布" }}
      </Button>
    </div>
    <QuotePostDialog v-model:visible="quoteVisible" @select="insertQuote" />
    <PollComposerDialog v-model:visible="pollVisible" :initial="pollConfig" @confirm="handlePollConfirm" />
    <SurveyComposerDialog v-model:visible="surveyVisible" :initial="surveyConfig" @confirm="handleSurveyConfirm" />
  </div>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import AutoCompleteTagInput from "@/components/AutoCompleteTagInput.vue";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";
import PollComposerDialog from "@/components/blog-center/PollComposerDialog.vue";
import SurveyComposerDialog from "@/components/survey/SurveyComposerDialog.vue";
import { buildQuoteMarkdown, createQuotePostToolbarItem, type QuoteSelection } from "@/utils/quote";
import { createPollToolbarItem, type PollConfig } from "@/utils/poll";
import { createSurveyToolbarItem, countQuestionBlocks, SURVEY_QUESTION_TYPES, type SurveyDraft, type SurveyDraftBlock } from "@/utils/survey";
import { toast } from "vue-sonner";
import { requestApi } from "@/api/api";
import { useMediaQuery } from "@vueuse/core";
import { ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  darkMode: {
    type: Boolean,
    default: undefined,
  },
  editTarget: {
    type: Object as PropType<{ id: number; content: string; tags: string[] } | null>,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "success"]);

const content = ref("");
const selectedTags = ref([]);
const tagSuggestions = ref([]);
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const isNarrow = useMediaQuery("(max-width: 639px)");
const narrowToolbar = ["upload", "|", "undo", "redo"];
const isEdit = computed(() => !!props.editTarget);

const quoteVisible = ref(false);
const pollVisible = ref(false);
const pollConfig = ref<PollConfig | null>(null);
const surveyVisible = ref(false);
const surveyConfig = ref<SurveyDraft | null>(null);

const extraToolbar = [
  "|",
  createQuotePostToolbarItem(() => {
    quoteVisible.value = true;
  }),
  createPollToolbarItem(() => {
    pollVisible.value = true;
  }),
  createSurveyToolbarItem(() => {
    surveyVisible.value = true;
  }),
];

const handlePollConfirm = (config: PollConfig) => {
  pollConfig.value = config;
};

const handleSurveyConfirm = (draft: SurveyDraft) => {
  surveyConfig.value = draft;
};

const surveyBlockLabel = (block: SurveyDraftBlock) => {
  if (block.kind === "markdown") {
    const firstLine = block.content.trim().split("\n")[0] ?? "";
    return firstLine ? firstLine.slice(0, 40) : "（Markdown）";
  }
  return SURVEY_QUESTION_TYPES.find((item) => item.value === block.type)?.label ?? block.type;
};

const insertQuote = (selection: QuoteSelection) => {
  const markdown = `\n\n${buildQuoteMarkdown(selection)}\n\n`;
  const editor = editorRef.value?.vditor;

  if (editor) {
    editor.insertValue(markdown);
    content.value = editor.getValue();
    return;
  }

  content.value = `${content.value}${markdown}`;
};

const fetchTags = async () => {
  try {
    const res = await requestApi("/api/v2/forum/tags");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    tagSuggestions.value = data.data.map((tag: any) => ({ value: tag.tag_name }));
  } catch (error) {
    console.error("Fetch tags failed:", error);
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      return;
    }
    fetchTags();
    if (props.editTarget) {
      content.value = props.editTarget.content;
      selectedTags.value = [...props.editTarget.tags];
    }
  },
  { immediate: true }
);

const close = () => {
  emit("update:visible", false);
  content.value = "";
  selectedTags.value = [];
  pollConfig.value = null;
  surveyConfig.value = null;
};

const submit = async () => {
  const currentContent = editorRef.value?.vditor?.getValue() || content.value;
  if (!currentContent.trim()) {
    toast.error("不能为空");
    return;
  }

  const editing = props.editTarget;
  const body: Record<string, unknown> = {
    text: currentContent,
    tags: selectedTags.value,
  };
  if (!editing && pollConfig.value) {
    body.poll = pollConfig.value;
  }
  if (!editing && surveyConfig.value) {
    body.survey = surveyConfig.value;
  }

  try {
    const res = await requestApi(editing ? `/api/v2/forum/posts/${editing.id}` : "/api/v2/forum/posts", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.message || "操作失败");
      return;
    }

    toast.success(data?.data?.message || (editing ? "修改成功" : "发布成功"));
    emit("success");
    close();
  } catch (error) {
    toast.error("网络错误");
    console.error("Post submit failed:", error);
  }
};
</script>

<style scoped>
.editor:deep(.vditor-editor) {
  max-height: calc(100vh - 200px);
}

.poll-summary {
  margin: 0.5rem 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--muted);
}

.poll-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.poll-summary__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
}

.poll-summary__actions {
  display: flex;
  gap: 0.5rem;
}

.poll-summary__actions button {
  padding: 0.15rem 0.4rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  cursor: pointer;
}

.poll-summary__actions button:hover {
  background: var(--card);
}

.poll-summary__options {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
  list-style: disc;
  font-size: 0.8125rem;
  color: var(--foreground);
}
</style>
