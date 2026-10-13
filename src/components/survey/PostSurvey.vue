<template>
  <div class="post-survey" @click.stop="open">
    <div class="post-survey__icon">
      <ClipboardList class="size-5" />
    </div>
    <div class="post-survey__body">
      <span class="post-survey__title">参与问卷</span>
      <span class="post-survey__meta">
        {{ survey.question_count }} 题 · {{ statusLabel }}
        <template v-if="survey.response_count !== undefined"> · {{ survey.response_count }} 份答卷</template>
      </span>
    </div>
    <div class="post-survey__actions">
      <button v-if="survey.can_view_results" type="button" class="post-survey__results" @click.stop="openResults">
        查看数据
      </button>
      <ChevronRight class="size-4 post-survey__arrow" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronRight, ClipboardList } from "lucide-vue-next";
import { SURVEY_STATUS_LABELS, type SurveySummary } from "@/utils/survey";

const props = defineProps({
  survey: {
    type: Object as PropType<SurveySummary>,
    required: true,
  },
});

const router = useRouter();

const statusLabel = computed(() => SURVEY_STATUS_LABELS[props.survey.status] ?? props.survey.status);

const open = () => router.push(`/survey/${props.survey.id}`);
const openResults = () => router.push(`/survey/${props.survey.id}/results`);
</script>

<style scoped>
.post-survey {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.5rem 0;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: var(--muted);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.post-survey__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: color-mix(in oklab, var(--primary) 15%, transparent);
  color: var(--primary);
}

.post-survey__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.post-survey__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-survey__meta {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.post-survey__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.post-survey__results {
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--primary);
  font-size: 0.8125rem;
  cursor: pointer;
}

.post-survey__results:hover {
  background: var(--card);
}

.post-survey__arrow {
  color: var(--muted-foreground);
}
</style>
