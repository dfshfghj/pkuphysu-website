<template>
  <div class="result-block">
    <div class="result-block__head">
      <span v-if="label" class="result-block__title">{{ label }}</span>
      <span class="result-block__meta">{{ block.answered }} 人作答</span>
    </div>

    <div v-if="block.type === 'single' || block.type === 'multiple'" class="result-block__bars">
      <div v-for="(option, index) in block.options" :key="index" class="result-block__bar-row">
        <div class="result-block__bar-head">
          <span>{{ option.text }}</span>
          <span>{{ option.percent ?? 0 }}% · {{ option.count ?? 0 }}</span>
        </div>
        <div class="result-block__bar">
          <div class="result-block__bar-fill" :style="{ width: `${option.percent ?? 0}%` }"></div>
        </div>
      </div>
    </div>

    <div v-else-if="block.type === 'scale'" class="result-block__bars">
      <p class="result-block__average">平均 {{ block.average ?? 0 }}</p>
      <div v-for="item in block.values" :key="item.value" class="result-block__bar-row">
        <div class="result-block__bar-head">
          <span>{{ item.value }}</span>
          <span>{{ item.percent }}% · {{ item.count }}</span>
        </div>
        <div class="result-block__bar">
          <div class="result-block__bar-fill" :style="{ width: `${item.percent}%` }"></div>
        </div>
      </div>
    </div>

    <div v-else-if="block.type === 'slider'" class="result-block__slider">
      <p class="result-block__average">
        平均 {{ block.average ?? 0 }}{{ block.unit || "" }}（最低 {{ block.min_value ?? 0 }} / 最高
        {{ block.max_value ?? 0 }}）
      </p>
      <div class="result-block__bars">
        <div v-for="(bucket, index) in block.buckets" :key="index" class="result-block__bar-row">
          <div class="result-block__bar-head">
            <span>{{ bucket.from }} ~ {{ bucket.to }}</span>
            <span>{{ bucket.count }}</span>
          </div>
          <div class="result-block__bar">
            <div class="result-block__bar-fill" :style="{ width: `${bucketPercent(bucket.count)}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="block.type === 'ranking'" class="result-block__ranking">
      <div v-for="(option, index) in block.options" :key="index" class="result-block__rank-row">
        <span class="result-block__rank-text">{{ option.text }}</span>
        <span class="result-block__rank-value">平均第 {{ option.average_rank ?? 0 }} 位</span>
      </div>
    </div>

    <div v-else-if="block.type === 'proportion'" class="result-block__ranking">
      <div v-for="(option, index) in block.options" :key="index" class="result-block__rank-row">
        <span class="result-block__rank-text">{{ option.text }}</span>
        <span class="result-block__rank-value">平均 {{ option.average ?? 0 }} / {{ block.total }}</span>
      </div>
    </div>

    <div v-else-if="block.type === 'text'" class="result-block__texts">
      <p v-if="!block.texts?.length" class="result-block__empty">暂无文字作答</p>
      <div v-for="(item, index) in block.texts" :key="index" class="result-block__text">
        <span class="result-block__text-user">{{ item.username || "匿名" }}</span>
        <span class="result-block__text-body">{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SurveyQuestionResultBlock } from "@/utils/survey";

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

const bucketPercent = (count: number) => {
  const answered = props.block.answered || 0;
  if (answered <= 0) return 0;
  return Math.round((count / answered) * 100);
};
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
  margin: 0 0 0.4rem;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.result-block__bars,
.result-block__ranking,
.result-block__texts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.result-block__bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--foreground);
}

.result-block__bar {
  height: 8px;
  margin-top: 0.2rem;
  border-radius: 999px;
  background: color-mix(in oklab, var(--border) 70%, transparent);
  overflow: hidden;
}

.result-block__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary) 78%, transparent);
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
</style>
