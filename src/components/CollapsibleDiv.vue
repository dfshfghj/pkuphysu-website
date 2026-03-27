<template>
  <div class="collapsible-container">
    <div ref="contentRef" class="content" :class="{ expanded: isExpanded }" :style="{ maxHeight: currentMaxHeight }">
      <slot></slot>
    </div>
    <div class="px-8 py-3 text-right sticky bottom-0 z-1" v-if="shouldShowButton">
      <span @click="toggleExpanded" class="cursor-pointer text-(--c-primary)!">
        {{ isExpanded ? "收起" : "展开" }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";

const props = defineProps({
  maxHeight: {
    type: Number,
    default: 200,
  },
});

const contentRef = ref(null);
const isExpanded = ref(false);
const shouldShowButton = ref(false);
const resizeObserver = ref(null);

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

<style scoped>
.content {
  padding-left: 50px;
  padding-right: 50px;
}

@media (max-width: 768px) {
  .content {
    padding-left: 20px;
    padding-right: 20px;
  }
}

.content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}
</style>
