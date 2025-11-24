<template>
  <el-tabs
    type="border-card"
    class="markdown-editor"
    @tab-change="manageHeight"
  >
    <el-tab-pane label="编辑">
      <el-input
        type="textarea"
        v-model="model"
        :placeholder="props.placeholder"
      ></el-input>
    </el-tab-pane>
    <el-tab-pane label="预览">
      <MarkdownRenderer-v3
        :content="model"
        :darkMode="darkMode"
      ></MarkdownRenderer-v3>
    </el-tab-pane>
  </el-tabs>
  <slot></slot>
</template>

<script setup>
import MarkdownRendererV3 from "./MarkdownRenderer-v3.vue";

const model = defineModel();
const props = defineProps({
  placeholder: {
    type: String,
    default: "请输入 Markdown 内容...",
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
});

const manageHeight = (name) => {
  if (name === "1") {
    const pane_0 = document.querySelector("#pane-0");
    const pane_1 = document.querySelector("#pane-1");
    if (pane_0 && pane_1) {
      pane_1.style.minHeight = `${pane_0.offsetHeight}px`;
    }
  }
};
</script>

<style scoped>
.markdown-editor {
  border-radius: 6px;
}

.markdown-editor:focus-within {
  outline: 2px solid #0969da;
  outline-offset: -1px;
}

:deep(.el-textarea__inner),
:deep(.el-textarea__inner:focus),
:deep(.el-textarea__inner:hover) {
  border: none;
  background: transparent;
  box-shadow: none;
}

:deep(.el-textarea__inner) {
  min-height: 200px !important;
  max-height: calc(100vh - 300px);
  box-sizing: border-box;
  field-sizing: content;
}

:deep(.el-tabs__header),
:deep(.el-tabs__item) {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  color: var(--c-text) !important;
}

:deep(.el-tabs__content) {
  padding: 0;
  overflow-y: auto;
}
</style>
