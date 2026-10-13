<template>
  <Dialog :open="visible" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>发起投票</DialogTitle>
      </DialogHeader>

      <label class="poll-multiple">
        <input type="checkbox" v-model="multiple" />
        <span>允许多选</span>
      </label>

      <div class="poll-options">
        <div v-for="(option, index) in options" :key="index" class="poll-option-row">
          <Input v-model="options[index]" :placeholder="`选项 ${index + 1}`" />
          <button
            type="button"
            class="poll-remove"
            :disabled="options.length <= MIN_OPTIONS"
            aria-label="删除选项"
            @click="removeOption(index)"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>

      <button type="button" class="poll-add" :disabled="options.length >= MAX_OPTIONS" @click="addOption">
        + 添加选项
      </button>

      <DialogFooter>
        <Button variant="outline" @click="close">取消</Button>
        <Button :disabled="!canConfirm" @click="confirm">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PollConfig } from "@/utils/poll";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  initial: {
    type: Object as PropType<PollConfig | null>,
    default: null,
  },
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [config: PollConfig];
}>();

const multiple = ref(false);
const options = ref<string[]>(["", ""]);

const normalizedOptions = computed(() => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of options.value) {
    const text = raw.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
});

const canConfirm = computed(() => normalizedOptions.value.length >= MIN_OPTIONS);

const reset = () => {
  multiple.value = props.initial?.multiple ?? false;
  options.value = props.initial ? [...props.initial.options] : ["", ""];
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset();
  },
  { immediate: true }
);

const handleOpenChange = (open: boolean) => emit("update:visible", open);
const close = () => emit("update:visible", false);

const addOption = () => {
  if (options.value.length < MAX_OPTIONS) {
    options.value.push("");
  }
};

const removeOption = (index: number) => {
  if (options.value.length > MIN_OPTIONS) {
    options.value.splice(index, 1);
  }
};

const confirm = () => {
  if (!canConfirm.value) {
    return;
  }
  emit("confirm", { multiple: multiple.value, options: normalizedOptions.value });
  close();
};
</script>

<style scoped>
.poll-multiple {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--foreground);
  cursor: pointer;
}

.poll-multiple input {
  accent-color: var(--primary);
}

.poll-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.poll-option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.poll-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
}

.poll-remove:hover:not(:disabled) {
  background: var(--muted);
}

.poll-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.poll-add {
  align-self: flex-start;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 0.875rem;
  cursor: pointer;
}

.poll-add:hover:not(:disabled) {
  background: var(--muted);
}

.poll-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
