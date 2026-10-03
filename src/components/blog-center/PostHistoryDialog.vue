<template>
  <Dialog :open="modelValue" @update:open="(open: boolean) => emit('update:modelValue', open)">
    <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-170">
      <DialogHeader>
        <DialogTitle>历史版本</DialogTitle>
      </DialogHeader>

      <div v-if="loading" class="py-8 text-center text-sm text-(--c-secondary)">加载中…</div>
      <div v-else-if="entries.length === 0" class="py-8 text-center text-sm text-(--c-secondary)">暂无历史版本</div>
      <div v-else class="flex flex-col gap-4">
        <div
          v-for="entry in entries"
          :key="entry.version.version"
          class="overflow-hidden rounded-md border border-(--c-border)"
        >
          <div class="flex items-center justify-between gap-2 bg-(--gray-2) px-3 py-1.5 text-sm">
            <span class="font-bold">
              版本 {{ entry.version.version }}
              <span v-if="entry.version.is_current" class="ml-1 font-normal text-(--c-secondary)">（当前）</span>
            </span>
            <span class="flex items-center gap-3 text-(--c-secondary)">
              <span v-if="entry.added || entry.removed" class="text-xs">
                <span class="text-green-600 dark:text-green-400">+{{ entry.added }}</span>
                <span class="ml-1 text-red-600 dark:text-red-400">-{{ entry.removed }}</span>
              </span>
              <span class="text-xs">{{ formatTime(entry.version.timestamp).formattedTime }}</span>
            </span>
          </div>
          <div class="font-mono text-xs leading-5">
            <div
              v-for="(line, index) in entry.lines"
              :key="index"
              class="px-2 whitespace-pre-wrap break-words"
              :class="lineClass(line.type)"
            >
              <span class="mr-1 inline-block w-3 select-none opacity-60">{{ linePrefix(line.type) }}</span
              >{{ line.text }}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requestApi } from "@/api/api";
import { toast } from "vue-sonner";
import { formatTime } from "@/utils";
import { lineDiff, diffStats, type DiffLine } from "@/utils/diff";

interface PostVersion {
  version: number;
  content: string;
  text: string;
  timestamp: number;
  is_current: boolean;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  postId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const loading = ref(false);
const versions = ref<PostVersion[]>([]);
const editCount = ref(0);
const maxEditCount = ref(0);

const entries = computed(() =>
  versions.value.map((version, index) => {
    const previous = versions.value[index - 1];
    const lines: DiffLine[] = previous
      ? lineDiff(previous.content, version.content)
      : lineDiff(version.content, version.content);
    return { version, lines, ...diffStats(lines) };
  })
);

const lineClass = (type: DiffLine["type"]) => {
  if (type === "add") return "bg-green-500/10 text-green-700 dark:text-green-300";
  if (type === "del") return "bg-red-500/10 text-red-700 dark:text-red-300";
  return "";
};

const linePrefix = (type: DiffLine["type"]) => (type === "add" ? "+" : type === "del" ? "-" : " ");

const fetchVersions = async () => {
  loading.value = true;
  try {
    const res = await requestApi(`/api/v2/forum/posts/${props.postId}/versions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()).data;
    versions.value = data?.versions ?? [];
    editCount.value = Number(data?.edit_count ?? 0);
    maxEditCount.value = Number(data?.max_edit_count ?? 0);
  } catch (error) {
    toast.error("加载历史版本失败");
    console.error("Fetch post versions failed:", error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      versions.value = [];
      fetchVersions();
    }
  }
);
</script>
