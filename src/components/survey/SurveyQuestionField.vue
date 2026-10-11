<template>
  <div class="survey-field">
    <div v-if="label || block.required" class="survey-field__label">
      <span v-if="label">{{ label }}</span>
      <span v-if="block.required" class="survey-field__required">*</span>
    </div>

    <div v-if="block.type === 'single' || block.type === 'multiple'" class="survey-field__choices">
      <div v-for="(option, index) in options" :key="index" class="survey-field__choice">
        <label class="survey-field__choice-main">
          <input
            :type="block.type === 'single' ? 'radio' : 'checkbox'"
            :name="fieldName"
            :value="index"
            :disabled="editable || disabled"
            :checked="isSelected(index)"
            @change="onChoiceChange(index, $event)"
          />
          <input
            class="survey-field__option-text"
            :value="option"
            :disabled="!editable"
            @input="updateOption(index, ($event.target as HTMLInputElement).value)"
          />
        </label>
        <button
          v-if="editable"
          type="button"
          class="survey-field__option-tool"
          :disabled="options.length <= MIN_SURVEY_OPTIONS"
          aria-label="删除选项"
          @click="removeOption(index)"
        >
          <X class="size-4" />
        </button>
      </div>
      <button
        v-if="editable"
        type="button"
        class="survey-field__option-add"
        :disabled="options.length >= MAX_SURVEY_OPTIONS"
        @click="addOption"
      >
        + 添加选项
      </button>
    </div>

    <div v-else-if="block.type === 'ranking'" class="survey-field__ranking">
      <div
        v-for="(optionIndex, position) in rankingOrder"
        :key="optionIndex"
        class="survey-field__rank-row"
        :class="{
          'survey-field__rank-row--dragging': position === rankDragIndex,
          'survey-field__rank-row--drop-target':
            position === rankDragOverIndex && rankDragIndex !== -1 && rankDragIndex !== position,
        }"
        @dragover="onRankDragOver(position, $event)"
        @drop="onRankDrop(position, $event)"
      >
        <button
          type="button"
          class="survey-field__rank-handle"
          aria-label="拖动排序"
          :draggable="!disabled"
          @dragstart="onRankDragStart(position, $event)"
          @dragend="resetRankDrag"
        >
          <GripVertical class="size-4" />
        </button>
        <span class="survey-field__rank-index">{{ position + 1 }}</span>
        <input
          class="survey-field__option-text"
          :value="options[optionIndex]"
          :disabled="!editable"
          @input="updateOption(optionIndex, ($event.target as HTMLInputElement).value)"
        />
        <div v-if="!editable && !disabled" class="survey-field__rank-tools">
          <button type="button" :disabled="position === 0" aria-label="上移" @click="moveRank(position, -1)">
            <ArrowUp class="size-4" />
          </button>
          <button
            type="button"
            :disabled="position === rankingOrder.length - 1"
            aria-label="下移"
            @click="moveRank(position, 1)"
          >
            <ArrowDown class="size-4" />
          </button>
        </div>
        <button
          v-if="editable"
          type="button"
          class="survey-field__option-tool"
          :disabled="options.length <= MIN_SURVEY_OPTIONS"
          aria-label="删除选项"
          @click="removeOption(optionIndex)"
        >
          <X class="size-4" />
        </button>
      </div>
      <button
        v-if="editable"
        type="button"
        class="survey-field__option-add"
        :disabled="options.length >= MAX_SURVEY_OPTIONS"
        @click="addOption"
      >
        + 添加选项
      </button>
    </div>

    <div v-else-if="block.type === 'text'" class="survey-field__text">
      <Textarea
        :model-value="textValue"
        :placeholder="editable ? '在此输入占位提示' : textConfig.placeholder || '请输入'"
        :maxlength="textConfig.maxLength"
        :disabled="disabled"
        rows="3"
        @update:model-value="onTextInput(String($event))"
      />
      <div class="survey-field__text-count">
        <span>{{ textCount }}/</span>
        <input
          v-if="editable"
          type="number"
          class="survey-field__text-max"
          :value="textConfig.maxLength"
          @input="updateMaxLength(($event.target as HTMLInputElement).value)"
        />
        <span v-else>{{ textConfig.maxLength }}</span>
      </div>
    </div>

    <div v-else-if="block.type === 'slider'" class="survey-field__slider">
      <div class="survey-field__slider-head">
        <div class="survey-field__slider-side">
          <input
            v-if="editable"
            class="survey-field__slider-label"
            :value="sliderConfig.minLabel ?? ''"
            placeholder="左标签"
            @input="updateConfig({ minLabel: ($event.target as HTMLInputElement).value })"
          />
          <span v-else-if="sliderConfig.minLabel" class="survey-field__slider-label">{{ sliderConfig.minLabel }}</span>
        </div>
        <div class="survey-field__slider-side survey-field__slider-side--end">
          <input
            v-if="editable"
            class="survey-field__slider-label"
            :value="sliderConfig.maxLabel ?? ''"
            placeholder="右标签"
            @input="updateConfig({ maxLabel: ($event.target as HTMLInputElement).value })"
          />
          <span v-else-if="sliderConfig.maxLabel" class="survey-field__slider-label">{{ sliderConfig.maxLabel }}</span>
        </div>
      </div>
      <div class="survey-field__slider-main">
        <input
          type="number"
          class="survey-field__slider-value h-8"
          :value="sliderValue"
          :min="sliderConfig.min"
          :max="sliderConfig.max"
          :disabled="disabled"
          @input="onSliderInput(($event.target as HTMLInputElement).value)"
        />
        <input
          type="range"
          :min="sliderConfig.min"
          :max="sliderConfig.max"
          :step="sliderConfig.step"
          :value="sliderValue"
          :disabled="disabled"
          @input="onSliderInput(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="survey-field__slider-bounds">
        <input
          v-if="editable"
          type="number"
          class="survey-field__bound"
          :value="sliderConfig.min"
          @input="updateSliderBound('min', ($event.target as HTMLInputElement).value)"
        />
        <span v-else>{{ sliderConfig.min }}</span>
        <input
          v-if="editable"
          type="number"
          class="survey-field__bound"
          :value="sliderConfig.max"
          @input="updateSliderBound('max', ($event.target as HTMLInputElement).value)"
        />
        <span v-else>{{ sliderConfig.max }}</span>
      </div>
    </div>

    <div v-else-if="block.type === 'proportion'" class="survey-field__proportion">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="survey-field__proportion-item"
        :class="{ 'survey-field__proportion-item--auto': index === options.length - 1 }"
      >
        <div class="survey-field__proportion-head">
          <input
            class="survey-field__option-text"
            :value="option"
            :disabled="!editable"
            @input="updateOption(index, ($event.target as HTMLInputElement).value)"
          />
          <span v-if="index === options.length - 1" class="survey-field__proportion-auto">自动补足</span>
          <button
            v-if="editable"
            type="button"
            class="survey-field__option-tool"
            :disabled="options.length <= MIN_SURVEY_OPTIONS"
            aria-label="删除选项"
            @click="removeOption(index)"
          >
            <X class="size-4" />
          </button>
        </div>
        <div class="survey-field__proportion-main">
          <input
            type="number"
            class="survey-field__slider-value h-8"
            :value="proportionValues[index] ?? 0"
            :min="0"
            :max="proportionConfig.total"
            :disabled="editable || disabled || index === options.length - 1"
            @input="updateProportion(index, ($event.target as HTMLInputElement).value)"
          />
          <input
            type="range"
            min="0"
            :max="proportionConfig.total"
            :value="proportionValues[index] ?? 0"
            :disabled="editable || disabled || index === options.length - 1"
            @input="updateProportion(index, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="survey-field__proportion-bounds">
          <span>0</span>
          <span>{{ proportionConfig.total }}</span>
        </div>
      </div>
      <button
        v-if="editable"
        type="button"
        class="survey-field__option-add"
        :disabled="options.length >= MAX_SURVEY_OPTIONS"
        @click="addOption"
      >
        + 添加选项
      </button>
      <p
        class="survey-field__proportion-sum"
        :class="{ 'survey-field__proportion-sum--bad': proportionSum !== proportionConfig.total }"
      >
        合计 {{ proportionSum }} /
        <input
          v-if="editable"
          type="number"
          class="survey-field__proportion-total"
          :value="proportionConfig.total"
          @input="updateProportionTotal(($event.target as HTMLInputElement).value)"
        />
        <span v-else>{{ proportionConfig.total }}</span>
      </p>
    </div>

    <div v-else-if="block.type === 'scale'" class="survey-field__scale">
      <div class="survey-field__scale-inner">
        <div class="survey-field__scale-head">
          <input
            v-if="editable"
            class="survey-field__slider-label"
            :value="scaleConfig.minLabel ?? ''"
            placeholder="左标签"
            @input="updateConfig({ minLabel: ($event.target as HTMLInputElement).value })"
          />
          <span v-else-if="scaleConfig.minLabel" class="survey-field__slider-label">{{ scaleConfig.minLabel }}</span>
          <input
            v-if="editable"
            class="survey-field__slider-label"
            :value="scaleConfig.maxLabel ?? ''"
            placeholder="右标签"
            @input="updateConfig({ maxLabel: ($event.target as HTMLInputElement).value })"
          />
          <span v-else-if="scaleConfig.maxLabel" class="survey-field__slider-label">{{ scaleConfig.maxLabel }}</span>
        </div>
        <div class="survey-field__scale-options">
          <input
            v-if="editable"
            type="number"
            class="survey-field__bound"
            :value="scaleConfig.min"
            @input="updateScaleBound('min', ($event.target as HTMLInputElement).value)"
          />
          <label v-for="value in scaleValues" :key="value" class="survey-field__scale-option">
            <input
              type="radio"
              :name="fieldName"
              :value="value"
              :disabled="editable || disabled"
              :checked="modelValue === value"
              @change="emit('update:modelValue', value)"
            />
            <span>{{ value }}</span>
          </label>
          <input
            v-if="editable"
            type="number"
            class="survey-field__bound"
            :value="scaleConfig.max"
            @input="updateScaleBound('max', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <div v-else-if="block.type === 'upload'" class="survey-field__upload">
      <input
        ref="uploadInput"
        type="file"
        class="survey-field__upload-input"
        :accept="uploadAccept"
        :multiple="uploadConfig.multiple"
        :disabled="editable || disabled || uploading"
        @change="onUploadPick"
      />
      <template v-if="!editable">
        <button
          type="button"
          class="survey-field__upload-btn"
          :disabled="disabled || uploading || reachedUploadLimit"
          @click="openUpload"
        >
          <Loader2 v-if="uploading" class="size-4 animate-spin" />
          <Upload v-else class="size-4" />
          <span>{{ uploadButtonText }}</span>
        </button>
        <ul v-if="uploadedFiles.length" class="survey-field__upload-list">
          <li v-for="(file, index) in uploadedFiles" :key="`${file.url}-${index}`" class="survey-field__upload-item">
            <a :href="uploadedFileUrl(file.url)" target="_blank" rel="noopener noreferrer">
              {{ file.name || file.url }}
            </a>
            <button v-if="!disabled" type="button" aria-label="移除文件" @click="removeUpload(index)">
              <X class="size-4" />
            </button>
          </li>
        </ul>
      </template>
      <p v-else class="survey-field__upload-hint">{{ uploadEditableHint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Upload, X } from "lucide-vue-next";
import { Textarea } from "@/components/ui/textarea";
import { uploadedFileUrl, uploadFiles } from "@/utils/upload";
import {
  initialProportionValues,
  MAX_SURVEY_OPTIONS,
  MAX_SURVEY_SCALE_SPAN,
  MIN_SURVEY_OPTIONS,
  type SurveyAnswerValue,
  type SurveyChoiceConfig,
  type SurveyProportionConfig,
  type SurveyQuestionConfig,
  type SurveyQuestionDraftBlock,
  type SurveyScaleConfig,
  type SurveySliderConfig,
  type SurveyTextConfig,
  type SurveyUploadConfig,
  type SurveyUploadFile,
} from "@/utils/survey";

const props = defineProps({
  block: {
    type: Object as PropType<SurveyQuestionDraftBlock>,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  modelValue: {
    type: [Number, String, Array] as PropType<SurveyAnswerValue>,
    default: undefined,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  fieldName: {
    type: String,
    default: "survey-q",
  },
});

const emit = defineEmits<{
  "update:modelValue": [value: SurveyAnswerValue];
  "update:block": [value: SurveyQuestionDraftBlock];
}>();

const options = computed(() => (props.block.config as SurveyChoiceConfig | SurveyProportionConfig).options ?? []);
const textConfig = computed(() => props.block.config as SurveyTextConfig);
const sliderConfig = computed(() => props.block.config as SurveySliderConfig);
const proportionConfig = computed(() => props.block.config as SurveyProportionConfig);
const scaleConfig = computed(() => props.block.config as SurveyScaleConfig);
const uploadConfig = computed(() => props.block.config as SurveyUploadConfig);

const updateConfig = (patch: Record<string, unknown>) => {
  emit("update:block", { ...props.block, config: { ...props.block.config, ...patch } as SurveyQuestionConfig });
};

const selected = computed(() => (Array.isArray(props.modelValue) ? (props.modelValue as number[]) : []));
const isSelected = (index: number) =>
  props.block.type === "single" ? props.modelValue === index : selected.value.includes(index);

const onChoiceChange = (index: number, event: Event) => {
  if (props.block.type === "single") {
    emit("update:modelValue", index);
    return;
  }
  toggleMultiple(index, (event.target as HTMLInputElement).checked);
};

const toggleMultiple = (index: number, checked: boolean) => {
  const next = checked ? [...selected.value, index] : selected.value.filter((item) => item !== index);
  emit("update:modelValue", next.sort((a, b) => a - b));
};

const rankingOrder = computed(() => {
  if (Array.isArray(props.modelValue) && props.modelValue.length === options.value.length) {
    return props.modelValue as number[];
  }
  return options.value.map((_, index) => index);
});

const moveRank = (position: number, offset: number) => {
  const target = position + offset;
  if (target < 0 || target >= rankingOrder.value.length) return;
  const next = [...rankingOrder.value];
  [next[position], next[target]] = [next[target], next[position]];
  applyRankOrder(next);
};

const applyRankOrder = (order: number[]) => {
  if (props.editable) {
    updateConfig({ options: order.map((index) => options.value[index]) });
    return;
  }
  emit("update:modelValue", order);
};

const rankDragIndex = ref(-1);
const rankDragOverIndex = ref(-1);

const resetRankDrag = () => {
  rankDragIndex.value = -1;
  rankDragOverIndex.value = -1;
};

const onRankDragStart = (position: number, event: DragEvent) => {
  if (props.disabled) return;
  rankDragIndex.value = position;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(position));
  }
};

const onRankDragOver = (position: number, event: DragEvent) => {
  if (rankDragIndex.value === -1) return;
  event.preventDefault();
  rankDragOverIndex.value = position;
};

const onRankDrop = (position: number, event: DragEvent) => {
  if (rankDragIndex.value === -1) return;
  event.preventDefault();
  const from = rankDragIndex.value;
  if (from !== position) {
    const next = [...rankingOrder.value];
    const [moved] = next.splice(from, 1);
    next.splice(position, 0, moved);
    applyRankOrder(next);
  }
  resetRankDrag();
};

const textValue = computed(() => {
  if (props.editable) return textConfig.value.placeholder ?? "";
  return typeof props.modelValue === "string" ? props.modelValue : "";
});

const textCount = computed(() => textValue.value.length);

const onTextInput = (value: string) => {
  if (props.editable) {
    updateConfig({ placeholder: value });
    return;
  }
  emit("update:modelValue", value);
};

const updateMaxLength = (value: string) => {
  if (value.trim() === "") return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return;
  updateConfig({ maxLength: parsed });
};

const sliderValue = computed(() => {
  if (props.editable) return sliderConfig.value.default;
  return typeof props.modelValue === "number" ? props.modelValue : sliderConfig.value.default;
});

const onSliderInput = (value: string) => {
  if (value.trim() === "") return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  const clamped = Math.min(Math.max(parsed, sliderConfig.value.min), sliderConfig.value.max);
  if (props.editable) {
    updateConfig({ default: clamped });
    return;
  }
  emit("update:modelValue", clamped);
};

const updateSliderBound = (field: "min" | "max", value: string) => {
  if (value.trim() === "") return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  const next = { ...sliderConfig.value, [field]: parsed };
  const lo = Math.min(next.min, next.max);
  const hi = Math.max(next.min, next.max);
  const clamped = Math.min(Math.max(next.default, lo), hi);
  updateConfig({ [field]: parsed, default: clamped });
};

const updateScaleBound = (field: "min" | "max", value: string) => {
  if (value.trim() === "") return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  updateConfig({ [field]: parsed });
};

const proportionValues = computed<number[]>(() => {
  const count = options.value.length;
  if (count === 0) return [];
  const total = proportionConfig.value.total || 0;
  const raw =
    Array.isArray(props.modelValue) && props.modelValue.length === count
      ? (props.modelValue as number[]).map((value) => (Number.isFinite(value) ? value : 0))
      : initialProportionValues(proportionConfig.value);
  const first = raw.slice(0, count - 1);
  const used = first.reduce((sum, value) => sum + value, 0);
  return [...first, Math.max(0, total - used)];
});

const proportionSum = computed(() => proportionValues.value.reduce((total, item) => total + item, 0));

const updateProportion = (index: number, value: string | number) => {
  const count = options.value.length;
  if (count === 0 || index >= count - 1) return;
  const parsed = Number(value);
  const total = proportionConfig.value.total || 0;
  const first = proportionValues.value.slice(0, count - 1);
  const others = first.reduce((sum, item, i) => (i === index ? sum : sum + item), 0);
  const limit = Math.max(0, total - others);
  first[index] = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), limit) : 0;
  const used = first.reduce((sum, item) => sum + item, 0);
  emit("update:modelValue", [...first, Math.max(0, total - used)]);
};

