<template>
  <section class="space-y-4" aria-label="答卷明细">
    <div class="flex flex-wrap items-center gap-3">
      <Input v-model="search" class="w-full sm:max-w-sm" placeholder="搜索答题人、时间或答案" aria-label="搜索答卷" />
      <span class="text-sm text-muted-foreground" aria-live="polite"
        >{{ filteredRows.length }} / {{ table.rows.length }} 份答卷</span
      >
    </div>
    <div v-if="filteredRows.length" class="overflow-x-auto rounded-lg border border-border bg-card">
      <table class="w-full text-left text-sm">
        <caption class="sr-only">
          答卷列表，每页
          {{
            pageSize
          }}
          份，可查看完整答案
        </caption>
        <thead class="bg-muted text-muted-foreground">
          <tr>
            <th
              v-for="(header, index) in table.headers.slice(0, 3)"
              :key="index"
              scope="col"
              class="px-4 py-3 font-medium"
            >
              {{ header }}
            </th>
            <th scope="col" class="px-4 py-3 font-medium">完整答案</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in pageRows" :key="entry.index" class="border-t border-border">
            <td v-for="(value, index) in entry.values.slice(0, 3)" :key="index" class="px-4 py-3 break-words">
              {{ value || "—" }}
            </td>
            <td class="px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                :aria-label="`查看答卷 ${entry.values[0]}`"
                @click="selected = entry.values"
                >查看答卷</Button
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
      {{ search.trim() ? "没有匹配的答卷" : "暂无答卷" }}
    </p>
    <div
      v-if="filteredRows.length"
      class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
    >
      <span>第 {{ page }} / {{ totalPages }} 页 · 每页 {{ pageSize }} 份</span>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page -= 1">上一页</Button>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="page += 1">下一页</Button>
      </div>
    </div>
    <Dialog :open="selected !== null" @update:open="!$event && (selected = null)">
      <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>答卷 {{ selected?.[0] }}</DialogTitle>
          <DialogDescription>查看该次提交的完整内容</DialogDescription>
        </DialogHeader>
        <dl v-if="selected" class="space-y-5">
          <div
            v-for="(header, index) in table.headers"
            :key="index"
            class="space-y-1 border-b border-border pb-4 last:border-0"
          >
            <dt class="text-sm font-medium text-muted-foreground">{{ header }}</dt>
            <dd class="whitespace-pre-wrap break-words text-sm text-foreground">
              {{ selected[index] || (index < 3 ? "—" : "未作答") }}
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SurveyResponseTable } from "@/utils/survey-responses";

const props = defineProps<{ table: SurveyResponseTable }>();
const search = ref("");
const page = ref(1);
const pageSize = 10;
const selected = ref<string[] | null>(null);
const filteredRows = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return props.table.rows
    .map((values, index) => ({ values, index }))
    .filter((entry) => !query || entry.values.some((value) => value.toLocaleLowerCase().includes(query)));
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)));
const pageRows = computed(() => filteredRows.value.slice((page.value - 1) * pageSize, page.value * pageSize));
watch(search, () => {
  page.value = 1;
});
watch(
  () => props.table,
  () => {
    page.value = 1;
    selected.value = null;
  }
);
</script>
