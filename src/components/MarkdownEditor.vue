<template>
  <div
    class="vditor-container"
    :class="{ 'markdown-theme-dark': isDarkMode }"
    :data-theme="isDarkMode ? 'dark' : 'light'"
  >
    <div ref="vditorRef" class="vditor-editor"></div>
    <div v-if="!preview" ref="toolbarNavRef" class="vditor-toolbar-nav">
      <span class="vditor-toolbar-nav__fade vditor-toolbar-nav__fade--left" :class="{ 'is-hidden': !canPageLeft }" />
      <span class="vditor-toolbar-nav__fade vditor-toolbar-nav__fade--right" :class="{ 'is-hidden': !canPageRight }" />
      <button
        type="button"
        class="vditor-toolbar-nav__btn"
        :class="{ 'is-hidden': !canPageLeft }"
        aria-label="向左翻页"
        @click="pageToolbar(-1)"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        class="vditor-toolbar-nav__btn"
        :class="{ 'is-hidden': !canPageRight }"
        aria-label="向右翻页"
        @click="pageToolbar(1)"
      >
        <ChevronRight />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Vditor from "vditor";
import vditorPackage from "vditor/package.json";
import "vditor/dist/index.css";
import "@/styles/editor-markdown.css";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { nextTick } from "vue";
import { isDark } from "@/composables/theme";
import { apiBase } from "@/utils/api-url";
import { buildMentionMarkdown } from "@/utils/mention";
import { searchUsers } from "@/utils/user-search";
import { prepareVditorPreview } from "@/utils/vditor-preview";
import { DEFAULT_EDITOR_TOOLBAR } from "@/utils/editor-toolbar";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  mode: {
    type: String as PropType<"ir" | "wysiwyg" | "sv">,
    default: "ir",
  },
  height: {
    type: [Number, String],
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
    default: undefined,
  },
  hideToolbar: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  preview: {
    type: Boolean,
    default: false,
  },
  toolbar: {
    type: Array as PropType<(string | Record<string, unknown>)[]>,
    default: undefined,
  },
  cacheEnabled: { type: Boolean, default: true },
  highlightToolbarItem: { type: String, default: "" },
  extraToolbar: {
    type: Array as PropType<(string | Record<string, unknown>)[]>,
    default: undefined,
  },
});

const emit = defineEmits(["update:modelValue", "change", "save"]);

const vditorRef = ref<HTMLElement | null>(null);
const vditor = ref<Vditor | null>(null);
const toolbarNavRef = ref<HTMLElement | null>(null);
const currentMode = ref(props.mode);
const isDarkMode = ref(props.darkMode ?? isDark.value);
const canPageLeft = ref(false);
const canPageRight = ref(false);
let isInternalUpdate = false;
let toolbarEl: HTMLElement | null = null;
let toolbarShift = 0;
let toolbarMaxShift = 0;
let detachToolbarNav: (() => void) | null = null;

onMounted(async () => {
  await nextTick();
  if (props.preview) {
    renderPreview();
    return;
  }
  initVditor();
});

onBeforeUnmount(() => {
  detachToolbarNav?.();
  detachToolbarNav = null;
  if (vditor.value) {
    vditor.value.destroy();
    vditor.value = null;
  }
});

const renderPreview = async () => {
  const element = vditorRef.value;
  if (!element) {
    return;
  }
  const dark = isDarkMode.value;
  await Vditor.preview(element, props.modelValue, {
    cdn: `/vditor/${vditorPackage.version}`,
    mode: dark ? "dark" : "light",
    theme: { current: dark ? "dark" : "light" },
    hljs: { style: dark ? "github-dark" : "github", lineNumber: true },
    math: { inlineDigit: true, macros: {} },
  });
};

