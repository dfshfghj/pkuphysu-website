<script setup lang="ts">
import { reactive, ref } from "vue";
import { requestApi } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { toast } from "vue-sonner";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    targetId: number;
    endpoint?: string;
  }>(),
  {
    endpoint: "",
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const reportForm = reactive({
  reason: "",
  detail: "",
});
const submitting = ref(false);

const resetForm = () => {
  reportForm.reason = "";
  reportForm.detail = "";
};

const handleOpenChange = (value: boolean) => {
  emit("update:modelValue", value);
  if (!value) {
    resetForm();
  }
};

const handleSubmit = async () => {
  const reason = reportForm.reason.trim();
  const detail = reportForm.detail.trim();

  if (!reason) {
    toast.error("请填写举报原因");
    return;
  }

  submitting.value = true;
  try {
    const res = await requestApi(props.endpoint || `/api/v2/forum/posts/${props.targetId}/report`, {
      method: "POST",
      body: JSON.stringify({
        reason,
        detail,
      }),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(result?.message || "举报失败");
    }

    toast.success(result?.message || "举报已提交");
    handleOpenChange(false);
    emit("success");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "举报失败");
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-125">
      <DialogHeader>
        <DialogTitle>举报内容</DialogTitle>
        <DialogDescription>请填写举报原因，必要时补充详情。</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="forum-report-reason">原因</label>
          <Input
            id="forum-report-reason"
            v-model="reportForm.reason"
            maxlength="50"
            placeholder="请填写举报原因"
          />
        </div>
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="forum-report-detail">详情</label>
          <Textarea
            id="forum-report-detail"
            v-model="reportForm.detail"
            class="min-h-28 resize-none"
            maxlength="500"
            placeholder="可补充更多信息，方便管理员处理"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleOpenChange(false)">取消</Button>
        <Button
          class="bg-(--red-6) text-white hover:bg-(--red-7)"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? "提交中..." : "提交举报" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
