<template>
  <div v-if="hasConfig" class="question-config">
    <div v-if="modelValue.type === 'multiple'" class="question-config__grid">
      <label class="question-config__field">
        <span>最少选择（0 为不限）</span>
        <Input
          type="number"
          class="h-6 max-w-20"
          :model-value="choiceConfig.min ?? 0"
          :disabled="disabled"
          @update:model-value="updateConfig({ min: toNumber($event) })"
        />
      </label>
      <label class="question-config__field">
        <span>最多选择（0 为不限）</span>
        <Input
          type="number"
          class="h-6 max-w-20"
          :model-value="choiceConfig.max ?? 0"
          :disabled="disabled"
          @update:model-value="updateConfig({ max: toNumber($event) })"
        />
      </label>
    </div>

    <div v-else-if="modelValue.type === 'slider'" class="question-config__grid">
      <label class="question-config__field">
        <span>步长</span>
        <Input
          type="number"
          class="h-6 max-w-16"
          :model-value="sliderConfig.step"
          :disabled="disabled"
          @update:model-value="updateConfig({ step: toNumber($event) })"
        />
      </label>
    </div>

    <div v-else-if="modelValue.type === 'upload'" class="question-config__grid">
      <label class="question-config__field">
        <span>允许类型</span>
        <Select
          :model-value="uploadConfig.accept"
          :disabled="disabled"
          @update:model-value="updateConfig({ accept: $event })"
        >
          <SelectTrigger class="h-6 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">图片</SelectItem>
            <SelectItem value="file">文件</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label class="question-config__field question-config__field--inline">
        <Checkbox
          :model-value="uploadConfig.multiple"
          :disabled="disabled"
          @update:model-value="updateConfig({ multiple: $event === true })"
        />
        <span>允许多个</span>
      </label>
      <label v-if="uploadConfig.multiple" class="question-config__field">
        <span>最多数量</span>
        <Input
          type="number"
          class="h-6 max-w-16"
          :model-value="uploadConfig.maxCount"
          :disabled="disabled"
          @update:model-value="updateConfig({ maxCount: toNumber($event) })"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type SurveyChoiceConfig,
  type SurveyQuestionDraftBlock,
  type SurveySliderConfig,
  type SurveyUploadConfig,
} from "@/utils/survey";

const props = defineProps({
  modelValue: {
    type: Object as PropType<SurveyQuestionDraftBlock>,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  "update:modelValue": [value: SurveyQuestionDraftBlock];
}>();

const hasConfig = computed(
  () => props.modelValue.type === "multiple" || props.modelValue.type === "slider" || props.modelValue.type === "upload"
);

const updateConfig = (patch: Record<string, unknown>) =>
  emit("update:modelValue", {
    ...props.modelValue,
    config: { ...(props.modelValue.config as Record<string, unknown>), ...patch },
  });

const choiceConfig = computed(() => props.modelValue.config as SurveyChoiceConfig);
const sliderConfig = computed(() => props.modelValue.config as SurveySliderConfig);
const uploadConfig = computed(() => props.modelValue.config as SurveyUploadConfig);

const toNumber = (value: string | number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
</script>

<style scoped>
.question-config {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.question-config__grid {
  display: flex;
  gap: 2rem;
}

.question-config__field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
  color: var(--c-secondary);
}

.question-config__field--inline {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
}
</style>