const initVditor = () => {
  const theme = isDarkMode.value ? "dark" : "classic";
  const preview_theme = isDarkMode.value ? "dark" : "light";
  const hljs_style = isDarkMode.value ? "github-dark" : "github";
  vditor.value = new Vditor(vditorRef.value!, {
    cdn: `/vditor/${vditorPackage.version}`,
    height: props.height,
    minHeight: props.minHeight,
    mode: currentMode.value,
    theme: theme,
    math: {
      inlineDigit: true,
      macros: {},
    },
    cache: {
      id: "MarkdownCache",
      enable: props.cacheEnabled,
    },
    image: {
      isPreview: false,
    },
    toolbar: [...(props.toolbar ?? DEFAULT_EDITOR_TOOLBAR), ...(props.extraToolbar ?? [])],
    toolbarConfig: {
      hide: props.hideToolbar,
    },
    preview: {
      url: `${apiBase()}/api/v2/markdown/preview`,
      transform: prepareVditorPreview,
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
    hint: {
      delay: 200,
      parse: true,
      extend: [
        {
          key: "@",
          hint: async (value: string) => {
            const users = await searchUsers(value);
            return users.map((user) => ({
              value: `${buildMentionMarkdown(user.username, user.id)} `,
              html: `@${user.username}`,
            }));
          },
        },
      ],
    },
    upload: {
      url: `${apiBase()}/api/v2/files/upload`,
      max: 5 * 1024 * 1024, // 5MB
      format: (_, responseText) => {
        const originalResponse = JSON.parse(responseText);
        let succMap: { [key: string]: string } = {};
        originalResponse.files.forEach((file: any) => {
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
      setupToolbarNav();
      revealGuideItem();
      if (props.autofocus) {
        vditor.value?.focus();
      }
    },
    typewriterMode: true,
  });
};

const setValue = (content: string) => {
  isInternalUpdate = true;
  vditor.value!.setValue(content);
  nextTick(() => {
    isInternalUpdate = false;
  });
};

const syncToolbarNav = () => {
  canPageLeft.value = toolbarShift > 1;
  canPageRight.value = toolbarShift < toolbarMaxShift - 1;
};

const applyToolbarShift = () => {
  toolbarEl?.style.setProperty("--vditor-toolbar-shift", `${-toolbarShift}px`);
  syncToolbarNav();
};

const measureToolbar = () => {
  if (!toolbarEl) {
    return;
  }
  const items = [...toolbarEl.children].filter((el) => !el.classList.contains("vditor-toolbar__br"));
  const last = items[items.length - 1] as HTMLElement | undefined;
  toolbarMaxShift = last ? Math.max(0, last.offsetLeft + last.offsetWidth - toolbarEl.clientWidth) : 0;
  toolbarShift = Math.min(toolbarShift, toolbarMaxShift);
};

const pageToolbar = (direction: number) => {
  if (!toolbarEl) {
    return;
  }
  toolbarShift = Math.max(0, Math.min(toolbarShift + direction * toolbarEl.clientWidth, toolbarMaxShift));
  applyToolbarShift();
};

const setupToolbarNav = () => {
  const toolbar = vditorRef.value?.querySelector<HTMLElement>(".vditor-toolbar");
  const nav = toolbarNavRef.value;
  if (!toolbar || !nav) {
    return;
  }
  toolbarEl = toolbar;

  const layout = () => {
    nav.style.top = `${toolbar.offsetTop}px`;
    nav.style.left = `${toolbar.offsetLeft}px`;
    nav.style.width = `${toolbar.offsetWidth}px`;
    nav.style.height = `${toolbar.offsetHeight}px`;
    nav.style.visibility = toolbar.offsetWidth > 0 ? "visible" : "hidden";
    measureToolbar();
    applyToolbarShift();
  };

  const observer = new ResizeObserver(layout);
  observer.observe(toolbar);
  observer.observe(vditorRef.value!);
  window.addEventListener("resize", layout);
  layout();

  detachToolbarNav = () => {
    observer.disconnect();
    window.removeEventListener("resize", layout);
    toolbarEl = null;
  };
};

const revealGuideItem = () => {
  if (!toolbarEl) return;
  toolbarEl.querySelectorAll("[data-guide-active]").forEach((el) => el.removeAttribute("data-guide-active"));
  const button = [...toolbarEl.querySelectorAll<HTMLElement>("[data-type]")].find(
    (el) => el.dataset.type === props.highlightToolbarItem
  );
  if (!button) return;
  const item = button.closest<HTMLElement>(".vditor-toolbar__item") ?? button;
  measureToolbar();
  toolbarShift = Math.max(0, Math.min(item.offsetLeft - 32, toolbarMaxShift));
  applyToolbarShift();
  button.setAttribute("data-guide-active", "true");
};
watch(
  () => props.highlightToolbarItem,
  () => nextTick(revealGuideItem)
);

watch(
  () => props.modelValue,
  (newVal) => {
    if (props.preview) {
      renderPreview();
      return;
    }
    if (vditor.value && newVal !== vditor.value.getValue()) {
      setValue(newVal);
    }
  }
);

watch(
  () => props.darkMode ?? isDark.value,
  (newVal) => {
    if (newVal !== isDarkMode.value) {
      isDarkMode.value = newVal;
      if (props.preview) {
        renderPreview();
      } else if (vditor.value) {
        const theme = isDarkMode.value ? "dark" : "classic";
        const contentTheme = isDarkMode.value ? "dark" : "light";
        const codeTheme = isDarkMode.value ? "github-dark" : "github";
        vditor.value.setTheme(theme, contentTheme, codeTheme);
      }
    }
  }
);

defineExpose({
  vditor: vditor,
});
</script>

<style>
.vditor-container {
  position: relative;
}

.vditor-toolbar-nav {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  visibility: hidden;
}

.vditor-toolbar-nav__fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 32px;
  transition: opacity 0.15s ease-in-out;
}

.vditor-toolbar-nav__fade--left {
  left: 0;
  background: linear-gradient(to right, var(--card), transparent);
}

.vditor-toolbar-nav__fade--right {
  right: 0;
  background: linear-gradient(to left, var(--card), transparent);
}

.vditor-toolbar-nav__btn {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
  pointer-events: auto;
  color: var(--muted-foreground);
  background-color: var(--card);
  transition:
    opacity 0.15s ease-in-out,
    color 0.15s ease-in-out;
}

.vditor-toolbar-nav__btn:first-of-type {
  left: 0;
}

.vditor-toolbar-nav__btn:last-of-type {
  right: 0;
}

.vditor-toolbar-nav__btn svg {
  width: 16px;
  height: 16px;
}

.vditor-toolbar-nav__btn:hover {
  color: var(--foreground);
}

.vditor-toolbar-nav__fade.is-hidden,
.vditor-toolbar-nav__btn.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.vditor-container .vditor-toolbar {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: clip;
  overflow-y: visible;
}

.vditor-container .vditor-toolbar > * {
  transform: translateX(var(--vditor-toolbar-shift, 0px));
  transition: transform 0.2s ease-out;
}

.vditor-container .vditor-toolbar__item,
.vditor-container .vditor-toolbar__divider {
  float: none;
  flex: 0 0 auto;
}

.vditor-container .vditor-toolbar__br {
  display: none;
}

.vditor-container .vditor {
  border: none;
  --panel-background-color: var(--card);
  --textarea-background-color: var(--card);
  --toolbar-background-color: var(--card);
  --border-color: var(--border);
  --toolbar-icon-hover-color: var(--muted-foreground);
}

@media (max-width: 639px) {
  .vditor-container .vditor-ir > .vditor-reset,
  .vditor-container .vditor-ir > .vditor-reset:focus,
  .vditor-container .vditor-wysiwyg > .vditor-reset,
  .vditor-container .vditor-wysiwyg > .vditor-reset:focus,
  .vditor-container .vditor-sv,
  .vditor-container .vditor-sv:focus {
    background-color: transparent;
  }
}

.vditor-container .vditor .vditor-toolbar__item .vditor-tooltipped:hover,
.vditor-container .vditor .vditor-toolbar__item .vditor-tooltipped:focus {
  background-color: var(--accent);
}

.vditor-container .vditor-toolbar [data-guide-active="true"] {
  outline: 2px solid var(--primary) !important;
  outline-offset: -2px;
  border-radius: 4px;
}

.vditor-container .vditor .vditor-menu--current {
  color: var(--ring) !important;
}
</style>
