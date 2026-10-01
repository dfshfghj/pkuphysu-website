<template>
  <div
    v-show="visible"
    class="fixed inset-0 bg-black/50 z-9999 pointer-events-auto overflow-auto acrylic unselectable content-center"
  >
    <div class="editor h-full w-full bg-background p-2 sm:h-auto sm:w-auto sm:mx-2 sm:rounded-md lg:mx-12">
      <div class="mt-2.5 ml-2.5 flex items-center">
        <el-icon size="20" @click="close">
          <Close />
        </el-icon>
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
      <Button type="outline" @click="submit" class="float-right mt-1.25 mb-1.25">
        {{ isEdit ? "保存" : "发布" }}
      </Button>
    </div>
    <QuotePostDialog v-model:visible="quoteVisible" @select="insertQuote" />
  </div>
</template>

<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import AutoCompleteTagInput from "@/components/AutoCompleteTagInput.vue";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";
import { buildPostQuoteMarkdown } from "@/utils/post-quote";
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

const QUOTE_POST_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <rect x="4" y="5" width="2.5" height="2.5" rx="0.6" fill="currentColor"/>
  <rect x="7.5" y="5" width="4.5" height="1.4" rx="0.7" fill="currentColor"/>
  <rect x="4" y="9" width="8" height="1.4" rx="0.7" fill="currentColor"/>
</svg>`;

const extraToolbar = [
  "|",
  {
    name: "quote-post",
    tip: "引用帖子",
    icon: QUOTE_POST_ICON,
    click: () => {
      quoteVisible.value = true;
    },
  },
];

const insertQuote = (id: number) => {
  const markdown = `\n\n${buildPostQuoteMarkdown(id)}\n\n`;
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
  }
);

const close = () => {
  emit("update:visible", false);
  content.value = "";
  selectedTags.value = [];
};

const submit = async () => {
  const currentContent = editorRef.value?.vditor?.getValue() || content.value;
  if (!currentContent.trim()) {
    toast.error("不能为空");
    return;
  }

  const editing = props.editTarget;
  try {
    const res = await requestApi(editing ? `/api/v2/forum/posts/${editing.id}` : "/api/v2/forum/posts", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: currentContent,
        tags: selectedTags.value,
      }),
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
.editor:deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: transparent;
}

.editor:deep(.vditor) {
  --panel-background-color: var(--card);
  --textarea-background-color: var(--card);
}

.editor:deep(.vditor-editor) {
  max-height: calc(100vh - 200px);
}
</style>
