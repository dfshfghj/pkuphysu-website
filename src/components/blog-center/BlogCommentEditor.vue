<template>
  <transition
    enter-active-class="transition-all duration-300 ease-in-out"
    leave-active-class="transition-all duration-300 ease-in-out"
    enter-from-class="opacity-0 translate-y-5"
    leave-to-class="opacity-0 translate-y-5"
  >
    <div
      class="box-border flex bg-card border-t border-(--border) rounded-t p-2.5 items-center absolute z-9999 bottom-0 w-full"
      data-comment-editor
      v-if="!isEditing"
      key="simp"
    >
      <div class="flex-1">
        <div v-if="quote">
          <span class="text-sm text-muted-foreground!">
            {{ `@${quoteName}: ` }}
          </span>
        </div>
        <div
          class="py-1 pl-4 pr-1 bg-background border border-(--border) rounded-full shadow-[0_0_6px_rgba(0,0,0,0.12)] text-[13px] unselectable"
          @click="toggleEdit(true)"
        >
          <span> {{ content.trim() ? content.trim() : "评论" }} </span>
        </div>
      </div>
    </div>
    <div
      class="box-border flex p-1 bg-card border-t border-(--border) rounded-t absolute z-9999 bottom-0 w-full unselectable"
      data-comment-editor
      v-else
      key="full"
    >
      <div class="w-full flex flex-col-reverse relative">
        <MarkdownEditor
          ref="editorRef"
          v-model="content"
          :dark-mode="darkMode"
          :height="200"
          :extra-toolbar="extraToolbar"
          autofocus
        />
        <div v-if="quote">
          <span class="text-sm text-muted-foreground!">
            {{ `@${quoteName}: ` }}
          </span>
        </div>
        <div class="absolute bottom-2 right-2 m-y-1 flex items-center gap-2">
          <Button variant="outline" @click="handleSubmit"> 发送 </Button>
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