const updateProportionTotal = (value: string) => {
  if (value.trim() === "") return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return;
  updateConfig({ total: parsed });
};

const scaleValues = computed(() => {
  const values: number[] = [];
  const { min, max } = scaleConfig.value;
  for (let value = min; value <= max && values.length < MAX_SURVEY_SCALE_SPAN + 1; value += 1) {
    values.push(value);
  }
  return values;
});

const updateOption = (index: number, value: string) => {
  const next = [...options.value];
  next[index] = value;
  updateConfig({ options: next });
};

const addOption = () => {
  if (options.value.length >= MAX_SURVEY_OPTIONS) return;
  updateConfig({ options: [...options.value, ""] });
};

const removeOption = (index: number) => {
  if (options.value.length <= MIN_SURVEY_OPTIONS) return;
  updateConfig({ options: options.value.filter((_, i) => i !== index) });
};

const uploadInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

const uploadedFiles = computed<SurveyUploadFile[]>(() =>
  Array.isArray(props.modelValue) ? (props.modelValue as SurveyUploadFile[]) : []
);
const uploadLimit = computed(() => (uploadConfig.value.multiple ? uploadConfig.value.maxCount : 1));
const reachedUploadLimit = computed(() => uploadedFiles.value.length >= uploadLimit.value);
const uploadAccept = computed(() => (uploadConfig.value.accept === "image" ? "image/*" : undefined));
const uploadKindLabel = computed(() => (uploadConfig.value.accept === "image" ? "图片" : "文件"));
const uploadButtonText = computed(() =>
  uploadConfig.value.multiple
    ? `选择${uploadKindLabel.value}（最多 ${uploadLimit.value} 个）`
    : `选择${uploadKindLabel.value}`
);
const uploadEditableHint = computed(() =>
  uploadConfig.value.multiple
    ? `填写时可上传${uploadKindLabel.value}（最多 ${uploadLimit.value} 个）`
    : `填写时可上传 1 个${uploadKindLabel.value}`
);

