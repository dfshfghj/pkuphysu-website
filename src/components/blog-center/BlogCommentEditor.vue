<template>
  <transition
    enter-active-class="transition-all duration-300 ease-in-out"
    leave-active-class="transition-all duration-300 ease-in-out"
    enter-from-class="opacity-0 translate-y-5"
    leave-to-class="opacity-0 translate-y-5"
  >
    <div
      class="box-border flex bg-card border-t border-(--c-border) rounded-t p-2.5 items-center absolute z-9999 bottom-0 w-full"
      v-if="!isEditing"
      key="simp"
    >
      <div class="flex-1">
        <div v-if="quote">
          <span class="text-sm text-(--c-secondary)!">
            {{ `@${quoteName}: ` }}
          </span>
        </div>
        <div
          class="py-1 pl-4 pr-1 mr-8 bg-background border border-(--c-border) rounded-full shadow-[0_0_6px_rgba(0,0,0,0.12)] text-[13px] unselectable"
          @click="toggleEdit(true)"
        >
          <span> {{ content.trim() ? content.trim() : "评论" }} </span>
        </div>
      </div>
      <el-icon @click="toggleEdit(true)">
        <ArrowUpBold />
      </el-icon>
    </div>
    <div
      class="box-border flex p-1 bg-card border-t border-(--c-border) rounded-t absolute z-9999 bottom-0 w-full unselectable"
      v-else
      key="full"
    >
      <div class="w-full flex flex-col-reverse relative">
        <MarkdownEditor ref="editorRef" v-model="content" :dark-mode="darkMode" :height="200" :hide-toolbar="true" />
        <div v-if="quote">
          <span class="text-sm text-(--c-secondary)!">
            {{ `@${quoteName}: ` }}
          </span>
        </div>
        <el-icon @click="toggleEdit(false)" class="absolute! bottom-40 right-6">
          <ArrowDownBold />
        </el-icon>
        <div class="absolute bottom-2 right-2 m-y-1 flex items-center gap-2">
          <Button variant="outline" @click="quoteVisible = true"> 引用 </Button>
          <Button variant="outline" @click="handleSubmit"> 发送 </Button>
        </div>
        <QuotePostDialog v-model:visible="quoteVisible" @select="insertQuote" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ArrowUpBold, ArrowDownBold } from "@element-plus/icons-vue";
import MarkdownEditor from "../MarkdownEditor.vue";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";
import { buildPostQuoteMarkdown } from "@/utils/post-quote";
import { toast } from "vue-sonner";
import { requestApi } from "../../api/api";
import { ref } from "vue";
const emit = defineEmits(["success"]);

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

const toggleEdit = (editing: boolean) => {
  isEditing.value = editing;
};

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
