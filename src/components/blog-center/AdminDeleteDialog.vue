<script setup lang="ts">
import { ref } from "vue";
import { requestApi } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "vue-sonner";

const props = defineProps<{
  modelValue: boolean;
  endpoint: string;
  title: string;
  description: string;
  successMessage: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const deleting = ref(false);

const handleOpenChange = (value: boolean) => {
  if (deleting.value) {
    return;
  }
  emit("update:modelValue", value);
};

const handleDelete = async () => {
  deleting.value = true;
  try {
    const res = await requestApi(props.endpoint, {
      method: "DELETE",
    });
    const result = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(result?.message || "删除失败");
    }

    toast.success(result?.message || props.successMessage);
    emit("success");
    emit("update:modelValue", false);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "删除失败");
  } finally {
    deleting.value = false;
  }
};
</script>

<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-110">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" :disabled="deleting" @click="handleOpenChange(false)">取消</Button>
        <Button
          class="bg-(--red-6) text-white hover:bg-(--red-7)"
          :disabled="deleting"
          @click="handleDelete"
        >
          {{ deleting ? "删除中..." : "确认删除" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
