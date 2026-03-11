<template>
  <div class="tag-input-container">
    <div class="tags-wrapper">
      <el-tag v-for="tag in internalTags" :key="tag" closable @close="removeTag(tag)">
        {{ tag }}
      </el-tag>
      <el-autocomplete
        v-model="inputValue"
        :fetch-suggestions="querySearch"
        placeholder="输入标签"
        @select="handleSelect"
        @keydown.enter="handleEnter"
        class="tag-input"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";

const props = defineProps({
  // 外部传入的建议列表，格式为 { value: string }[]
  suggestions: {
    type: Array,
    default: () => [],
  },
  // 支持 v-model 绑定
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue"]);

// 使用内部状态，避免直接监听props变化导致的循环
const internalTags = ref([...props.modelValue]);
const inputValue = ref("");

// 只在组件挂载或外部modelValue真正变化时同步（避免循环）
let isInternalUpdate = false;

// 监听外部 modelValue 变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (!isInternalUpdate) {
      internalTags.value = [...newVal];
    }
    isInternalUpdate = false;
  },
  { deep: true }
);

// 搜索建议
const querySearch = (queryString, cb) => {
  const results = queryString ? props.suggestions.filter(createFilter(queryString)) : props.suggestions;
  cb(results);
};

const createFilter = (queryString) => {
  return (item) => {
    return item.value.toLowerCase().includes(queryString.toLowerCase());
  };
};

// 选择建议
const handleSelect = (item) => {
  addTag(item.value);
};

// 回车添加
const handleEnter = (event) => {
  event.preventDefault();
  if (inputValue.value.trim()) {
    addTag(inputValue.value.trim());
  }
};

// 添加标签
const addTag = (tag) => {
  if (tag && !internalTags.value.includes(tag)) {
    internalTags.value.push(tag);
    // 标记为内部更新，避免触发props监听器
    isInternalUpdate = true;
    emit("update:modelValue", [...internalTags.value]);
  }
  inputValue.value = "";
};

// 删除标签
const removeTag = (tag) => {
  internalTags.value = internalTags.value.filter((t) => t !== tag);
  // 标记为内部更新，避免触发props监听器
  isInternalUpdate = true;
  emit("update:modelValue", [...internalTags.value]);
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
