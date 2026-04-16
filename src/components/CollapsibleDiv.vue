<template>
  <div class="collapsible-container">
    <div
      ref="contentRef"
      class="overflow-hidden w-full px-5 md:px-12.5"
      :class="{ expanded: isExpanded }"
      :style="{ maxHeight: currentMaxHeight }"
    >
      <slot></slot>
    </div>
    <div class="px-8 py-3 text-right bottom-4 z-1" :class="isExpanded ? 'sticky' : ''" v-if="shouldShowButton">
      <div v-if="isExpanded" @click="toggleExpanded" class="flex items-center cursor-pointer justify-end">
        <span class="text-sm">收起</span>
        <ChevronsUp :size="16" />
      </div>
      <div v-else @click="toggleExpanded" class="flex items-center cursor-pointer justify-end">
        <span class="text-sm">展开</span>
        <ChevronsDown :size="16" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronsUp, ChevronsDown } from "lucide-vue-next";
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";

const props = defineProps({
  maxHeight: {
    type: Number,
    default: 200,
  },
});

const contentRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const shouldShowButton = ref(false);
const resizeObserver = ref<ResizeObserver | null>(null);

const currentMaxHeight = computed(() => {
  if (isExpanded.value) {
    return "none";
  }
  return `${props.maxHeight}px`;
});

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const checkContentHeight = async () => {
  await nextTick();
  if (contentRef.value) {
    const scrollHeight = contentRef.value.scrollHeight;
    shouldShowButton.value = scrollHeight > props.maxHeight;

    if (scrollHeight <= props.maxHeight) {
      isExpanded.value = false;
    }
  }
};

onMounted(async () => {
  await checkContentHeight();

  if (window.ResizeObserver && contentRef.value) {
    resizeObserver.value = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        checkContentHeight();
      });
    });

    resizeObserver.value.observe(contentRef.value, {
      box: "border-box",
    });
  }

  onUnmounted(() => {
    if (resizeObserver.value) {
      resizeObserver.value.disconnect();
    }
  });
});

watch(
  () => props.maxHeight,
  async () => {
    await checkContentHeight();
  }
);
</script>
