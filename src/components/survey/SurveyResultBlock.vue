<template>
  <div class="result-block">
    <div class="result-block__head">
      <span v-if="label" class="result-block__title">{{ label }}</span>
      <span class="result-block__meta">{{ block.answered }} 人作答</span>
    </div>

    <template v-if="isBarType">
      <p v-if="averageLabel" class="result-block__average">{{ averageLabel }}</p>
      <ChartContainer :config="barConfig" class="aspect-auto w-full">
        <div class="result-block__plot" :style="{ height: `${chartHeight}px` }">
          <VisXYContainer
            :data="barRows"
            :x-domain="valueDomain"
            :y-domain="categoryDomain"
          >
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
      <div v-for="(option, index) in block.options" :key="index" class="result-block__rank-row">
        <span class="result-block__rank-text">{{ option.text }}</span>
        <span class="result-block__rank-value">平均第 {{ option.average_rank ?? 0 }} 位</span>
      </div>
    </div>

    <div v-else-if="block.type === 'text'" class="result-block__texts">
      <p v-if="!block.texts?.length" class="result-block__empty">暂无文字作答</p>
      <div v-for="(item, index) in block.texts" :key="index" class="result-block__text">
        <span class="result-block__text-user">{{ item.username || "匿名" }}</span>
        <span class="result-block__text-body">{{ item.text }}</span>
      </div>
    </div>

    <div v-else-if="block.type === 'upload'" class="result-block__uploads">
      <p v-if="!block.uploads?.length" class="result-block__empty">暂无上传</p>
      <div v-for="(entry, index) in block.uploads" :key="index" class="result-block__upload">
        <span class="result-block__upload-user">{{ entry.username || "匿名" }}</span>
        <div class="result-block__upload-files">
          <template v-for="(file, fileIndex) in entry.files" :key="`${file.url}-${fileIndex}`">
            <a
              v-if="block.accept === 'image'"
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
import type { SurveyQuestionResultBlock } from "@/utils/survey";
import { uploadedFileUrl } from "@/utils/upload";

const props = defineProps({
  block: {
    type: Object as PropType<SurveyQuestionResultBlock>,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const isBarType = computed(() =>
  ["single", "multiple", "scale", "slider"].includes(props.block.type)
);

interface BarRow {
  label: string;
  value: number;
}

const barRows = computed<BarRow[]>(() => {
  const block = props.block;
  if (block.type === "single" || block.type === "multiple") {
    return (block.options ?? []).map((option) => ({
      label: option.text,
      value: option.count ?? 0,
    }));
  }
  if (block.type === "scale") {
    return (block.values ?? []).map((item) => ({
      label: String(item.value),
      value: item.count,
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
  value: { label: "人数", color: chartColor(0) },
};
const barColor = barConfig.value.color;

const barCategory = (_row: BarRow, index: number) => index;
const barValue = (row: BarRow) => row.value;

const categoryTicks = computed(() => barRows.value.map((_row, index) => index));
const categoryTickFormat = (value: number) => barRows.value[value]?.label ?? "";
const valueTickFormat = (value: number) => String(Math.round(value));

const valueDomain = computed<[number, number]>(() => [
  0,
  Math.max(1, ...barRows.value.map((row) => row.value)),
]);
const categoryDomain = computed<[number, number]>(() => [
  -0.5,
  Math.max(0.5, barRows.value.length - 0.5),
]);

const chartHeight = computed(() =>
  Math.min(Math.max(barRows.value.length * 32 + 16, 120), 560)
);

const barTooltipTemplate = componentToString(barConfig, ChartTooltipContent, {
  labelKey: "label",
});
const barTooltipTriggers = { [VisGroupedBarSelectors.bar]: barTooltipTemplate };

const averageLabel = computed(() => {
  const block = props.block;
  if (block.type === "scale") return `平均 ${block.average ?? 0}`;
  if (block.type === "slider") {
    return `平均 ${block.average ?? 0}${block.unit || ""}（最低 ${block.min_value ?? 0} / 最高 ${
      block.max_value ?? 0
    }）`;
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
  const total = props.block.total ?? 0;
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

const pieTooltipTemplate = componentToString(pieConfig.value, ChartTooltipContent, {
  hideLabel: true,
});
const pieTooltipTriggers = { [VisDonutSelectors.segment]: pieTooltipTemplate };
</script>

<style scoped>
.result-block {
  padding: 0.75rem;
  border: 1px solid var(--c-border);
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
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-title);
}

.result-block__meta {
  font-size: 0.75rem;
  color: var(--c-secondary);
  white-space: nowrap;
}

.result-block__average {
  margin: 0.4rem 0 0;
  font-size: 0.8125rem;
  color: var(--c-secondary);
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
  color: var(--c-title);
}

.result-block__rank-value {
  color: var(--c-secondary);
}

.result-block__text {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.result-block__text-user {
  flex-shrink: 0;
  color: var(--c-secondary);
}

.result-block__text-body {
  color: var(--c-title);
  word-break: break-word;
}

.result-block__empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--c-secondary);
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
  color: var(--c-secondary);
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
  border: 1px solid var(--c-border);
  border-radius: 6px;
  overflow: hidden;
}

.result-block__upload-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