const openUpload = () => uploadInput.value?.click();

const onUploadPick = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const picked = Array.from(input.files ?? []);
  input.value = "";
  if (!picked.length) return;
  const batch = picked.slice(0, Math.max(0, uploadLimit.value - uploadedFiles.value.length));
  if (!batch.length) return;
  uploading.value = true;
  try {
    const uploaded = await uploadFiles(batch);
    emit("update:modelValue", [
      ...uploadedFiles.value,
      ...uploaded.map((file) => ({ url: file.url, name: file.name })),
    ]);
  } catch (error) {
    console.error("Upload survey file failed:", error);
  } finally {
    uploading.value = false;
  }
};

const removeUpload = (index: number) => {
  emit(
    "update:modelValue",
    uploadedFiles.value.filter((_, i) => i !== index)
  );
};
</script>

<style scoped>
.survey-field {
  --survey-slider-value-width: 5rem;
  --survey-slider-gap: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  margin-bottom: 0.5rem;
}

.survey-field__label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-title);
  position: absolute;
  top: -32px;
  right: 10px;
}

.survey-field__required {
  color: var(--red-6);
  margin-left: 0.15rem;
}

.survey-field__choices {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.survey-field__choice {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.survey-field__choice-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.survey-field__choice-main input[type="radio"],
.survey-field__choice-main input[type="checkbox"],
.survey-field__scale-option input {
  accent-color: var(--primary);
  flex-shrink: 0;
}

.survey-field__option-text {
  flex: 1;
  min-width: 0;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: transparent;
  color: var(--c-title);
  font-size: 0.875rem;
  outline: none;
}

.survey-field__option-text:focus-visible {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 30%, transparent);
}

.survey-field__option-text:disabled {
  height: auto;
  padding: 0;
  border-color: transparent;
  background: transparent;
  color: var(--c-title);
  font-size: 0.9375rem;
  pointer-events: none;
}

.survey-field__option-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.3rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-secondary);
  cursor: pointer;
}

