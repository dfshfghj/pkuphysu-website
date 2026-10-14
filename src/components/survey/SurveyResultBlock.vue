<template>
  <div class="result-block">
    <div class="result-block__head">
      <h3 class="result-block__title">
        {{ label || "题目统计" }} <small>{{ typeLabel }} · {{ block.required ? "必答" : "选答" }}</small>
      </h3>
      <span class="result-block__meta"
        >{{ block.answered }} 份作答<template v-if="responseCount !== undefined">
          · {{ unanswered }} 份未答</template
        ></span
      >
    </div>

    <div v-if="isListType && block.answered > 0" class="result-block__list-controls">
      <label :for="`result-search-${block.id}`">筛选作答</label>
      <input :id="`result-search-${block.id}`" v-model="search" type="search" placeholder="搜索答题人、文字或文件名" />
      <span aria-live="polite">{{ filteredCount }} 条结果</span>
    </div>
    <p v-if="block.answered === 0" class="result-block__empty">暂无作答</p>
    <template v-else-if="isBarType">
      <p v-if="averageLabel" class="result-block__average">{{ averageLabel }}</p>
      <ChartContainer :config="barConfig" class="aspect-auto w-full">
        <div class="result-block__plot" :style="{ height: `${chartHeight}px` }">
          <VisXYContainer :data="barRows" :x-domain="valueDomain" :y-domain="categoryDomain">
            <VisGroupedBar
              :x="barCategory"
              :y="[barValue]"
              orientation="horizontal"
              :color="[barColor]"
              :rounded-corners="3"
              :bar-padding="0.2"
            />
            <VisAxis
              type="y"
              :tick-values="categoryTicks"
              :tick-format="categoryTickFormat"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
            />
            <VisAxis
              type="x"
              :tick-line="false"
              :domain-line="false"
              :grid-line="true"
              :tick-format="valueTickFormat"
            />
            <ChartTooltip :triggers="barTooltipTriggers" />
          </VisXYContainer>
        </div>
      </ChartContainer>
    </template>

    <template v-else-if="block.type === 'proportion'">
      <ChartContainer :config="pieConfig" class="aspect-auto w-full">
        <div class="result-block__plot result-block__plot--pie">
          <VisSingleContainer :data="pieData">
            <VisDonut
              :value="pieValue"
              :color="pieColor"
              :arc-width="9999"
              :corner-radius="4"
              :pad-angle="0.015"
              :show-background="false"
            />
            <ChartTooltip :triggers="pieTooltipTriggers" />
          </VisSingleContainer>
        </div>
        <ChartLegendContent class="result-block__legend" />
      </ChartContainer>
    </template>

    <div v-else-if="block.type === 'ranking'" class="result-block__ranking">
      <div v-for="(option, index) in rankedOptions" :key="index" class="result-block__rank-row">
        <span class="result-block__rank-text">{{ option.text }}</span>
        <span class="result-block__rank-value">平均第 {{ formatNumber(option.average_rank) }} 位</span>
      </div>
    </div>

    <div v-else-if="block.type === 'text'" class="result-block__texts">
      <p v-if="!block.texts?.length" class="result-block__empty">暂无文字作答</p>
      <div v-for="(item, index) in visibleTexts" :key="index" class="result-block__text">
        <span class="result-block__text-user">{{ item.username || "匿名" }}</span>
        <span class="result-block__text-body">{{ item.text }}</span>
      </div>
    </div>

    <div v-else-if="block.type === 'upload'" class="result-block__uploads">
      <p v-if="!block.uploads?.length" class="result-block__empty">暂无上传</p>
      <div v-for="(entry, index) in visibleUploads" :key="index" class="result-block__upload">
        <span class="result-block__upload-user">{{ entry.username || "匿名" }}</span>
        <div class="result-block__upload-files">
          <template v-for="(file, fileIndex) in entry.files" :key="`${file.url}-${fileIndex}`">
            <a
              v-if="isImageUpload"
              :href="uploadedFileUrl(file.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="result-block__upload-thumb"
            >
              <img :src="uploadedFileUrl(file.url)" :alt="file.name" loading="lazy" />
            </a>
            <a
              v-else
              :href="uploadedFileUrl(file.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="result-block__upload-link"
            >
              {{ file.name || file.url }}
            </a>
          </template>
        </div>
      </div>
    </div>

    <div v-if="block.answered > 0 && statisticsRows.length" class="result-block__table-wrap">
      <table class="result-block__table">
        <caption>
          {{
            label || "题目"
          }}{{
            block.type === "proportion" ? "平均分配" : "作答分布"
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">选项 / 数值</th>
            <th scope="col">{{ block.type === "proportion" ? "平均分" : "作答数" }}</th>
            <th scope="col">占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in statisticsRows" :key="index">
            <th scope="row">{{ row.label }}</th>
            <td>{{ formatNumber(row.value) }}</td>
            <td>{{ row.percent === undefined ? "—" : `${formatNumber(row.percent)}%` }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="block.type === 'multiple'" class="result-block__note">
        占比以本题作答份数为分母；多选占比之和可能超过 100%。
      </p>
    </div>
    <p v-if="isListType && block.answered > 0 && filteredCount === 0" class="result-block__empty">没有匹配的作答</p>
    <nav v-if="isListType && pageCount > 1" class="result-block__pagination" aria-label="作答列表分页">
      <button type="button" :disabled="page === 1" @click="page -= 1">上一页</button>
      <span aria-live="polite">第 {{ page }} / {{ pageCount }} 页</span>
      <button type="button" :disabled="page === pageCount" @click="page += 1">下一页</button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  VisAxis,
  VisDonut,
  VisDonutSelectors,
  VisGroupedBar,
  VisGroupedBarSelectors,
  VisSingleContainer,
  VisXYContainer,
} from "@unovis/vue";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  SURVEY_QUESTION_TYPES,
  type SurveyQuestionResultBlock,
  type SurveyUploadConfig,
  type SurveyProportionConfig,
} from "@/utils/survey";
import { uploadedFileUrl } from "@/utils/upload";

const props = defineProps({
  block: {
    type: Object as PropType<SurveyQuestionResultBlock>,
    required: true,
  },
  responseCount: { type: Number, default: undefined },
  label: {
    type: String,
    default: "",
  },
});

const typeLabel = computed(
  () => SURVEY_QUESTION_TYPES.find((item) => item.value === props.block.type)?.label ?? props.block.type
);
const unanswered = computed(() => Math.max(0, (props.responseCount ?? 0) - props.block.answered));
const formatNumber = (value: number | undefined) =>
  value === undefined || !Number.isFinite(value) ? "—" : Number(value.toFixed(2)).toLocaleString();
const rankedOptions = computed(() =>
  [...(props.block.options ?? [])].sort((a, b) => (a.average_rank ?? Infinity) - (b.average_rank ?? Infinity))
);
const isImageUpload = computed(
  () => (props.block.accept ?? (props.block.config as SurveyUploadConfig).accept) === "image"
);
const isListType = computed(() => props.block.type === "text" || props.block.type === "upload");
const search = ref("");
const page = ref(1);
const pageSize = 10;
const matches = (value: string) => value.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase());
const filteredTexts = computed(() =>
  (props.block.texts ?? []).filter((item) => matches(`${item.username || "匿名"} ${item.text}`))
);
const filteredUploads = computed(() =>
  (props.block.uploads ?? []).filter((item) =>
    matches(`${item.username || "匿名"} ${item.files.map((file) => file.name).join(" ")}`)
  )
);
const filteredCount = computed(() =>
  props.block.type === "text" ? filteredTexts.value.length : filteredUploads.value.length
);
const pageCount = computed(() => Math.max(1, Math.ceil(filteredCount.value / pageSize)));
const visibleTexts = computed(() => filteredTexts.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const visibleUploads = computed(() => filteredUploads.value.slice((page.value - 1) * pageSize, page.value * pageSize));
watch([search, () => props.block], () => {
  page.value = 1;
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const chartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const isBarType = computed(() => ["single", "multiple", "scale", "slider"].includes(props.block.type));

interface BarRow {
  label: string;
  value: number;
  percent?: number;
}

const barRows = computed<BarRow[]>(() => {
  const block = props.block;
  if (block.type === "single" || block.type === "multiple") {
    return (block.options ?? []).map((option) => ({
      label: option.text,
      value: option.count ?? 0,
      percent: option.percent,
    }));
  }
  if (block.type === "scale") {
    return (block.values ?? []).map((item) => ({
      label: String(item.value),
      value: item.count,
      percent: item.percent,
    }));
  }
  if (block.type === "slider") {
    return (block.buckets ?? []).map((bucket) => ({
      label: `${bucket.from} ~ ${bucket.to}`,
      value: bucket.count,
    }));
  }
  return [];
});

const barConfig: ChartConfig = {
  value: { label: "作答数", color: chartColor(0) },
};
const barColor = barConfig.value.color;

const barCategory = (_row: BarRow, index: number) => index;
const barValue = (row: BarRow) => row.value;

const categoryTicks = computed(() => barRows.value.map((_row, index) => index));
const categoryTickFormat = (value: number) => barRows.value[value]?.label ?? "";
const valueTickFormat = (value: number) => String(Math.round(value));

const valueDomain = computed<[number, number]>(() => [0, Math.max(1, ...barRows.value.map((row) => row.value))]);
const categoryDomain = computed<[number, number]>(() => [-0.5, Math.max(0.5, barRows.value.length - 0.5)]);

const chartHeight = computed(() => Math.min(Math.max(barRows.value.length * 32 + 16, 120), 560));

const barTooltipTemplate = componentToString(barConfig, ChartTooltipContent, {
  labelKey: "label",
});
const barTooltipTriggers = { [VisGroupedBarSelectors.bar]: barTooltipTemplate };

const averageLabel = computed(() => {
  const block = props.block;
  if (block.type === "scale") return `平均 ${formatNumber(block.average)}`;
  if (block.type === "slider") {
    return `平均 ${formatNumber(block.average)}${block.unit || ""}（最低 ${formatNumber(block.min_value)} / 最高 ${formatNumber(
      block.max_value
    )}）`;
  }
  return "";
});

interface PieDatum {
  key: string;
  name: string;
  [key: string]: string | number;
}

const pieData = computed<PieDatum[]>(() =>
  (props.block.options ?? []).map((option, index) => {
    const key = `slice-${index}`;
    return { key, name: option.text, [key]: option.average ?? 0 };
  })
);

const piePercent = (average: number) => {
  const total = props.block.total ?? (props.block.config as SurveyProportionConfig).total ?? 0;
  if (total <= 0) return 0;
  return Math.round((average / total) * 100);
};

const pieConfig = computed<ChartConfig>(() => {
  const config: ChartConfig = {};
  pieData.value.forEach((slice, index) => {
    const average = Number(slice[slice.key]) || 0;
    config[slice.key] = {
      label: `${slice.name}（${piePercent(average)}%）`,
      color: chartColor(index),
    };
  });
  return config;
});

const pieValue = (slice: PieDatum) => Number(slice[slice.key]) || 0;
const pieColor = (_slice: PieDatum, index: number) => chartColor(index);

const pieTooltipTriggers = {
  [VisDonutSelectors.segment]: (datum: PieDatum | { data: PieDatum }) => {
    const slice = "data" in datum ? (datum.data as PieDatum) : (datum as PieDatum);
    const tooltip = document.createElement("div");
    tooltip.className = "rounded border bg-background px-2 py-1 text-xs";
    tooltip.textContent = `${pieConfig.value[slice.key]?.label ?? slice.name} · 平均 ${formatNumber(Number(slice[slice.key]))}`;
    return tooltip.outerHTML;
  },
};

const statisticsRows = computed(() => {
  if (props.block.type === "proportion") {
    return (props.block.options ?? []).map((option) => ({
      label: option.text,
      value: option.average,
      percent: option.average === undefined ? undefined : piePercent(option.average),
    }));
  }
  if (!isBarType.value) return [];
  return barRows.value.map((row) => ({
    ...row,
    percent: row.percent ?? (props.block.answered > 0 ? (row.value / props.block.answered) * 100 : 0),
  }));
});
</script>

<style scoped>
.result-block {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}

.result-block__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.result-block__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--foreground);
}

.result-block__meta {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}

.result-block__average {
  margin: 0.4rem 0 0;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.result-block__plot {
  width: 100%;
  margin-top: 0.6rem;
}

.result-block__plot--pie {
  height: 220px;
}

.result-block__legend {
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: 0.25rem;
}

.result-block__ranking,
.result-block__texts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.result-block__rank-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--foreground);
}

