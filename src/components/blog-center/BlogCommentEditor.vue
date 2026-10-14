<template>
  <transition
    enter-active-class="transition-all duration-300 ease-in-out"
    leave-active-class="transition-all duration-300 ease-in-out"
    enter-from-class="opacity-0 translate-y-5"
    leave-to-class="opacity-0 translate-y-5"
  >
    <div
      class="bg-card box-border flex border-t border-(--border) p-2.5 items-center fixed inset-x-0 bottom-0 z-9999 w-full sm:absolute pb-[calc(0.625rem_+_var(--safe-bottom))]"
      data-comment-editor
      v-if="!isEditing"
      key="simp"
    >
      <div class="flex-1">
        <div v-if="quote" class="pl-4">
          <span class="text-sm text-muted-foreground!">
            {{ `@${quoteName}: ` }}
          </span>
        </div>
        <div
          class="py-1 sm:py-3 pl-4 pr-1 bg-background sm:border border-(--border) rounded-full sm:rounded-md text-[14px] unselectable"
          @click="toggleEdit(true)"
        >
          <span> {{ content.trim() ? content.trim() : "评论" }} </span>
        </div>
      </div>
    </div>
    <div
      class="box-border flex bg-card sm:border-t border-(--border) unselectable"
      :class="
        isFullscreen
          ? 'is-fullscreen fixed inset-0 z-9999 h-full rounded-none pt-[var(--safe-top)] pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)]'
          : 'rounded-t fixed inset-x-0 bottom-0 z-9999 w-full sm:absolute pb-[var(--safe-bottom)]'
      "
      data-comment-editor
      v-else
      key="full"
    >
      <div class="w-full flex flex-col-reverse relative" :class="{ 'h-full': isFullscreen }">
        <MarkdownEditor
          ref="editorRef"
          v-model="content"
          :dark-mode="darkMode"
          :height="200"
          :extra-toolbar="extraToolbar"
          autofocus
        />
        <div v-if="quote" class="p-3 sm:pl-[35px]">
          <span class="text-sm text-muted-foreground!">
            {{ `@${quoteName}: ` }}
          </span>
        </div>
        <div class="fullscreen-toggle absolute top-0 right-0 flex items-center sm:hidden">
          <Button variant="ghost" size="icon-sm" @click="isFullscreen = !isFullscreen">
            <Minimize2 v-if="isFullscreen" />
            <Maximize2 v-else />
          </Button>
        </div>
        <div class="absolute bottom-0 right-0 flex items-center gap-2">
          <Button class="h-6 rounded-full mb-1 mr-2" @click="handleSubmit"> 发送 </Button>
        </div>
        <QuotePostDialog v-model:visible="quoteVisible" @select="insertQuote" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import MarkdownEditor from "../MarkdownEditor.vue";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";
import { buildQuoteMarkdown, createQuotePostToolbarItem, type QuoteSelection } from "@/utils/quote";
import { Maximize2, Minimize2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { requestApi } from "../../api/api";
import { ref, watch, onMounted, onUnmounted } from "vue";
const emit = defineEmits(["success", "clear-quote"]);

const props = defineProps({
  quote: {
    type: [String, Number, null],
    default: null,
  },
  quoteName: {
    type: String,
    default: "",
  },
  darkMode: {
    type: Boolean,
    default: undefined,
  },
  postId: {
    type: Number,
    required: true,
  },
});

const content = ref("");
const isEditing = ref(false);
const editorRef = ref(null);
const quoteVisible = ref(false);
const isFullscreen = ref(false);

const extraToolbar = [
  "|",
  createQuotePostToolbarItem(() => {
    quoteVisible.value = true;
  }),
];

const toggleEdit = (editing: boolean) => {
  isEditing.value = editing;
};

const handleDocumentClick = (event: MouseEvent) => {
  if (!isEditing.value || quoteVisible.value) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (!target || typeof target.closest !== "function") {
    return;
  }

  const inside = target.closest(
    '[data-comment-editor], .comment-card, [role="dialog"], [role="alertdialog"], [role="menu"], [data-slot="dialog-overlay"], [data-slot="dropdown-menu-content"]'
  );
  if (!inside) {
    isEditing.value = false;
    if (props.quote) {
      emit("clear-quote");
    }
  }
};

onMounted(() => document.addEventListener("click", handleDocumentClick));
onUnmounted(() => document.removeEventListener("click", handleDocumentClick));

watch(
  () => props.quote,
  (quote) => {
    if (quote) {
      isEditing.value = true;
    }
  }
);

watch(isEditing, (editing) => {
  if (!editing) {
    isFullscreen.value = false;
  }
});

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

const handleSubmit = async () => {
  const currentContent = editorRef.value?.vditor?.getValue() || content.value;
  if (!currentContent.trim()) {
    toast.error("评论内容不能为空");
    return;
  }

  try {
    const res = await requestApi("/api/v2/forum/comments", {
      method: "POST",
      body: JSON.stringify({
        text: currentContent,
        pid: props.postId,
        quote: props.quote ? props.quote : null,
      }),
    });
    if (!res.ok) throw new Error("上传失败");

    toast.success("评论成功");

    content.value = "";
    isEditing.value = false;
    emit("success");
  } catch (error) {
    toast.error("网络错误");
    console.error("Comment submit failed:", error);
  }
};
</script>

<style>
[data-comment-editor] .vditor-content {
  order: 0;
}

[data-comment-editor] .vditor-toolbar {
  order: 1;
  background-color: transparent;
  border-bottom: none;
  margin-right: 76px;
}

[data-comment-editor] .vditor-toolbar .vditor-hint,
[data-comment-editor] .vditor-toolbar .vditor-panel {
  top: auto;
  bottom: 100%;
}

[data-comment-editor] .vditor-toolbar .vditor-panel--arrow:before {
  top: auto;
  bottom: -14px;
  border-bottom-color: transparent;
  border-top-color: var(--panel-background-color);
}

[data-comment-editor].is-fullscreen .vditor-container {
  flex: 1;
  min-height: 0;
}

[data-comment-editor].is-fullscreen .vditor {
  height: 100% !important;
}
</style>
