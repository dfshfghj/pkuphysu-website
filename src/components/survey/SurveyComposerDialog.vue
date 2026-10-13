<template>
  <Dialog :open="visible" @update:open="handleOpenChange">
    <DialogContent
      :show-close-button="!pending"
      @escape-key-down="guardDismiss"
      @pointer-down-outside="guardDismiss"
      class="max-h-[88vh] overflow-y-auto sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle>问卷</DialogTitle>
      </DialogHeader>

      <label class="composer__checkbox">
        <input type="checkbox" v-model="allowMultiple" :disabled="pending" />
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
        <div class="composer__blocks" :inert="pending">
          <SurveyBlockEditor
            v-for="(block, index) in blocks"
            :key="blockKeys[index]"
            :disabled="pending"
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
          <Button
            variant="outline"
            size="sm"
            :disabled="pending || blocks.length >= MAX_SURVEY_BLOCKS"
            @click="addMarkdown"
            >+ Markdown</Button
          >
          <Button
            variant="outline"
            size="sm"
            :disabled="pending || blocks.length >= MAX_SURVEY_BLOCKS"
            @click="addQuestion"
            >+ 题目</Button
          >
        </div>
      </template>

      <p v-if="error" class="composer__error">{{ error }}</p>

      <DialogFooter>
        <Button variant="outline" :disabled="pending" @click="close">取消</Button>
        <Button :disabled="pending || !!error" @click="confirm">{{ pending ? "保存中..." : "确定" }}</Button>
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
  MAX_SURVEY_BLOCKS,
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
  pending: { type: Boolean, default: false },
  closeOnConfirm: { type: Boolean, default: true },
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
const blockKeys = ref<number[]>([]);
let nextBlockKey = 0;
const syncKeys = () => {
  blockKeys.value = blocks.value.map(() => nextBlockKey++);
};

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
    syncKeys();
    activeIndex.value = -1;
    return;
  }
  allowMultiple.value = false;
  blocks.value = [createMarkdownBlock(), createQuestionBlock("single")];
  syncKeys();
  activeIndex.value = 0;
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset();
  },
  { immediate: true }
);

const guardDismiss = (event: Event) => {
  if (props.pending) event.preventDefault();
};
const handleOpenChange = (open: boolean) => {
  if (!props.pending) emit("update:visible", open);
};
const close = () => {
  if (!props.pending) emit("update:visible", false);
};

const addMarkdown = () => {
  if (props.pending || blocks.value.length >= MAX_SURVEY_BLOCKS) return;
  blockKeys.value.push(nextBlockKey++);
  blocks.value = [...blocks.value, createMarkdownBlock()];
  activeIndex.value = blocks.value.length - 1;
};

const addQuestion = () => {
  if (props.pending || blocks.value.length >= MAX_SURVEY_BLOCKS) return;
  blockKeys.value.push(nextBlockKey++);
  blocks.value = [...blocks.value, createQuestionBlock("single")];
  activeIndex.value = blocks.value.length - 1;
};

const updateBlock = (index: number, value: SurveyDraftBlock) => {
  if (props.pending) return;
  blocks.value = blocks.value.map((block, i) => (i === index ? value : block));
};

const removeBlock = (index: number) => {
  if (props.pending) return;
  blocks.value = blocks.value.filter((_, i) => i !== index);
  blockKeys.value.splice(index, 1);
  if (activeIndex.value === index) activeIndex.value = -1;
  else if (activeIndex.value > index) activeIndex.value -= 1;
};

const moveBlock = (index: number, offset: number) => {
  if (props.pending) return;
  const target = index + offset;
  if (target < 0 || target >= blocks.value.length) return;
  const next = [...blocks.value];
  [next[index], next[target]] = [next[target], next[index]];
  blocks.value = next;
  [blockKeys.value[index], blockKeys.value[target]] = [blockKeys.value[target], blockKeys.value[index]];
  if (activeIndex.value === index) activeIndex.value = target;
  else if (activeIndex.value === target) activeIndex.value = index;
};

const dragIndex = ref(-1);
const dragOverIndex = ref(-1);

const onDragStart = (index: number, event: DragEvent) => {
  if (props.pending) return;
  dragIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
};

const onDragOver = (index: number, event: DragEvent) => {
  if (props.pending || dragIndex.value === -1) return;
  event.preventDefault();
  dragOverIndex.value = index;
};

const onDrop = (index: number, event: DragEvent) => {
  if (props.pending || dragIndex.value === -1) return;
  event.preventDefault();
  const from = dragIndex.value;
  if (from !== index) {
    const next = [...blocks.value];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    const activeKey = blockKeys.value[activeIndex.value];
    const [key] = blockKeys.value.splice(from, 1);
    blockKeys.value.splice(index, 0, key);
    blocks.value = next;
    activeIndex.value = blockKeys.value.indexOf(activeKey);
  }
  resetDrag();
};

const resetDrag = () => {
  dragIndex.value = -1;
  dragOverIndex.value = -1;
};

const confirm = () => {
  if (props.pending) return;
  if (error.value) {
    toast.error(error.value);
    return;
  }
  emit("confirm", normalizeSurveyDraft(draft.value));
  if (props.closeOnConfirm) close();
};
</script>

<style scoped>
.composer__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--foreground);
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
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--muted);
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.composer__locked ol {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
}

.composer__error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--destructive);
}
</style>