.survey-field__option-tool:hover:not(:disabled) {
  background: var(--gray-2);
}

.survey-field__option-tool:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.survey-field__option-add {
  align-self: flex-start;
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
}

.survey-field__option-add:hover:not(:disabled) {
  background: var(--gray-2);
}

.survey-field__option-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.survey-field__ranking {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.survey-field__rank-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--card);
}

.survey-field__rank-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.2rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-secondary);
  cursor: grab;
}

.survey-field__rank-handle:hover {
  background: var(--gray-2);
}

.survey-field__rank-handle:active {
  cursor: grabbing;
}

.survey-field__rank-row--dragging {
  opacity: 0.5;
}

.survey-field__rank-row--drop-target {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent);
}

.survey-field__rank-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary) 18%, transparent);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.survey-field__rank-tools {
  display: flex;
  gap: 0.2rem;
}

.survey-field__rank-tools button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-secondary);
  cursor: pointer;
}

.survey-field__rank-tools button:hover:not(:disabled) {
  background: var(--gray-2);
}

.survey-field__rank-tools button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.survey-field__slider {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.survey-field__slider-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-left: calc(var(--survey-slider-value-width) + var(--survey-slider-gap));
}

.survey-field__slider-label {
  font-size: 0.75rem;
  color: var(--c-secondary);
}

