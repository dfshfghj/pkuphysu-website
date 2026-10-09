<template>
  <div class="post-poll">
    <div v-if="!current.voted" class="post-poll__vote">
      <label v-for="option in current.options" :key="option.id" class="post-poll__choice">
        <input
          :type="current.multiple ? 'checkbox' : 'radio'"
          :name="`poll-${postId}`"
          :value="option.id"
          :checked="isSelected(option.id)"
          @change="toggle(option.id, $event)"
        />
        <span>{{ option.text }}</span>
      </label>
      <div class="post-poll__actions">
        <Button size="sm" :disabled="!selection.length || submitting" @click="submit">投票</Button>
        <span v-if="!current.can_see_results" class="post-poll__hint">投票后可见结果</span>
      </div>
    </div>

    <div v-if="current.can_see_results" class="post-poll__results">
      <div
        v-for="option in current.options"
        :key="option.id"
        class="post-poll__result"
        :class="{ 'post-poll__result--selected': option.selected }"
      >
        <div class="post-poll__result-head">
          <span class="post-poll__result-text">{{ option.text }}</span>
          <span class="post-poll__result-percent">{{ option.percent ?? 0 }}%</span>
        </div>
        <div class="post-poll__bar">
          <div class="post-poll__bar-fill" :style="{ width: `${option.percent ?? 0}%` }"></div>
        </div>
        <span class="post-poll__result-count">{{ option.count ?? 0 }} 票</span>
      </div>
      <p class="post-poll__total">共 {{ current.total_votes ?? 0 }} 人参与</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { toast } from "vue-sonner";
import { requestApi } from "@/api/api";
import { Button } from "@/components/ui/button";
import type { Poll } from "@/stores/forum";

const props = defineProps({
  postId: {
    type: Number,
    required: true,
  },
  poll: {
    type: Object as PropType<Poll>,
    required: true,
  },
});

const emit = defineEmits<{
  voted: [poll: Poll];
}>();

const current = ref<Poll>(props.poll);
const selection = ref<number[]>([]);
const submitting = ref(false);

watch(
  () => props.poll,
  (poll) => {
    current.value = poll;
  }
);

const isSelected = (id: number) => selection.value.includes(id);

const toggle = (id: number, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  if (current.value.multiple) {
    if (checked) {
      if (!selection.value.includes(id)) {
        selection.value = [...selection.value, id];
      }
    } else {
      selection.value = selection.value.filter((optionId) => optionId !== id);
    }
    return;
  }
  selection.value = checked ? [id] : [];
};

const submit = async () => {
  if (!selection.value.length || submitting.value) {
    return;
  }

  submitting.value = true;
  try {
    const res = await requestApi(`/api/v2/forum/posts/${props.postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option_ids: selection.value }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(data?.message || "投票失败");
      return;
    }

    const updated = data?.data?.poll as Poll | undefined;
    if (updated) {
      current.value = updated;
      selection.value = [];
      emit("voted", updated);
    }
  } catch (error) {
    toast.error("网络错误");
    console.error("Vote failed:", error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.post-poll {
  margin: 0.5rem 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--gray-2);
}

.post-poll__vote {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.post-poll__choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--c-title);
  cursor: pointer;
}

.post-poll__choice input {
  accent-color: var(--primary);
}

.post-poll__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.post-poll__hint {
  font-size: 0.75rem;
  color: var(--c-secondary);
}

.post-poll__results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-poll__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--c-title);
}

.post-poll__result--selected .post-poll__result-text {
  font-weight: 600;
  color: var(--primary);
}

.post-poll__bar {
  height: 6px;
  margin: 0.2rem 0;
  border-radius: 999px;
  background: color-mix(in oklab, var(--c-border) 70%, transparent);
  overflow: hidden;
}

.post-poll__bar-fill {
  height: 100%;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary) 78%, transparent);
}

.post-poll__result-count {
  font-size: 0.75rem;
  color: var(--c-secondary);
}

.post-poll__total {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--c-secondary);
}
</style>
