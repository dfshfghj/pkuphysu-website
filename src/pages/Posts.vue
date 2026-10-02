<template>
  <div class="posts-container">
    <h2 class="page-title font-serif">文章</h2>

    <div v-if="loading" class="mx-5 space-y-3">
      <Skeleton v-for="row in 6" :key="row" class="h-24 w-full" />
    </div>

    <Alert v-else-if="error" variant="destructive" class="mx-5">
      <AlertTitle>{{ error }}</AlertTitle>
    </Alert>

    <div v-else class="posts-list">
      <a v-for="(post, index) in posts" :key="index" :href="post.url" style="text-decoration: none">
        <div class="post-card">
          <div class="time">
            <span>{{ post.publish_time }}</span>
          </div>
          <div class="cardHeader">
            <span class="title">{{ post.title }}</span>
          </div>
          <div class="detail">
            <span>{{ post.description }}</span>
          </div>
          <div>
            <Badge variant="secondary">{{ post.tag }}</Badge>
          </div>
        </div>
      </a>
    </div>
    <div class="pagination-container">
      <Pagination
        :page="currentPage"
        :total="count"
        :items-per-page="pageSize"
        :sibling-count="1"
        show-edges
        @update:page="handlePageChange"
      >
        <PaginationContent v-slot="{ items }">
          <PaginationPrevious>
            <ChevronLeft class="size-4" />
          </PaginationPrevious>
          <template v-for="(item, index) in items" :key="index">
            <PaginationItem v-if="item.type === 'page'" :value="item.value" :is-active="item.value === currentPage">
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :index="index" />
          </template>
          <PaginationNext>
            <ChevronRight class="size-4" />
          </PaginationNext>
          <span class="ml-2 text-sm text-(--c-secondary)">共 {{ count }} 篇</span>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>

<script setup>
import { requestApi } from "../api/api";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const posts = ref([]);
const count = ref(0);
const loading = ref(true);
const error = ref("");
const pageSize = 10;
const currentPage = ref(1);

const fetchPosts = async (page = 1) => {
  try {
    const res = await requestApi(`/api/v2/posts?limit=${pageSize}&page=${page}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    posts.value = data.data;
    count.value = data.count;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage) => {
  currentPage.value = newPage;
  fetchPosts(newPage);
  window.scrollTo({ top: 50, behavior: "smooth" });
};

onMounted(() => {
  fetchPosts();
});
</script>

<style scoped>
span {
  color: var(--c-text);
}

.posts-container {
  max-width: 700px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  border: 1px solid var(--c-border);
  padding: 20px;
  text-align: left;
}

.post-card:hover {
  background: var(--c-hover);
}

.cardHeader {
  display: flex;
  font-size: 17px;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.title {
  color: var(--c-title);
  font-size: 16px;
}

.time {
  font-size: 12px;
}
.detail {
  margin: 8px;
}

.pagination-container {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}
@media (max-width: 768px) {
  .posts-container {
    padding: 15px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .post-card {
    border-radius: 8px;
  }

  .title {
    font-size: 1.1rem;
  }
}
</style>
