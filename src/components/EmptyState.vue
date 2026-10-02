<script setup lang="ts">
import { PackageOpen } from "lucide-vue-next";

withDefaults(defineProps<{ description?: string }>(), { description: "暂无数据" });
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-10 text-(--c-secondary)">
    <PackageOpen class="size-10 opacity-60" />
    <p class="text-sm">{{ description }}</p>
    <slot />
  </div>
</template>
