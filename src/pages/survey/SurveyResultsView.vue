<template>
  <ScrollPane>
    <div class="results-page">
      <div v-if="loading" class="results-page__center">
        <Loader2 class="size-6 animate-spin text-(--c-secondary)" />
      </div>

      <EmptyState v-else-if="notFound" description="无权查看该问卷数据" />

      <template v-else-if="results">
        <div class="results-page__header">
          <span class="results-page__meta">
            {{ statusLabel }} · {{ results.response_count }} 份答卷 · {{ questionCount }} 题
          </span>
          <div class="results-page__actions">
            <Button type="outline" size="sm" @click="editVisible = true">编辑问卷</Button>
            <Button type="outline" size="sm" :disabled="toggling" @click="toggleStatus">
              {{ results.status === "open" ? "结束问卷" : "重新开启" }}
            </Button>
            <Button type="outline" size="sm" :disabled="exporting" @click="exportCsv">导出 CSV</Button>
          </div>
        </div>

        <div class="results-page__blocks">
          <template v-for="block in results.blocks" :key="block.id">
            <MarkdownRenderer
              v-if="block.kind === 'markdown'"
              :key="block.content_html"
              :content="block.content_html"
              class="results-page__md"
            />
            <SurveyResultBlock v-else :block="block" />
          </template>
        </div>
      </template>
    </div>

    <SurveyComposerDialog v-model:visible="editVisible" :initial="draft" :locked="locked" @confirm="saveSurvey" />
  </ScrollPane>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import { Loader2 } from "lucide-vue-next";
import { requestApi } from "@/api/api";
import { Button } from "@/components/ui/button";
import ScrollPane from "@/components/ScrollPane.vue";
import EmptyState from "@/components/EmptyState.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import SurveyResultBlock from "@/components/survey/SurveyResultBlock.vue";
import SurveyComposerDialog from "@/components/survey/SurveyComposerDialog.vue";
import {
  countQuestionBlocks,
  SURVEY_STATUS_LABELS,
  type SurveyDraft,
  type SurveyResults,
} from "@/utils/survey";

const route = useRoute();

const id = computed(() => Number(route.params.id));
const results = ref<SurveyResults | null>(null);
const loading = ref(true);
const notFound = ref(false);
const editVisible = ref(false);
const exporting = ref(false);
const toggling = ref(false);

const statusLabel = computed(() =>
  results.value ? SURVEY_STATUS_LABELS[results.value.status] ?? results.value.status : ""
);

const locked = computed(() => (results.value?.response_count ?? 0) > 0);
const questionCount = computed(() => (results.value ? countQuestionBlocks(results.value.blocks) : 0));

const draft = computed<SurveyDraft>(() => ({
  allow_multiple: results.value?.allow_multiple ?? false,
  blocks: (results.value?.blocks ?? []).map((block) =>
    block.kind === "markdown"
      ? { kind: "markdown", content: block.content }
      : { kind: "question", type: block.type, required: block.required, config: block.config }
  ),
}));

const load = async () => {
  loading.value = true;
  notFound.value = false;
  try {
    const res = await requestApi(`/api/v2/forum/surveys/${id.value}/results`);
    if (res.status === 404 || res.status === 403) {
      notFound.value = true;
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    results.value = data.data;
  } catch (error) {
    notFound.value = true;
    console.error("Load survey results failed:", error);
  } finally {
    loading.value = false;
  }
};

const saveSurvey = async (updated: SurveyDraft) => {
  const res = await requestApi(`/api/v2/forum/surveys/${id.value}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...updated, status: results.value?.status ?? "open" }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    toast.error(data?.message || "保存失败");
    return;
  }
  toast.success(data?.data?.message || "已保存");
  await load();
};

const toggleStatus = async () => {
  if (!results.value || toggling.value) return;
  toggling.value = true;
  try {
    const nextStatus = results.value.status === "open" ? "closed" : "open";
    const res = await requestApi(`/api/v2/forum/surveys/${id.value}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft.value, status: nextStatus }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(data?.message || "操作失败");
      return;
    }
    toast.success(nextStatus === "closed" ? "问卷已结束" : "问卷已重新开启");
    await load();
  } finally {
    toggling.value = false;
  }
};

const exportCsv = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const res = await requestApi(`/api/v2/forum/surveys/${id.value}/results/export`);
    if (!res.ok) {
      toast.error("导出失败");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `survey-${id.value}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error("导出失败");
    console.error("Export survey failed:", error);
  } finally {
    exporting.value = false;
  }
};

load();
</script>

<style scoped>
.results-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
}

.results-page__center {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.results-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.results-page__meta {
  font-size: 0.8125rem;
  color: var(--c-secondary);
}

.results-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.results-page__blocks {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.results-page__md {
  font-size: 0.9375rem;
  color: var(--c-text);
}
</style>
