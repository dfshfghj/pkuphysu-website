<template>
  <div
    v-show="visible"
    class="fixed inset-0 bg-black/50 z-9999 pointer-events-auto overflow-auto acrylic unselectable content-center"
  >
    <div class="editor p-2 mx-2 content-center bg-background rounded-md lg:mx-12">
      <div class="mt-2.5 ml-2.5">
        <el-icon size="20" @click="close">
          <Close />
        </el-icon>
      </div>
      <AutoCompleteTagInput v-model="selectedTags" :suggestions="tagSuggestions" />
      <MarkdownEditor ref="editorRef" v-model="content" :dark-mode="darkMode" :height="800" />
      <Button type="outline" @click="submit" class="float-right mt-1.25 mb-1.25">发布</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import AutoCompleteTagInput from "@/components/AutoCompleteTagInput.vue";
import { toast } from "vue-sonner";
import { requestApi } from "@/api/api";
import { ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:visible", "success"]);

const content = ref("");
const selectedTags = ref([]);
const tagSuggestions = ref([]);
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);

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
    if (newVal) {
      fetchTags();
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

  try {
    const res = await requestApi("/api/v2/forum/posts", {
      method: "POST",
      body: JSON.stringify({
        text: currentContent,
        tags: selectedTags.value,
      }),
    });
    if (!res.ok) throw new Error("上传失败");

    toast.success("发布成功");
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
</style>