input.survey-field__slider-label {
  min-width: 0;
  height: 1.75rem;
  padding: 0 0.4rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: transparent;
  color: var(--c-title);
  font-size: 0.75rem;
  outline: none;
}

.survey-field__slider-side {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.survey-field__slider-side--end {
  justify-content: flex-end;
}

.survey-field__slider-main {
  display: flex;
  align-items: center;
  gap: var(--survey-slider-gap);
}

.survey-field__slider-main input[type="range"] {
  flex: 1;
  min-width: 0;
  accent-color: var(--primary);
}

input.survey-field__slider-value {
  width: var(--survey-slider-value-width);
  flex-shrink: 0;
  padding: 0 0.5rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: transparent;
  text-align: center;
  outline: none;
}

input.survey-field__slider-value:focus-visible {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 30%, transparent);
}

input.survey-field__slider-value:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.survey-field__slider-bounds {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-left: calc(var(--survey-slider-value-width) + var(--survey-slider-gap));
  font-size: 0.75rem;
  color: var(--c-secondary);
}

.survey-field__bound {
  width: 5rem;
  height: 1.75rem;
  padding: 0 0.4rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: transparent;
  color: var(--c-title);
  font-size: 0.75rem;
  outline: none;
}

.survey-field__text {
  display: flex;
  flex-direction: column;
}

