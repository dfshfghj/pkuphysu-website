<script setup lang="ts">
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    distance?: number;
    backTop?: boolean;
    backTopThreshold?: number;
  }>(),
  { distance: 400, backTop: false, backTopThreshold: 400 }
);

const emit = defineEmits<{ "end-reached": [] }>();

const scrollAreaRef = ref();
const viewport = ref<HTMLElement | null>(null);
const showBackTop = ref(false);
// keep-alive 停用时 DOM 会被移出文档，滚动位置会丢，这里自己记住并在 activated 时还原
const savedScrollTop = ref(0);

const handleScroll = () => {
  const el = viewport.value;
  if (!el) return;

  savedScrollTop.value = el.scrollTop;
  showBackTop.value = el.scrollTop > props.backTopThreshold;

  if (el.scrollTop + el.clientHeight >= el.scrollHeight - props.distance) {
    emit("end-reached");
  }
};

onMounted(() => {
  const root = (scrollAreaRef.value?.$el ?? scrollAreaRef.value) as HTMLElement | undefined;
  viewport.value = root?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null;
  viewport.value?.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  viewport.value?.removeEventListener("scroll", handleScroll);
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
    <button
      v-if="backTop && showBackTop"
      type="button"
      class="fixed right-5 bottom-[30px] z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-card shadow-[0_0_12px_rgba(0,0,0,0.12)]"
      @click="scrollToTop"
    >
      <ChevronUp class="size-5" :stroke-width="3" />
    </button>
  </div>
</template>
