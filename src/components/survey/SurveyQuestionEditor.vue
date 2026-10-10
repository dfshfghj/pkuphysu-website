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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Input } from "@/components/ui/input";
import {
  type SurveyChoiceConfig,
  type SurveyQuestionDraftBlock,
  type SurveySliderConfig,
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

const hasConfig = computed(() => props.modelValue.type === "multiple" || props.modelValue.type === "slider");

const updateConfig = (patch: Record<string, unknown>) =>
  emit("update:modelValue", {
    ...props.modelValue,
    config: { ...(props.modelValue.config as Record<string, unknown>), ...patch },
  });

const choiceConfig = computed(() => props.modelValue.config as SurveyChoiceConfig);
const sliderConfig = computed(() => props.modelValue.config as SurveySliderConfig);

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
</style>
