<template>
  <ScrollPane>
    <div class="survey-page">
      <div v-if="loading" class="survey-page__center">
        <Loader2 class="size-6 animate-spin text-(--c-secondary)" />
      </div>

      <EmptyState v-else-if="notFound" description="问卷不存在或不可见" />

      <template v-else-if="survey">
        <div class="survey-page__header">
          <span class="survey-page__meta">{{ statusLabel }} · {{ survey.question_count }} 题</span>
          <Button v-if="survey.can_view_results" type="outline" size="sm" @click="openResults">查看数据</Button>
        </div>

        <div class="survey-page__blocks">
          <template v-for="block in survey.blocks" :key="block.id">
            <MarkdownRenderer
              v-if="block.kind === 'markdown'"
              :key="block.content_html"
              :content="block.content_html"
              class="survey-page__md"
            />
            <SurveyQuestionField
              v-else
              :block="block"
              :field-name="`survey-q-${block.id}`"
              :model-value="answers[block.id]"
              :disabled="!canAnswer"
              @update:model-value="answers[block.id] = $event"
            />
          </template>
        </div>

        <div v-if="answered" class="survey-page__done">
          <CheckCircle2 class="size-6 text-(--primary)" />
          <p>您已提交过该问卷，感谢参与。</p>
        </div>

        <div v-else-if="survey.status === 'closed'" class="survey-page__done">
          <Lock class="size-6 text-(--c-secondary)" />
          <p>该问卷已结束，无法提交。</p>
        </div>

        <Button v-else class="survey-page__submit" :disabled="submitting" @click="submit">
          {{ submitting ? "提交中..." : "提交" }}
        </Button>
      </template>
    </div>
  </ScrollPane>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { CheckCircle2, Loader2, Lock } from "lucide-vue-next";
import { requestApi } from "@/api/api";
import { Button } from "@/components/ui/button";
import ScrollPane from "@/components/ScrollPane.vue";
import EmptyState from "@/components/EmptyState.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import SurveyQuestionField from "@/components/survey/SurveyQuestionField.vue";
import {
  isSurveyAnswerEmpty,
  validateSurveyAnswersClient,
  SURVEY_STATUS_LABELS,
  type Survey,
  type SurveyAnswerValue,
  type SurveyChoiceConfig,
  type SurveySliderConfig,
} from "@/utils/survey";

const route = useRoute();
const router = useRouter();

const id = computed(() => Number(route.params.id));
const survey = ref<Survey | null>(null);
const answers = ref<Record<number, SurveyAnswerValue>>({});
const loading = ref(true);
const notFound = ref(false);
const submitting = ref(false);
const submitted = ref(false);

const statusLabel = computed(() => (survey.value ? SURVEY_STATUS_LABELS[survey.value.status] ?? survey.value.status : ""));
const answered = computed(() => submitted.value || !!survey.value?.answered);
const canAnswer = computed(() => !!survey.value && survey.value.status === "open" && !answered.value);

const initAnswers = (loaded: Survey) => {
  const next: Record<number, SurveyAnswerValue> = {};
  for (const block of loaded.blocks) {
    if (block.kind !== "question") continue;
    if (block.type === "ranking") {
      next[block.id] = (block.config as SurveyChoiceConfig).options.map((_, index) => index);
    } else if (block.type === "slider") {
      next[block.id] = (block.config as SurveySliderConfig).default;
    }
  }
  if (loaded.my_answers) {
    for (const [blockId, value] of Object.entries(loaded.my_answers)) {
      next[Number(blockId)] = value;
    }
  }
  answers.value = next;
};

const load = async () => {
  loading.value = true;
  notFound.value = false;
  try {
    const res = await requestApi(`/api/v2/forum/surveys/${id.value}`);
    if (res.status === 404 || res.status === 403) {
      notFound.value = true;
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    survey.value = data.data;
    initAnswers(data.data);
  } catch (error) {
    notFound.value = true;
    console.error("Load survey failed:", error);
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  if (!survey.value || submitting.value) return;

  const error = validateSurveyAnswersClient(survey.value.blocks, answers.value);
  if (error) {
    toast.error(error);
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      answers: survey.value.blocks
        .filter((block) => block.kind === "question" && !isSurveyAnswerEmpty(answers.value[block.id]))
        .map((block) => ({ block_id: block.id, value: answers.value[block.id] })),
    };
    const res = await requestApi(`/api/v2/forum/surveys/${id.value}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.message || "提交失败");
      return;
    }

    toast.success("提交成功");
    submitted.value = true;
  } catch (error) {
    toast.error("网络错误");
    console.error("Submit survey failed:", error);
  } finally {
    submitting.value = false;
  }
};

const openResults = () => router.push(`/survey/${id.value}/results`);

load();
</script>

<style scoped>
.survey-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
}

.survey-page__center {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.survey-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.survey-page__meta {
  font-size: 0.8125rem;
  color: var(--c-secondary);
}

.survey-page__blocks {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.survey-page__md {
  font-size: 0.9375rem;
  color: var(--c-text);
}

.survey-page__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  color: var(--c-secondary);
}

.survey-page__submit {
  margin-top: 1.5rem;
}
</style>
