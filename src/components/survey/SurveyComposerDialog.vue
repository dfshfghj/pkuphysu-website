<template>
  <Dialog :open="visible" @update:open="handleOpenChange">
    <DialogContent class="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>问卷</DialogTitle>
      </DialogHeader>

      <label class="composer__checkbox">
        <input type="checkbox" v-model="allowMultiple" />
        <span>允许重复提交（默认每人限答一次）</span>
      </label>

      <div v-if="locked" class="composer__locked">
        <p>该问卷已收到答卷，内容结构不可修改。仅可修改提交设置与开关。</p>
        <ol>
          <li v-for="(block, index) in blocks" :key="index">
            <template v-if="block.kind === 'markdown'">
              {{ block.content || "（空 Markdown 区块）" }}
            </template>
            <template v-else>{{ typeLabel(block.type) }}</template>
          </li>
        </ol>
      </div>

      <template v-else>
        <div class="composer__blocks">
          <SurveyBlockEditor
            v-for="(block, index) in blocks"
            :key="index"
            :block="block"
            :index="index"
            :total="blocks.length"
            :active="index === activeIndex"
            :dragging="index === dragIndex"
            :drop-target="index === dragOverIndex && dragIndex !== -1 && dragIndex !== index"
            @update:model-value="updateBlock(index, $event)"
            @activate="activeIndex = index"
            @remove="removeBlock(index)"
            @move-up="moveBlock(index, -1)"
            @move-down="moveBlock(index, 1)"
            @dragstart="onDragStart(index, $event)"
            @dragover="onDragOver(index, $event)"
            @drop="onDrop(index, $event)"
            @dragend="resetDrag"
          />
        </div>
        <div class="composer__add">
          <Button variant="outline" size="sm" @click="addMarkdown">+ Markdown</Button>
          <Button variant="outline" size="sm" @click="addQuestion">+ 题目</Button>
        </div>
      </template>

      <p v-if="error" class="composer__error">{{ error }}</p>

      <DialogFooter>
        <Button variant="outline" @click="close">取消</Button>
        <Button :disabled="!!error" @click="confirm">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SurveyBlockEditor from "@/components/survey/SurveyBlockEditor.vue";
import {
  createMarkdownBlock,
  createQuestionBlock,
  normalizeSurveyDraft,
  SURVEY_QUESTION_TYPES,
  validateSurveyDraft,
  type SurveyDraft,
  type SurveyDraftBlock,
  type SurveyQuestionType,
} from "@/utils/survey";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  initial: {
    type: Object as PropType<SurveyDraft | null>,
    default: null,
  },
  locked: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [draft: SurveyDraft];
}>();

const allowMultiple = ref(false);
const blocks = ref<SurveyDraftBlock[]>([]);
const activeIndex = ref(-1);

const draft = computed<SurveyDraft>(() => ({
  allow_multiple: allowMultiple.value,
  blocks: blocks.value,
}));

const error = computed(() => validateSurveyDraft(draft.value));
const typeLabel = (type: SurveyQuestionType) =>
  SURVEY_QUESTION_TYPES.find((item) => item.value === type)?.label ?? type;

const reset = () => {
  if (props.initial) {
    allowMultiple.value = props.initial.allow_multiple;
    blocks.value = props.initial.blocks.map((block) =>
      block.kind === "markdown" ? { ...block } : { ...block, config: { ...block.config } }
    );
    activeIndex.value = -1;
    return;
  }
  allowMultiple.value = false;
  blocks.value = [createMarkdownBlock(), createQuestionBlock("single")];
  activeIndex.value = 0;
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset();
  },
  { immediate: true }
);

const handleOpenChange = (open: boolean) => emit("update:visible", open);
const close = () => emit("update:visible", false);

const addMarkdown = () => {
  blocks.value = [...blocks.value, createMarkdownBlock()];
  activeIndex.value = blocks.value.length - 1;
};

const addQuestion = () => {
  blocks.value = [...blocks.value, createQuestionBlock("single")];
  activeIndex.value = blocks.value.length - 1;
};

const updateBlock = (index: number, value: SurveyDraftBlock) => {
  blocks.value = blocks.value.map((block, i) => (i === index ? value : block));
};

const removeBlock = (index: number) => {
  blocks.value = blocks.value.filter((_, i) => i !== index);
  activeIndex.value = -1;
};

const moveBlock = (index: number, offset: number) => {
  const target = index + offset;
  if (target < 0 || target >= blocks.value.length) return;
  const next = [...blocks.value];
  [next[index], next[target]] = [next[target], next[index]];
  blocks.value = next;
  activeIndex.value = -1;
};

const dragIndex = ref(-1);
const dragOverIndex = ref(-1);

const onDragStart = (index: number, event: DragEvent) => {
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
};

const onDragOver = (index: number, event: DragEvent) => {
  if (dragIndex.value === -1) return;
  event.preventDefault();
  dragOverIndex.value = index;
};

const onDrop = (index: number, event: DragEvent) => {
  if (dragIndex.value === -1) return;
  event.preventDefault();
  const from = dragIndex.value;
  if (from !== index) {
    const next = [...blocks.value];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    blocks.value = next;
    activeIndex.value = -1;
  }
  resetDrag();
};

const resetDrag = () => {
  dragIndex.value = -1;
  dragOverIndex.value = -1;
};

const confirm = () => {
  if (error.value) {
    toast.error(error.value);
    return;
  }
  emit("confirm", normalizeSurveyDraft(draft.value));
  close();
};
</script>

<style scoped>
.composer__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--c-title);
  cursor: pointer;
}

.composer__checkbox input {
  accent-color: var(--primary);
}

.composer__blocks {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.composer__add {
  display: flex;
  gap: 0.5rem;
}

.composer__locked {
  padding: 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--gray-2);
  font-size: 0.8125rem;
  color: var(--c-secondary);
}

.composer__locked ol {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
}

.composer__error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--red-6);
}
</style>