.result-block__rank-value {
  color: var(--muted-foreground);
}

.result-block__text {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.result-block__text-user {
  flex-shrink: 0;
  color: var(--muted-foreground);
}

.result-block__text-body {
  color: var(--foreground);
  word-break: break-word;
}

.result-block__empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.result-block__uploads {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.6rem;
}

.result-block__upload {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.result-block__upload-user {
  flex-shrink: 0;
  color: var(--muted-foreground);
}

.result-block__upload-files {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.result-block__upload-link {
  color: var(--c-link);
  word-break: break-all;
}

.result-block__upload-thumb {
  display: block;
  width: 4rem;
  height: 4rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.result-block__upload-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.result-block__title small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--muted-foreground);
}
.result-block__empty {
  margin-top: 0.75rem;
}
.result-block__table-wrap {
  margin-top: 0.75rem;
  overflow-x: auto;
}
.result-block__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.result-block__table caption {
  padding-bottom: 0.5rem;
  text-align: left;
  color: var(--muted-foreground);
}
.result-block__table th,
.result-block__table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.result-block__table th:first-child {
  text-align: left;
  overflow-wrap: anywhere;
}
.result-block__table tbody th {
  font-weight: 400;
}
.result-block__note {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.result-block__list-controls,
.result-block__pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}
.result-block__list-controls input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--foreground);
}
.result-block__pagination button {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
}
.result-block__pagination button:disabled {
  opacity: 0.5;
  cursor: default;
}
.result-block__text-body {
  white-space: pre-wrap;
}
@media (max-width: 480px) {
  .result-block__head {
    flex-wrap: wrap;
  }
}
</style>
