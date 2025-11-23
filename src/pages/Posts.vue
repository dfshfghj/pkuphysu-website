<template>
  <div class="posts-container">
    <h2 class="page-title">Post</h2>

    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="6" animated style="margin: 20px" />

    <!-- 错误提示 -->
    <el-alert v-else-if="error" :title="error" type="error" show-icon style="margin: 20px" />

    <!-- 文章列表 -->
    <div v-else class="posts-list">
      <a v-for="(post, index) in posts" :key="index" :href="post.url" style="text-decoration: none">
      <div shadow="hover" class="post-card">
        <div class="time"><span>{{ post.publish_time }}</span></div>
        <div class="cardHeader">
          <span class="title">{{ post.title }}</span>
        </div>
        <div class="detail"><span>{{ post.description }}</span></div>
        <div>
          <el-tag type="info" size="small">{{ post.tag }}</el-tag>
        </div>
      </div>
      </a>
    </div>
    <div class="pagination-container">
        <el-pagination
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="count"
          layout="prev, pager, next, total"
        />
      </div>
    </div>
</template>

<script setup>
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const posts = ref([]);
const count = ref(0);
const loading = ref(true);
const error = ref('');
const pageSize = 10
const currentPage = ref(1)

// 获取数据
const fetchPosts = async (page = 1) => {
  try {
    const res = await fetch(`${API_BASE}/api/wechat/posts?limit=${pageSize}&page=${page}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    posts.value = data.data;
    count.value = data.count;
  } catch (err) {
    error.value = '无法加载文章列表，请稍后重试。';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchPosts(newPage);
  window.scrollTo({ top: 50, behavior: 'smooth' })
}

onMounted(() => {
  fetchPosts(1);
});
</script>

<style scoped>
span {
  color: var(--c-text);
}

.small {
  font-size: 14px;
}

.posts-container {
  max-width: 700px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  box-shadow: var(--c-box-shadow);
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

.link {
  font-size: 0.9rem;
  float: right;
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