.survey-field__text-count {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.15rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--c-secondary);
}

.survey-field__text-max {
  width: 3.5rem;
  height: 1.5rem;
  padding: 0 0.3rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: transparent;
  color: var(--c-title);
  font-size: 0.75rem;
  text-align: center;
  outline: none;
}

.survey-field__proportion {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.survey-field__proportion-item {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.survey-field__proportion-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.survey-field__proportion-auto {
  flex-shrink: 0;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--gray-2);
  color: var(--c-secondary);
  font-size: 0.6875rem;
}

.survey-field__proportion-item--auto .survey-field__proportion-main {
  opacity: 0.6;
}

.survey-field__proportion-main {
  display: flex;
  align-items: center;
  gap: var(--survey-slider-gap);
}

.survey-field__proportion-main input[type="range"] {
  flex: 1;
  min-width: 0;
  accent-color: var(--primary);
}

.survey-field__proportion-bounds {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-left: calc(var(--survey-slider-value-width) + var(--survey-slider-gap));
  font-size: 0.75rem;
  color: var(--c-secondary);
}

.survey-field__proportion-sum {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-secondary);
}

.survey-field__proportion-total {
  width: 4rem;
  height: 1.75rem;
  padding: 0 0.4rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: transparent;
  color: var(--c-title);
  font-size: 0.75rem;
  text-align: center;
  outline: none;
}

.survey-field__proportion-sum--bad {
  color: var(--red-6);
}

.survey-field__scale {
  display: flex;
  justify-content: center;
}

.survey-field__scale-inner {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 100%;
}

.survey-field__scale-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.survey-field__scale-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.survey-field__scale-option {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--c-border);
  border-radius: 999px;
  font-size: 0.875rem;
  color: var(--c-title);
  cursor: pointer;
}

.survey-field__upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.survey-field__upload-input {
  display: none;
}

.survey-field__upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  align-self: flex-start;
  padding: 0.45rem 0.9rem;
  border: 1px dashed var(--c-border);
  border-radius: 8px;
  background: transparent;
  color: var(--c-title);
  font-size: 0.8125rem;
  cursor: pointer;
}

.survey-field__upload-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.survey-field__upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.survey-field__upload-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.survey-field__upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.survey-field__upload-item a {
  color: var(--c-link);
  word-break: break-all;
}

.survey-field__upload-item button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.2rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-secondary);
  cursor: pointer;
}

.survey-field__upload-item button:hover {
  background: var(--gray-2);
}

.survey-field__upload-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-secondary);
}
</style>
