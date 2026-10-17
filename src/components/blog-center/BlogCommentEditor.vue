<template>
  <transition
    enter-active-class="transition-all duration-300 ease-in-out"
    leave-active-class="transition-all duration-300 ease-in-out"
    enter-from-class="opacity-0 translate-y-5"
    leave-to-class="opacity-0 translate-y-5"
  >
    <div
      class="bg-card box-border flex border-t border-(--border) p-2.5 items-center fixed inset-x-0 z-9999 w-full sm:absolute"
      :style="dockStyle"
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
          ? 'is-fullscreen fixed inset-0 z-9999 h-full rounded-none pt-[var(--safe-top)] pl-[var(--safe-left)] pr-[var(--safe-right)]'
          : 'rounded-t fixed inset-x-0 z-9999 w-full sm:absolute'
      "
      :style="sheetStyle"
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
        <div class="py-1 pl-3 pr-12 text-right sm:pr-3">
          <a
            href="/guide?editor=comment"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-muted-foreground hover:underline"
            >工具栏教程 ↗</a
          >
        </div>
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
          <Button class="h-6 rounded-full mb-1 mr-2" :disabled="submitting" @click="handleSubmit"> 发送 </Button>
        </div>
        <QuotePostDialog v-model:visible="quoteVisible" @select="insertQuote" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import MarkdownEditor from "../MarkdownEditor.vue";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";
import { buildQuoteMarkdown, type QuoteSelection } from "@/utils/quote";
import { Maximize2, Minimize2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { requestApi } from "../../api/api";
import { useForumStore } from "@/stores/forum";
import { commentExtraToolbar } from "@/utils/editor-toolbar";
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
const submitting = ref(false);
const forumStore = useForumStore();

const extraToolbar = commentExtraToolbar(() => {
  quoteVisible.value = true;
});

const dockStyle = {
  bottom: "var(--kb-inset)",
  paddingBottom: "calc(0.625rem + max(0px, var(--safe-bottom) - var(--kb-inset)))",
};

const sheetStyle = computed(() =>
  isFullscreen.value
    ? { paddingBottom: "calc(var(--safe-bottom) + var(--kb-inset))" }
    : { bottom: "var(--kb-inset)", paddingBottom: "max(0px, var(--safe-bottom) - var(--kb-inset))" }
);

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
  if (submitting.value) return;
  const currentContent = editorRef.value?.vditor?.getValue() || content.value;
  if (!currentContent.trim()) {
    toast.error("评论内容不能为空");
    return;
  }

  const postId = props.postId;
  const session = forumStore.session;
  submitting.value = true;
  try {
    const res = await requestApi("/api/v2/forum/comments", {
      method: "POST",
      body: JSON.stringify({
        text: currentContent,
        pid: postId,
        quote: props.quote ? props.quote : null,
      }),
    });
    if (!res.ok) throw new Error("上传失败");
    if (forumStore.session !== session) return;
    // The editor may have unmounted while submitting; shared data must still update.
    void forumStore.refreshPost(postId);

    toast.success("评论成功");

    content.value = "";
    isEditing.value = false;
    emit("success");
  } catch (error) {
    if (forumStore.session !== session) return;
    toast.error("网络错误");
    console.error("Comment submit failed:", error);
  } finally {
    submitting.value = false;
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
