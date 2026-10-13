<template>
  <div
    ref="rootRef"
    class="block-editor"
    :class="{
      'block-editor--active': active,
      'block-editor--dragging': dragging,
      'block-editor--drop-target': dropTarget,
    }"
    :tabindex="block.kind === 'question' ? -1 : undefined"
    @click="onClick"
    @dragover="emit('dragover', $event)"
    @drop="emit('drop', $event)"
  >
    <div class="block-editor__head">
      <div class="block-editor__leading">
        <button
          type="button"
          class="block-editor__handle"
          aria-label="拖动排序"
          draggable="true"
          @dragstart="onHandleDragStart"
          @dragend="emit('dragend')"
        >
          <GripVertical class="size-4" />
        </button>

        <Select
          v-if="questionBlock"
          :model-value="questionBlock.type"
          :disabled="disabled"
          @update:model-value="handleTypeChange"
        >
          <SelectTrigger class="block-editor__type" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in SURVEY_QUESTION_TYPES" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span v-else class="block-editor__badge">Markdown</span>

        <label v-if="questionBlock" class="block-editor__required">
          <input
            type="checkbox"
            :checked="questionBlock.required"
            :disabled="disabled"
            @change="handleRequiredChange"
          />
          <span>必答</span>
        </label>
      </div>

      <div class="block-editor__tools">
        <button type="button" :disabled="disabled || index === 0" aria-label="上移" @click.stop="emit('move-up')">
          <ArrowUp class="size-4" />
        </button>
        <button
          type="button"
          :disabled="disabled || index === total - 1"
          aria-label="下移"
          @click.stop="emit('move-down')"
        >
          <ArrowDown class="size-4" />
        </button>
        <button type="button" :disabled="disabled" aria-label="删除区块" @click.stop="emit('remove')">
          <Trash2 class="size-4" />
        </button>
      </div>
    </div>

    <template v-if="block.kind === 'markdown'">
      <MarkdownEditor
        v-if="active"
        :model-value="markdownContent"
        :min-height="140"
        placeholder="输入 Markdown 内容..."
        @update:model-value="updateMarkdown"
      />
      <div v-else class="block-editor__preview">
        <MarkdownEditor v-if="markdownContent" preview :model-value="markdownContent" />
        <span v-else class="block-editor__empty">空 Markdown 区块，点击编辑</span>
      </div>
    </template>

    <template v-else-if="questionBlock">
      <SurveyQuestionEditor
        :model-value="questionBlock"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <SurveyQuestionField
        :block="questionBlock"
        :editable="true"
        :field-name="`survey-draft-${index}`"
        @update:block="emit('update:modelValue', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-vue-next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import SurveyQuestionEditor from "@/components/survey/SurveyQuestionEditor.vue";
import SurveyQuestionField from "@/components/survey/SurveyQuestionField.vue";
import { createDefaultConfig, SURVEY_QUESTION_TYPES, type SurveyDraftBlock, type SurveyQuestionType } from "@/utils/survey";

const props = defineProps({
  block: {
    type: Object as PropType<SurveyDraftBlock>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  dragging: {
    type: Boolean,
    default: false,
  },
  dropTarget: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  "update:modelValue": [value: SurveyDraftBlock];
  remove: [];
  "move-up": [];
  "move-down": [];
  activate: [];
  dragstart: [event: DragEvent];
  dragover: [event: DragEvent];
  drop: [event: DragEvent];
  dragend: [];
}>();

const rootRef = ref<HTMLElement | null>(null);

const markdownContent = computed(() => (props.block.kind === "markdown" ? props.block.content : ""));
const questionBlock = computed(() => (props.block.kind === "question" ? props.block : null));

const updateMarkdown = (value: string) => emit("update:modelValue", { kind: "markdown", content: value });

const handleTypeChange = (type: SurveyQuestionType) => {
  if (props.block.kind !== "question") return;
  emit("update:modelValue", { ...props.block, type, config: createDefaultConfig(type) });
};

const handleRequiredChange = (event: Event) => {
  if (props.block.kind !== "question") return;
  emit("update:modelValue", { ...props.block, required: (event.target as HTMLInputElement).checked });
};

const onHandleDragStart = (event: DragEvent) => {
  if (rootRef.value && event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setDragImage(rootRef.value, 24, 24);
  }
  emit("dragstart", event);
};

const onClick = (event: MouseEvent) => {
  emit("activate");
  if (props.block.kind !== "question") return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, button, [contenteditable]")) return;
  (event.currentTarget as HTMLElement | null)?.focus();
};
</script>

<style scoped>
.block-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}

.block-editor--active {
  border-color: color-mix(in oklab, var(--primary) 45%, var(--border));
}

.block-editor--dragging {
  opacity: 0.5;
}

.block-editor--drop-target {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent);
}

.block-editor:focus {
  outline: none;
}

.block-editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.block-editor__leading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.block-editor__handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.15rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: grab;
}

.block-editor__handle:hover {
  background: var(--muted);
}

.block-editor__handle:active {
  cursor: grabbing;
}

.block-editor__type {
  height: 1.75rem;
  padding: 0 0.4rem;
  font-size: 0.75rem;
}

.block-editor__badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.block-editor__required {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  cursor: pointer;
}

.block-editor__required input {
  accent-color: var(--primary);
}

.block-editor__tools {
  display: flex;
  gap: 0.25rem;
}

.block-editor__tools button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
}

.block-editor__tools button:hover:not(:disabled) {
  background: var(--muted);
}

.block-editor__tools button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.block-editor__preview {
  min-height: 2.5rem;
  padding: 0.4rem 0.1rem;
  cursor: text;
}

.block-editor__empty {
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}
</style>
