<template>
  <div class="bb unselectable" @click="changeBodyDown">&#xe737;</div>
  <div
    class="body body-home show unselectable"
    ref="homeRef"
    @wheel="onScrollDown"
  >
    <div class="pictureContainer">
      <el-carousel
        height="calc(100vh - var(--el-menu-item-height) - 4px)"
        indicator-position="none"
      >
        <el-carousel-item
          v-for="item in news"
          :key="item.title"
          type="card"
          class="carousel-item"
        >
          <a
            :href="item.href"
            target="_blank"
            style="text-decoration: none; width: 100%; height: 100%"
          >
            <div
              :style="{
                backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.9) 0% , transparent 20%), url(${item.img})`,
              }"
              class="carousel-img"
            >
              <div class="carousel-title">
                <span style="color: white" class="font-serif">
                  {{ item.title }}
                </span>
              </div>
            </div>
          </a>
        </el-carousel-item>
      </el-carousel>
    </div>
  </div>
  <div class="body body-content" ref="contentRef" @wheel="changeBodyUp">
    <div class="space"></div>
    <div class="activityContainer">
      <div class="containerHeader">
        <span class="font-serif">活动</span>
      </div>
      <el-row id="cardList" :gutter="16" style="margin: 0px">
        <el-col
          v-for="(activity, index) in activities"
          :key="index"
          :md="12"
          :sm="12"
          :xs="24"
        >
          <a :href="activity.href" style="text-decoration: none">
            <el-card shadow="hover" class="card post-card with-image">
              <div class="card-info">
                <!---
              <div class="time">
                <span>{{ activity.start }} - {{ activity.end }}</span>
                <span
                  v-if="activity.startTime <= now && now <= activity.endTime"
                  style="color: var(--green-4); font-weight: bold"
                >
                  进行中
                </span>
                
                <span
                  v-else-if="now < activity.startTime"
                  style="color: var(--gray-4); font-weight: bold"
                >
                  未开始
                </span>
                <span v-else style="color: var(--gray-4); font-weight: bold">
                  已结束
                </span>
                
              </div>
              -->

                <div class="cardHeader">
                  <span>{{ activity.name }}</span>
                </div>
                <div class="cardSubHeader">
                  <span>{{ activity.detail }}</span>
                </div>
              </div>
            </el-card>
          </a>
        </el-col>
      </el-row>
    </div>

    <!-- 通知部分 -->
    <div class="activityContainer">
      <div class="containerHeader">
        <span class="font-serif">文章</span>
      </div>
      <div id="cardList">
        <a
          v-for="(post, index) in posts"
          :key="index"
          :href="post.url"
          target="_blank"
          style="text-decoration: none"
        >
          <div class="card post-card">
            <div class="time" style="white-space: nowrap">
              <span>{{ post.publish_time }}</span>
            </div>
            <div class="detail small">
              <span>{{ post.title }}</span>
            </div>
          </div>
        </a>
        <div
          style="
            text-align: right;
            font-size: 12px;
            text-decoration: none;
            padding: 10px 20px 30px 20px;
          "
        >
          <a href="/posts"><span> View More </span></a>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="bottom">
      <div id="github">
        <a
          href="https://github.com/pkuphysu"
          target="_blank"
          rel="noopener"
          style="
            text-decoration: none;
            color: var(--c-text);
            display: flex;
            align-items: center;
            margin: 10px;
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-github"
            viewBox="0 0 16 16"
          >
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          <span style="font-size: 12px; margin-left: 5px">GitHub</span>
        </a>
      </div>
      <div
        id="wechat"
        style="
          display: flex;
          align-items: center;
          margin: 10px;
          cursor: pointer;
        "
        @click="showWechatQRCode = true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-wechat"
          viewBox="0 0 16 16"
        >
          <path
            d="M11.176 14.429c-2.665 0-4.826-1.8-4.826-4.018 0-2.22 2.159-4.02 4.824-4.02S16 8.191 16 10.411c0 1.21-.65 2.301-1.666 3.036a.324.324 0 0 0-.12.366l.218.81a.616.616 0 0 1 .029.117.166.166 0 0 1-.162.162.177.177 0 0 1-.092-.03l-1.057-.61a.519.519 0 0 0-.256-.074.509.509 0 0 0-.142.021 5.668 5.668 0 0 1-1.576.22ZM9.064 9.542a.647.647 0 1 0 .557-1 .645.645 0 0 0-.646.647.615.615 0 0 0 .09.353Zm3.232.001a.646.646 0 1 0 .546-1 .645.645 0 0 0-.644.644.627.627 0 0 0 .098.356Z"
          />
          <path
            d="M0 6.826c0 1.455.781 2.765 2.001 3.656a.385.385 0 0 1 .143.439l-.161.6-.1.373a.499.499 0 0 0-.032.14.192.192 0 0 0 .193.193c.039 0 .077-.01.111-.029l1.268-.733a.622.622 0 0 1 .308-.088c.058 0 .116.009.171.025a6.83 6.83 0 0 0 1.625.26 4.45 4.45 0 0 1-.177-1.251c0-2.936 2.785-5.02 5.824-5.02.05 0 .1 0 .15.002C10.587 3.429 8.392 2 5.796 2 2.596 2 0 4.16 0 6.826Zm4.632-1.555a.77.77 0 1 1-1.54 0 .77.77 0 0 1 1.54 0Zm3.875 0a.77.77 0 1 1-1.54 0 .77.77 0 0 1 1.54 0Z"
          />
        </svg>
        <span style="font-size: 12px; margin-left: 5px"
          >公众号 | 物院学生会</span
        >
      </div>
    </div>
  </div>
  <el-dialog v-model="showWechatQRCode" title="关注我们" width="30%">
    <div style="text-align: center">
      <img
        src="/images/qrcode_for_pkuphysu.jpg"
        alt="微信公众号二维码"
        style="width: 80%; max-width: 250px; margin-bottom: 10px"
      />
      <p>扫描二维码关注我们的公众号</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { requestApi } from "../api/api";

const homeRef = ref(null);
const contentRef = ref(null);
const news = ref([]);
const activities = ref([]);
const posts = ref([]);
const loading = ref(true);
const now = ref(Date.now());

const showWechatQRCode = ref(false);

const fetchNews = async () => {
  try {
    const res = await requestApi("/api/v2/news");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    news.value = data.data.map((item) => ({
      ...item,
      startTime: new Date(item.start_time).getTime(),
      endTime: new Date(item.end_time).getTime(),
    }));
  } catch (err) {
    console.error("Fetch news failed:", err);
  } finally {
    loading.value = false;
  }
};

const fetchActivities = async () => {
  try {
    const res = await requestApi("/api/v2/activity");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    activities.value = data.data.map((item) => ({
      ...item,
      startTime: new Date(item.start_time).getTime(),
      endTime: new Date(item.end_time).getTime(),
    }));
  } catch (err) {
    console.error("Fetch activities failed:", err);
  } finally {
    loading.value = false;
  }
};

const fetchPosts = async () => {
  try {
    const res = await requestApi("/api/v2/posts?limit=10&page=1");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    posts.value = data.data;
  } catch (err) {
    console.error("Fetch posts failed:", err);
  } finally {
    loading.value = false;
  }
};

const changeBodyDown = () => {
  const homeEl = homeRef.value;
  const contentEl = contentRef.value;
  if (!homeEl || !contentEl) return;

  contentEl.classList.add("show");
};

const onScrollDown = (event) => {
  const { deltaY } = event;
  if (deltaY > 0) {
    changeBodyDown();
  }
};

const changeBodyUp = (event) => {
  const { deltaY } = event;
  const homeEl = homeRef.value;
  const contentEl = contentRef.value;
  if (!homeEl || !contentEl) return;

  if (deltaY < 0 && contentEl.scrollTop == 0) {
    contentEl.classList.remove("show");
    homeEl.classList.add("show");
  }
};

onMounted(() => {
  fetchNews();
  fetchActivities();
  fetchPosts();

  const timer = setInterval(() => {
    now.value = Date.now();
  }, 60000);

  window.addEventListener("beforeunload", () => {
    clearInterval(timer);
  });
});
</script>

<style scoped>
.bb {
  z-index: 98;
  position: absolute;
  left: 50%;
  bottom: 0;
  text-align: center;
  color: #94070a;
  font-size: 36px;
  cursor: pointer;
  font-family: icon;
  transform: translateX(-50%);
  animation: bb 2s linear 0s infinite;
  font-weight: bold;
}

.carousel-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

.carousel-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.carousel-title {
  padding-bottom: 5%;
  padding-left: 5%;
  text-align: left;
  font-size: 26px;
  font-weight: bold;
  white-space: nowrap;
}

.with-image::before {
  content: "";
  position: absolute;
  top: 10px;
  right: 5px;
  width: 80px;
  height: 80%;
  background-image: url("favicon.svg");
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transition: transform 0.3s ease;
  z-index: -1;
}

span,
strong {
  color: var(--c-text);
}

.activityContainer {
  margin: 20px 50px;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--c-border);
  justify-content: center;
}

#cardList {
  width: 80%;
}

.bottom {
  display: flex;
  justify-content: center;
  margin: 20px auto;
  font-size: 20px;
}

.card {
  position: relative;
  text-align: center;
  padding: 0px;
  margin: 40px;
  border-radius: 5px;
  border: 1px solid var(--c-border);
  box-shadow: var(--c-box-shadow);
  transition: transform 0.3s ease;
}

.card-info {
  width: 100%;
  height: 50%;
  border-radius: 5px;
  padding-top: 10px;
  line-height: 2;
}

.card-info * {
  white-space: nowrap;
}

.card:not(.post-card):hover {
  transform: scale(1.05);
}

.post-card {
  background: var(--c-card);
  display: flex;
  align-items: center;
  padding: 5px;
  padding-left: 15px;
  margin: 10px;
  text-align: left;
  box-shadow: none;
}

.post-card:hover {
  background: var(--c-hover);
}

.container {
  margin-top: 100px;
}

.containerHeader {
  text-align: center;
  margin-right: 30px;
  font-weight: bold;
  font-size: 24px;
  color: var(--c-title);
}

.cardHeader * {
  font-weight: bold;
  font-size: 18px;
  color: var(--c-title);
}

.time {
  font-size: 12px;
}

.detail {
  margin: 10px;
}

.small {
  font-size: 14px;
}

@keyframes bb {
  0% {
    transform: translate(-50%, 0);
    opacity: 0;
  }

  20% {
    transform: translate(-50%, 3px);
    opacity: 1;
  }

  80% {
    transform: translate(-50%, 10px);
    opacity: 1;
  }

  90% {
    transform: translate(-50%, 10px);
    opacity: 0;
  }

  100% {
    transform: translate(-50%, 10px);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .bb {
    visibility: hidden;
  }

  .pictureContainer {
    margin: 0%;
  }

  .el-carousel__item {
    border-radius: 0px;
    height: 200px;
  }

  .el-carousel {
    height: 200px;
    border-radius: 6px;
    margin: 15px;
  }

  .carousel-title {
    font-size: 14px;
  }

  .activityContainer {
    margin: 0%;
    margin-top: 30px;
    flex-direction: column;
  }

  .containerHeader {
    text-align: center;
    margin: 0px;
  }

  #cardList {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .body {
    background: var(--c-background);
    position: fixed;
    top: 0px;
    height: 100vh;
    width: 100vw;
    overflow: auto;
  }

  .body.body-content {
    z-index: 99;
    top: 100vh;
    transition: top 0.7s cubic-bezier(0.5, 0, 0.2, 1) 0s;
  }

  .body-content.show {
    top: 0px;
  }

  .body-home {
    visibility: hidden;
  }

  .body-home.show {
    visibility: visible;
  }

  .pictureContainer {
    padding-top: calc(var(--el-menu-item-height) + 4px);
  }

  .space {
    margin-top: 100px;
  }
}

/* 弹窗内容样式 */
.el-dialog {
  border-radius: 10px;
}

.el-dialog__header {
  padding: 15px;
  border-bottom: 1px solid var(--c-border);
}

.el-dialog__body {
  padding: 20px;
}

.el-dialog__footer {
  padding: 15px;
  text-align: center;
}
</style>
