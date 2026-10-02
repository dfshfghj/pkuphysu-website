<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
</script>

<template>
  <div class="flex items-center justify-center px-4 py-10" role="status" aria-label="加载中">
    <Loader2 class="size-6 animate-spin text-(--c-secondary)" />
    <span class="sr-only">加载中…</span>
  </div>
</template>
