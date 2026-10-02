<template>
  <div class="min-h-lvh">
    <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">板块</h2>
    <div class="pt-5 flex flex-col gap-4 w-full">
      <Item
        v-for="board in boards"
        :key="board.name"
        variant="outline"
        size="default"
        class="cursor-pointer hover:bg-accent/50 transition-all mx-4"
        @click="navigateToSearch(board.tag)"
      >
        <span class="text-md font-bold">{{ board.name }}</span>
      </Item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Item } from "@/components/ui/item";

const router = useRouter();

// 定义常见的板块
const boards = [
  { name: "学术讨论", tag: "学术讨论" },
  { name: "生活分享", tag: "生活分享" },
  { name: "活动通知", tag: "活动通知" },
  { name: "技术交流", tag: "技术交流" },
  { name: "校园资讯", tag: "校园资讯" },
  { name: "问答互助", tag: "问答互助" },
];

const navigateToSearch = (tag: string) => {
  router.push({ path: "/search", query: { tag } });
};
</script>
