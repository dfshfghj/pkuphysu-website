<script setup lang="ts">
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown, ChevronUp, LoaderCircle } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    distance?: number;
    backTop?: boolean;
    backTopThreshold?: number;
    refresh?: () => unknown;
  }>(),
  { distance: 400, backTop: false, backTopThreshold: 400, refresh: undefined }
);

const emit = defineEmits<{ "end-reached": [] }>();

const PULL_THRESHOLD = 56;
const PULL_LIMIT = 96;
const PULL_RATIO = 0.5;
const PULL_MIN_DURATION = 320;

const scrollAreaRef = ref();
const viewport = ref<HTMLElement | null>(null);
const showBackTop = ref(false);
const pullDistance = ref(0);
const dragging = ref(false);
const animating = ref(false);
const refreshing = ref(false);
// keep-alive 停用时 DOM 会被移出文档，滚动位置会丢，这里自己记住并在 activated 时还原
const savedScrollTop = ref(0);

let startY = 0;
let startX = 0;
let tracking = false;
let releaseTimer = 0;

const handleScroll = () => {
  const el = viewport.value;
  if (!el) return;

  savedScrollTop.value = el.scrollTop;
  showBackTop.value = el.scrollTop > props.backTopThreshold;

  if (el.scrollTop + el.clientHeight >= el.scrollHeight - props.distance) {
    emit("end-reached");
  }
};

const applyOffset = (value: number, animate: boolean) => {
  const el = viewport.value;
  if (!el) return;
  el.style.transition = animate ? "padding-top 240ms ease-out" : "";
  el.style.paddingTop = value ? `${value}px` : "";
};

const animateBack = () => {
  animating.value = true;
  pullDistance.value = 0;
  applyOffset(0, true);
  window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    animating.value = false;
    applyOffset(0, false);
  }, 240);
};

const handleTouchStart = (event: TouchEvent) => {
  if (!props.refresh || refreshing.value || event.touches.length !== 1) return;
  const el = viewport.value;
  if (!el || el.scrollTop > 0) return;

  window.clearTimeout(releaseTimer);
  animating.value = false;
  applyOffset(0, false);

  startY = event.touches[0].clientY;
  startX = event.touches[0].clientX;
  tracking = true;
  dragging.value = false;
};

const handleTouchMove = (event: TouchEvent) => {
  if (!tracking) return;

  const touch = event.touches[0];
  const deltaY = touch.clientY - startY;
  const deltaX = touch.clientX - startX;

  if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY) || (viewport.value?.scrollTop ?? 0) > 0) {
    tracking = false;
    dragging.value = false;
    animateBack();
    return;
  }

  if (event.cancelable) event.preventDefault();

  dragging.value = true;
  pullDistance.value = Math.min(PULL_LIMIT, deltaY * PULL_RATIO);
  applyOffset(pullDistance.value, false);
};

const handleTouchEnd = async () => {
  if (!tracking) return;
  tracking = false;

  const shouldRefresh = dragging.value && pullDistance.value >= PULL_THRESHOLD;
  dragging.value = false;

  if (!shouldRefresh || !props.refresh) {
    animateBack();
    return;
  }

  refreshing.value = true;
  pullDistance.value = PULL_THRESHOLD;
  applyOffset(PULL_THRESHOLD, false);
  try {
    await Promise.all([
      Promise.resolve(props.refresh()),
      new Promise((resolve) => window.setTimeout(resolve, PULL_MIN_DURATION)),
    ]);
  } finally {
    refreshing.value = false;
    animateBack();
  }
};

const indicatorStyle = computed(() => ({
  transform: `translateY(${pullDistance.value - 44}px)`,
  opacity: refreshing.value ? 1 : Math.min(1, pullDistance.value / 32),
  transition: animating.value ? "transform 240ms ease-out, opacity 240ms ease-out" : undefined,
}));

onMounted(() => {
  const root = (scrollAreaRef.value?.$el ?? scrollAreaRef.value) as HTMLElement | undefined;
  viewport.value = root?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null;
  viewport.value?.addEventListener("scroll", handleScroll, { passive: true });
  viewport.value?.addEventListener("touchstart", handleTouchStart, { passive: true });
  viewport.value?.addEventListener("touchmove", handleTouchMove, { passive: false });
  viewport.value?.addEventListener("touchend", handleTouchEnd);
  viewport.value?.addEventListener("touchcancel", handleTouchEnd);
});

onBeforeUnmount(() => {
  window.clearTimeout(releaseTimer);
  viewport.value?.removeEventListener("scroll", handleScroll);
  viewport.value?.removeEventListener("touchstart", handleTouchStart);
  viewport.value?.removeEventListener("touchmove", handleTouchMove);
  viewport.value?.removeEventListener("touchend", handleTouchEnd);
  viewport.value?.removeEventListener("touchcancel", handleTouchEnd);
});

onActivated(async () => {
  if (!savedScrollTop.value) return;
  await nextTick();
  viewport.value?.scrollTo({ top: savedScrollTop.value });
});

const scrollToTop = () => {
  viewport.value?.scrollTo({ top: 0, behavior: "smooth" });
};

defineExpose({
  scrollTo: (options: ScrollToOptions) => viewport.value?.scrollTo(options),
  scrollToTop,
});
</script>

<template>
  <div class="relative h-full min-h-0">
    <ScrollArea ref="scrollAreaRef" class="h-full">
      <slot />
    </ScrollArea>
    <div
      v-if="refresh"
      class="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
      :style="indicatorStyle"
      aria-hidden="true"
    >
      <div
        class="flex size-8 items-center justify-center rounded-full border border-(--border) bg-card text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      >
        <LoaderCircle v-if="refreshing" class="size-4 animate-spin" />
        <ArrowDown
          v-else
          class="size-4 transition-transform duration-150"
          :class="{ 'rotate-180': pullDistance >= PULL_THRESHOLD }"
        />
      </div>
    </div>
    <button
      v-if="backTop && showBackTop"
      type="button"
      class="fixed right-[calc(1.25rem_+_var(--safe-right))] bottom-[calc(7rem_+_var(--safe-bottom))] sm:bottom-[calc(2rem_+_var(--safe-bottom))] z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-card shadow-[0_0_12px_rgba(0,0,0,0.12)]"
      @click="scrollToTop"
    >
      <ChevronUp class="size-5" :stroke-width="3" />
    </button>
  </div>
</template>

<style scoped>
:deep([data-slot="scroll-area-viewport"]) {
  overscroll-behavior-y: contain;
}
</style>
