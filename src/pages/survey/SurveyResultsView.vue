<template>
  <ScrollPane>
    <div class="results-page">
      <div v-if="loading" class="flex justify-center py-16" role="status" aria-label="加载问卷数据">
        <Loader2 class="size-6 animate-spin text-muted-foreground" />
      </div>
      <div v-else-if="loadError" class="space-y-4 text-center">
        <EmptyState :description="loadError" />
        <Button variant="outline" @click="load">重试</Button>
      </div>
      <template v-else-if="results">
        <header class="space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">问卷数据</h2>
              <p class="mt-1 text-sm text-muted-foreground">{{ statusLabel }} · 第 {{ results.id }} 号问卷</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" @click="router.push(`/survey/${id}`)">查看问卷</Button>
              <Button
                variant="outline"
                size="sm"
                @click="router.push({ name: 'CommentsView', params: { id: results.post_id } })"
                >查看原帖</Button
              >
              <Button variant="outline" size="sm" :disabled="busy" @click="load">刷新</Button>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border border-border bg-card p-3 sm:p-4">
              <p class="text-xs text-muted-foreground">答卷</p>
              <p class="mt-1 text-2xl font-semibold">{{ results.response_count }}</p>
            </div>
            <div class="rounded-lg border border-border bg-card p-3 sm:p-4">
              <p class="text-xs text-muted-foreground">题目</p>
              <p class="mt-1 text-2xl font-semibold">{{ questionCount }}</p>
            </div>
            <div class="rounded-lg border border-border bg-card p-3 sm:p-4">
              <p class="text-xs text-muted-foreground">必答题</p>
              <p class="mt-1 text-2xl font-semibold">{{ requiredCount }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <template v-if="canManage">
              <Button variant="outline" size="sm" :disabled="busy" @click="editVisible = true">编辑问卷</Button>
              <Button variant="outline" size="sm" :disabled="busy" @click="toggleStatus">{{
                toggling ? "处理中…" : results.status === "open" ? "结束问卷" : "重新开启"
              }}</Button>
            </template>
            <Button variant="outline" size="sm" :disabled="exporting || responsesLoading" @click="exportCsv">{{
              exporting ? "导出中…" : "导出 CSV"
            }}</Button>
            <span v-if="detail" class="text-xs text-muted-foreground">{{
              detail.allow_multiple ? "允许重复提交" : "每人限答一次"
            }}</span>
          </div>
        </header>
        <div class="mt-6 flex gap-2 border-b border-border" role="tablist" aria-label="数据视图">
          <button
            id="survey-statistics-tab"
            type="button"
            role="tab"
            data-results-tab="summary"
            aria-controls="survey-statistics"
            :aria-selected="tab === 'summary'"
            :tabindex="tab === 'summary' ? 0 : -1"
            class="results-tab"
            :class="{ 'results-tab--active': tab === 'summary' }"
            @click="tab = 'summary'"
            @keydown.right.prevent="switchTab($event, 'responses')"
          >
            统计汇总
          </button>
          <button
            id="survey-responses-tab"
            type="button"
            role="tab"
            data-results-tab="responses"
            aria-controls="survey-responses"
            :aria-selected="tab === 'responses'"
            :tabindex="tab === 'responses' ? 0 : -1"
            class="results-tab"
            :class="{ 'results-tab--active': tab === 'responses' }"
            @click="tab = 'responses'"
            @keydown.left.prevent="switchTab($event, 'summary')"
          >
            答卷明细
          </button>
        </div>
        <section
          v-if="tab === 'summary'"
          id="survey-statistics"
          role="tabpanel"
          aria-labelledby="survey-statistics-tab"
          class="mt-5 space-y-4"
        >
          <p v-if="results.response_count === 0" class="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            暂无答卷，收到提交后将在这里展示统计。
          </p>
          <template v-for="entry in resultEntries" :key="entry.block.id">
            <MarkdownRenderer
              v-if="entry.block.kind === 'markdown'"
              :key="entry.block.content_html"
              :content="entry.block.content_html"
            />
            <SurveyResultBlock
              v-else
              :block="entry.block"
              :label="`第 ${entry.ordinal} 题`"
              :response-count="results.response_count"
            />
          </template>
        </section>
        <section v-else id="survey-responses" role="tabpanel" aria-labelledby="survey-responses-tab" class="mt-5">
          <div v-if="responsesLoading" class="flex justify-center py-12" role="status" aria-label="加载答卷">
            <Loader2 class="size-6 animate-spin text-muted-foreground" />
          </div>
          <div v-else-if="responsesError" class="space-y-3 text-center">
            <p class="text-sm text-muted-foreground">{{ responsesError }}</p>
            <Button variant="outline" @click="loadResponses">重试答卷加载</Button>
          </div>
          <SurveyResponseBrowser v-else-if="responses" :table="responses" />
        </section>
      </template>
    </div>
    <SurveyComposerDialog
      v-model:visible="editVisible"
      :initial="draft"
      :locked="locked"
      :pending="saving"
      :close-on-confirm="false"
      @confirm="saveSurvey"
    />
  </ScrollPane>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Loader2 } from "lucide-vue-next";
