<script setup lang="ts">
import { injectHoverCardRootContext } from "reka-ui";

const rootContext = injectHoverCardRootContext();

const setTriggerElement = (el: HTMLElement | null) => {
  rootContext.triggerElement.value = el ?? undefined;
};

defineExpose({ setTriggerElement });
</script>

<template>
  <span hidden />
</template>
