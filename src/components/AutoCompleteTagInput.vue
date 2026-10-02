<template>
  <div class="tag-input-container">
    <TagsInput
      ref="rootEl"
      :model-value="modelValue"
      delimiter=" "
      add-on-blur
      class="tags-wrapper border-0 shadow-none focus-within:border-0 focus-within:ring-0"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <TagsInputItem v-for="tag in modelValue" :key="tag" :value="tag">
        <TagsInputItemText />
        <TagsInputItemDelete />
      </TagsInputItem>
      <TagsInputInput
        :placeholder="modelValue.length ? '' : '输入标签'"
        class="tag-input"
        @input="handleInput"
        @focus="handleFocus"
        @keydown.esc="open = false"
      />
    </TagsInput>

    <Popover :open="open" @update:open="open = $event">
      <PopoverContent
        :reference="anchor"
        align="start"
        class="p-1"
        @open-auto-focus.prevent
        @close-auto-focus.prevent
        @interact-outside="keepOpenForInput"
      >
        <Command>
          <CommandList>
            <CommandItem
              v-for="item in matches"
              :key="item"
              :value="item"
              @pointerdown.prevent
              @select="selectSuggestion(item)"
            >
              {{ item }}
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@/components/ui/tags-input";

const props = defineProps<{
  suggestions: { value: string }[];
  modelValue: string[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const rootEl = ref<{ $el: HTMLElement } | null>(null);
const anchor = computed(() => rootEl.value?.$el);
const draft = ref("");
const open = ref(false);

const matches = computed(() => {
  const keyword = draft.value.trim().toLowerCase();
  return props.suggestions
    .map((item) => item.value)
    .filter((value) => !props.modelValue.includes(value))
    .filter((value) => !keyword || value.toLowerCase().includes(keyword));
});

const handleInput = (event: Event) => {
  draft.value = (event.target as HTMLInputElement).value;
  open.value = matches.value.length > 0;
};

const handleFocus = () => {
  open.value = matches.value.length > 0;
};

const selectSuggestion = (value: string) => {
  if (!props.modelValue.includes(value)) {
    emit("update:modelValue", [...props.modelValue, value]);
  }
  // TagsInputInput 的输入值只存在于 DOM 上，这里直接清空即可
  const input = rootEl.value?.$el.querySelector("input");
  if (input) input.value = "";
  draft.value = "";
  open.value = false;
};

const keepOpenForInput = (event: Event) => {
  const target = event.target as Node | null;
  if (target && rootEl.value?.$el.contains(target)) {
    event.preventDefault();
  }
};
</script>

<style scoped>
.tag-input-container {
  width: 100%;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-radius: 4px;
  padding: 4px 8px;
  min-height: 40px;
}

.tags-wrapper:hover {
  border-color: #409eff;
}

.tag-input {
  flex: 1;
  min-width: 100px;
}
</style>