import { requestApi } from "@/api/api";
import { Button } from "@/components/ui/button";
import ScrollPane from "@/components/ScrollPane.vue";
import EmptyState from "@/components/EmptyState.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import SurveyResultBlock from "@/components/survey/SurveyResultBlock.vue";
import SurveyComposerDialog from "@/components/survey/SurveyComposerDialog.vue";
import SurveyResponseBrowser from "@/components/survey/SurveyResponseBrowser.vue";
import {
  countQuestionBlocks,
  SURVEY_STATUS_LABELS,
  type Survey,
  type SurveyDraft,
  type SurveyResults,
} from "@/utils/survey";
import { parseSurveyResponsesCsv, type SurveyResponseTable } from "@/utils/survey-responses";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));
const results = ref<SurveyResults | null>(null);
const detail = ref<Survey | null>(null);
const loading = ref(true);
const loadError = ref("");
const editVisible = ref(false);
const exporting = ref(false);
const toggling = ref(false);
const saving = ref(false);
const tab = ref<"summary" | "responses">("summary");
const responses = ref<SurveyResponseTable | null>(null);
const responsesLoading = ref(false);
const responsesError = ref("");
let csvBlob: Blob | null = null;
let loadVersion = 0;
let responsesVersion = 0;
let disposed = false;
let saveVersion = 0;
let toggleVersion = 0;
let exportVersion = 0;

const busy = computed(() => saving.value || toggling.value);
const canManage = computed(() => detail.value?.is_owner === true);
const statusLabel = computed(() =>
  results.value ? (SURVEY_STATUS_LABELS[results.value.status] ?? results.value.status) : ""
);
const locked = computed(() => (results.value?.response_count ?? 0) > 0);
const questionCount = computed(() => (results.value ? countQuestionBlocks(results.value.blocks) : 0));
const requiredCount = computed(
  () => results.value?.blocks.filter((block) => block.kind === "question" && block.required).length ?? 0
);
const resultEntries = computed(() => {
  let ordinal = 0;
  return (results.value?.blocks ?? []).map((block) => ({
    block,
    ordinal: block.kind === "question" ? ++ordinal : ordinal,
  }));
});
const draft = computed<SurveyDraft>(() => ({
  allow_multiple: detail.value?.allow_multiple ?? results.value?.allow_multiple ?? false,
  blocks: (detail.value?.blocks ?? results.value?.blocks ?? []).map((block) =>
    block.kind === "markdown"
      ? { kind: "markdown", content: block.content }
      : { kind: "question", type: block.type, required: block.required, config: block.config }
  ),
}));
const isCurrent = (surveyId: number, version: number) => !disposed && id.value === surveyId && loadVersion === version;

const load = async () => {
  const surveyId = id.value;
  const version = ++loadVersion;
  ++responsesVersion;
  csvBlob = null;
  responses.value = null;
  responsesLoading.value = false;
  responsesError.value = "";
  loading.value = true;
  loadError.value = "";
  results.value = null;
  detail.value = null;
  try {
    const [resultResponse, detailResponse] = await Promise.allSettled([
      requestApi(`/api/v2/forum/surveys/${surveyId}/results`),
      requestApi(`/api/v2/forum/surveys/${surveyId}`),
    ]);
    if (!isCurrent(surveyId, version)) return;
    if (resultResponse.status === "rejected") throw resultResponse.reason;
    const res = resultResponse.value;
    if (res.status === 403 || res.status === 404) {
      loadError.value = res.status === 403 ? "无权查看该问卷数据" : "问卷不存在";
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!isCurrent(surveyId, version)) return;
    results.value = data.data;
    if (detailResponse.status === "fulfilled" && detailResponse.value.ok) {
      const surveyData = await detailResponse.value.json().catch(() => null);
      if (!isCurrent(surveyId, version)) return;
      detail.value = surveyData?.data ?? null;
    }
    if (tab.value === "responses") await loadResponses();
  } catch {
    if (isCurrent(surveyId, version)) loadError.value = "问卷数据加载失败，请重试";
  } finally {
    if (isCurrent(surveyId, version)) loading.value = false;
  }
};

