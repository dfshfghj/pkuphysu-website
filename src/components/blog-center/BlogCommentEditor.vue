<template>
  <transition name="slide">
    <div
      class="box-border flex bg-(--c-card) border-t border-(--c-border) rounded-t p-2.5 items-center absolute z-9999 bottom-0 w-full"
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
          class="py-1 pl-4 pr-1 mr-8 bg-(--c-background) border border-(--c-border) rounded-full shadow-[0_0_6px_rgba(0,0,0,0.12)] text-[13px] unselectable"
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
      class="box-border flex p-1 bg-(--c-card) border-t border-(--c-border) rounded-t absolute z-9999 bottom-0 w-full unselectable"
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
        <button @click="handleSubmit" class="absolute bottom-2.5 right-0 bg-transparent! m-y-1 border-none!">
          发送
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ArrowUpBold, ArrowDownBold } from "@element-plus/icons-vue";
import MarkdownEditor from "../MarkdownEditor.vue";
import { ElMessage } from "element-plus";
import { requestApi } from "../../api/api";
import { ref } from "vue";

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
    default: false,
  },
  postId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["success"]);

const content = ref("");
const isEditing = ref(false);
const editorRef = ref(null);

const toggleEdit = (editing) => {
  isEditing.value = editing;
};

const handleSubmit = async () => {
  const currentContent = editorRef.value?.vditor?.getValue() || content.value;
  if (!currentContent.trim()) {
    ElMessage.error("评论内容不能为空");
    return;
  }

  try {
    const res = await requestApi("/api/v2/forum/comments", {
      method: "POST",
      body: JSON.stringify({
        text: currentContent,
        pid: props.postId,
        quote: props.quote,
      }),
    });
    if (!res.ok) throw new Error("上传失败");

    ElMessage.success("评论成功");
    emit("success");

    content.value = "";
  } catch (error) {
    ElMessage.error("网络错误");
    console.error("Comment submit failed:", error);
  }
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
