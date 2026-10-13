<template>
  <div class="min-h-lvh bg-card">
    <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">板块</h2>
    <p class="px-6 pt-2 text-sm text-muted-foreground">选择一个板块，浏览该话题下的帖子。</p>
    <div class="pt-5 flex flex-col gap-4 w-full">
      <Item
        v-for="board in boards"
        :key="board.name"
        variant="outline"
        size="default"
        class="cursor-pointer hover:bg-accent/50 transition-all mx-4"
        @click="navigateToSearch(board.tag)"
      >
        <div class="flex flex-col gap-0.5">
          <span class="text-md font-bold">{{ board.name }}</span>
          <span class="text-xs text-muted-foreground">{{ board.description }}</span>
        </div>
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
  { name: "学术讨论", tag: "学术讨论", description: "物理、数学等学科的学习与讨论" },
  { name: "生活分享", tag: "生活分享", description: "校园生活、日常见闻与经验分享" },
  { name: "活动通知", tag: "活动通知", description: "学生会及社团活动信息发布" },
  { name: "技术交流", tag: "技术交流", description: "编程、工具与实用技术交流" },
  { name: "校园资讯", tag: "校园资讯", description: "校内新闻与通知汇总" },
  { name: "问答互助", tag: "问答互助", description: "提问求助与互相解答" },
];

const navigateToSearch = (tag: string) => {
  router.push({ path: "/search", query: { tag } });
};
</script>