const loadResponses = async () => {
  if (responsesLoading.value || disposed) return;
  const surveyId = id.value;
  const version = ++responsesVersion;
  responsesLoading.value = true;
  responsesError.value = "";
  try {
    let blob = csvBlob;
    if (!blob) {
      const res = await requestApi(`/api/v2/forum/surveys/${surveyId}/results/export`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blob = await res.blob();
    }
    const table = parseSurveyResponsesCsv(await blob.text());
    if (table.headers.length < 3) throw new Error("答卷文件缺少必要字段");
    if (disposed || id.value !== surveyId || responsesVersion !== version) return;
    csvBlob = blob;
    responses.value = table;
  } catch {
    if (!disposed && id.value === surveyId && responsesVersion === version)
      responsesError.value = "答卷加载失败，请重试";
  } finally {
    if (!disposed && id.value === surveyId && responsesVersion === version) responsesLoading.value = false;
  }
};

const saveSurvey = async (updated: SurveyDraft) => {
  if (!canManage.value || busy.value) return;
  const surveyId = id.value;
  const version = loadVersion;
  const operationVersion = ++saveVersion;
  saving.value = true;
  try {
    const res = await requestApi(`/api/v2/forum/surveys/${surveyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updated, status: results.value?.status ?? "open" }),
    });
    const data = await res.json().catch(() => null);
    if (!isCurrent(surveyId, version)) return;
    if (!res.ok) {
      toast.error(data?.message || "保存失败，请重试");
      return;
    }
    editVisible.value = false;
    toast.success("已保存");
    await load();
  } catch {
    if (isCurrent(surveyId, version)) toast.error("保存失败，请重试");
  } finally {
    if (!disposed && saveVersion === operationVersion) saving.value = false;
  }
};

const toggleStatus = async () => {
  if (!canManage.value || !results.value || busy.value) return;
  const surveyId = id.value;
  const version = loadVersion;
  const nextStatus = results.value.status === "open" ? "closed" : "open";
  const operationVersion = ++toggleVersion;
  toggling.value = true;
  try {
    const res = await requestApi(`/api/v2/forum/surveys/${surveyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft.value, status: nextStatus }),
    });
    const data = await res.json().catch(() => null);
    if (!isCurrent(surveyId, version)) return;
    if (!res.ok) {
      toast.error(data?.message || "操作失败，请重试");
      return;
    }
    toast.success(nextStatus === "closed" ? "问卷已结束" : "问卷已重新开启");
    await load();
  } catch {
    if (isCurrent(surveyId, version)) toast.error("操作失败，请重试");
  } finally {
    if (!disposed && toggleVersion === operationVersion) toggling.value = false;
  }
};

const exportCsv = async () => {
  if (exporting.value || responsesLoading.value) return;
  const surveyId = id.value;
  const version = loadVersion;
  const operationVersion = ++exportVersion;
  exporting.value = true;
  try {
    let blob = csvBlob;
    if (!blob) {
      const res = await requestApi(`/api/v2/forum/surveys/${surveyId}/results/export`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blob = await res.blob();
    }
    if (!isCurrent(surveyId, version)) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `survey-${surveyId}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {
    if (isCurrent(surveyId, version)) toast.error("导出失败，请重试");
  } finally {
    if (!disposed && exportVersion === operationVersion) exporting.value = false;
  }
};

const switchTab = (event: KeyboardEvent, next: "summary" | "responses") => {
  tab.value = next;
  (event.currentTarget as HTMLElement).parentElement
    ?.querySelector<HTMLButtonElement>(`[data-results-tab="${next}"]`)
    ?.focus();
};
watch(tab, (value) => {
  if (value === "responses" && !responses.value && results.value) void loadResponses();
});
watch(
  id,
  () => {
    ++saveVersion;
    ++toggleVersion;
    ++exportVersion;
    editVisible.value = false;
    saving.value = false;
    toggling.value = false;
    exporting.value = false;
    tab.value = "summary";
    void load();
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  disposed = true;
  ++loadVersion;
  ++responsesVersion;
});
</script>

<style scoped>
.results-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
}
.results-tab {
  padding: 0.75rem 1rem;
  color: var(--muted-foreground);
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
}
.results-tab--active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}
.results-tab:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: -2px;
}
</style>
