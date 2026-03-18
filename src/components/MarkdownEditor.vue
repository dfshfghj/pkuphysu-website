<template>
  <div class="vditor-container">
    <div ref="vditorRef" class="vditor-editor"></div>
  </div>
</template>

<script setup>
import Vditor from "vditor";
import "vditor/dist/index.css";
import { nextTick } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  mode: {
    type: String,
    default: "ir",
  },
  height: {
    type: Number,
    default: null,
  },
  minHeight: {
    type: Number,
    default: null,
  },
  placeholder: {
    type: String,
    default: "请输入 Markdown 内容...",
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
  hideToolbar: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change", "save"]);

const vditorRef = ref(null);
const vditor = ref(null);
const currentMode = ref(props.mode);
const isDarkMode = ref(props.darkMode);
let isInternalUpdate = false;

onMounted(async () => {
  await nextTick();
  initVditor();
});

onBeforeUnmount(() => {
  if (vditor.value) {
    vditor.value.destroy();
    vditor.value = null;
  }
});

const initVditor = () => {
  const theme = isDarkMode.value ? "dark" : "classic";
  const preview_theme = isDarkMode.value ? "dark" : "light";
  const hljs_style = isDarkMode.value ? "github-dark" : "github";
  vditor.value = new Vditor(vditorRef.value, {
    cdn: "/vditor",
    height: props.height,
    minHeight: props.minHeight,
    mode: currentMode.value,
    theme: theme,
    cache: {
      id: "MarkdownCache",
    },
    image: {
      isPreview: false,
    },
    toolbar: [
      "headings",
      "bold",
      "italic",
      "strike",
      "link",
      "|",
      "list",
      "ordered-list",
      "check",
      "code",
      "table",
      "upload",
      "|",
      "undo",
      "redo",
      "|",
      "edit-mode",
      {
        name: "more",
        toolbar: ["both", "export", "outline"],
      },
    ],
    toolbarConfig: {
      hide: props.hideToolbar,
    },
    preview: {
      url: "/api/v2/markdown/preview",
      delay: 200,
      hljs: {
        style: hljs_style,
        lineNumber: true,
      },
      math: {
        inlineDigit: true,
        macros: {},
      },
      theme: {
        current: preview_theme,
      },
      actions: [],
    },
    upload: {
      url: "/api/v2/files/upload",
      max: 5 * 1024 * 1024, // 5MB
      format: (files, responseText) => {
        const originalResponse = JSON.parse(responseText);
        let succMap = {};
        originalResponse.files.forEach((file) => {
          succMap[file.originalName] = `/api/v2/static${file.url}`;
        });
        const vditorFormat = {
          code: originalResponse.success ? 0 : 1,
          msg: originalResponse.message || "",
          data: {
            errFiles: [],
            succMap: succMap,
          },
        };
        return JSON.stringify(vditorFormat);
      },
    },
    input: (value) => {
      if (!isInternalUpdate) {
        emit("update:modelValue", value);
        emit("change", value);
      }
      isInternalUpdate = false;
    },
    after: () => {
      setValue(props.modelValue);
    },
    typewriterMode: true,
  });
};

const setValue = (content) => {
  isInternalUpdate = true;
  vditor.value.setValue(content);
  nextTick(() => {
    isInternalUpdate = false;
  });
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (vditor.value && newVal !== vditor.value.getValue()) {
      setValue(newVal);
    }
  }
);

watch(
  () => props.darkMode,
  (newVal) => {
    if (newVal !== isDarkMode.value) {
      isDarkMode.value = newVal;
      if (vditor.value) {
        const theme = isDarkMode.value ? "dark" : "classic";
        const contentTheme = isDarkMode.value ? "dark" : "light";
        const codeTheme = isDarkMode.value ? "github-dark" : "github";
        vditor.value.setTheme(theme, contentTheme, codeTheme);
      }
    }
  }
);

// 暴露vditor实例供父组件访问
defineExpose({
  vditor: vditor,
});
</script>

<style>
.vditor-toolbar--hide {
  height: 8px;
  background-color: var(--panel-background-color);
  border: none;
}
</style>
