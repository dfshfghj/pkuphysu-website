<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@/components/ui/tags-input";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    placeholder?: string;
    maxCollapseTags?: number;
  }>(),
  { placeholder: "", maxCollapseTags: 3 }
);

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const visibleTags = computed(() => props.modelValue.slice(0, props.maxCollapseTags));
const hiddenTags = computed(() => props.modelValue.slice(props.maxCollapseTags));
</script>

<template>
  <TagsInput
    :model-value="modelValue"
    delimiter=" "
    add-on-blur
    class="min-h-8 min-w-0 flex-1 gap-1 border-0 bg-transparent px-2 py-0 shadow-none focus-within:ring-0"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <TagsInputItem v-for="tag in visibleTags" :key="tag" :value="tag">
      <TagsInputItemText />
      <TagsInputItemDelete />
    </TagsInputItem>
    <Popover v-if="hiddenTags.length">
      <PopoverTrigger as-child>
        <Badge as="button" type="button" variant="secondary">+{{ hiddenTags.length }}</Badge>
      </PopoverTrigger>
      <PopoverContent class="flex w-auto max-w-60 flex-wrap gap-1">
        <Badge v-for="tag in hiddenTags" :key="tag" variant="secondary">{{ tag }}</Badge>
      </PopoverContent>
    </Popover>
    <TagsInputInput :placeholder="placeholder" />
  </TagsInput>
</template>
