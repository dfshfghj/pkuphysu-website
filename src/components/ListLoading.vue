<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";

withDefaults(defineProps<{ rows?: number; itemClass?: string }>(), {
  rows: 4,
  itemClass: "h-24",
});
</script>

<template>
  <div class="space-y-3 px-4 py-4" role="status" aria-label="加载中">
    <span class="sr-only">加载中…</span>
    <Skeleton v-for="row in rows" :key="row" class="w-full" :class="itemClass" />
  </div>
</template>
