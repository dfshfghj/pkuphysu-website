<template>
  <div class="bb" @click="changeBodyDown">&#xe737;</div>
  <div class="body body-home show" ref="homeRef" @wheel="onScrollDown">
    <div class="pictureContainer">
      <el-carousel height="calc(100vh - var(--el-menu-item-height) - 4px)" motion-blur indicator-position="none">
        <el-carousel-item v-for="item in news" :key="item.title" type="card" class="carousel-item">
          <a :href="item.href" target="_blank" style="text-decoration: none; width: 100%; height: 100%;">
            <div
              :style="{ backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.9) 0% , transparent 20%), url(/api/images/${item.img})` }"
              class="carousel-img">
              <div class="carousel-title">

                <span style="color: white;"> {{ item.title }} </span>

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
        <span>活动</span>
      </div>
      <div id="cardList">
        <a v-for="(activity, index) in activities" :key="index" :href="activity.href" style="text-decoration: none">
          <div class="card with_image" :style="{ backgroundImage: `url(/api/images/${activity.img})` }">
            <div class="card-info acrylic">
              <div class="time">
                <span>{{ activity.start }} - {{ activity.end }}</span>
                <span v-if="activity.startTime <= now && now <= activity.endTime"
                  style="color: var(--green-4); font-weight: bold"> 进行中 </span>
                <span v-else-if="now < activity.startTime" style="color: var(--gray-4); font-weight: bold"> 未开始 </span>
                <span v-else style="color: var(--gray-4); font-weight: bold"> 已结束 </span>
              </div>
              <div class="cardHeader">
                <span>{{ activity.name }}</span>
              </div>
              <div class="detail">
                <span>{{ activity.detail }}</span>
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>

    <!-- 通知部分 -->
    <div class="activityContainer">
      <div class="containerHeader">
        <span>Posts</span>
      </div>
      <div id="cardList">
        <a v-for="(post, index) in posts" :key="index" :href="post.url" target="_blank" style="text-decoration: none">
          <div class="card post-card">
            <div class="time" style="white-space: nowrap;">
              <span>{{ post.publish_time }}</span>
            </div>
            <div class="detail small">
              <span>{{ post.title }}</span>
            </div>
          </div>
        </a>
        <div style="text-align: right; font-size: 12px; text-decoration: none; padding: 10px 20px 30px 20px;"><a href="/posts"><span> View More </span></a></div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="bottom">
      <div id="github">
        <a href="https://github.com/pkuphysu" target="_blank" rel="noopener"
          style="text-decoration: none; color: var(--c-text)">
          <i class="fab fa-github github-icon"></i>
        </a>
      </div>
      <div id="wechat" style="display: flex">
        <i class="fab fa-weixin" style="color: #07c160; margin-right: 5px"></i>
        <span style="font-size: 12px">公众号 | 物院学生会</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const homeRef = ref(null);
const contentRef = ref(null);
const news = ref([]);
const activities = ref([]);
const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const now = ref(Date.now());

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fetchNews = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/news`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    news.value = data.map(item => ({
      ...item,
      startTime: new Date(item.start_time).getTime(),
      endTime: new Date(item.end_time).getTime(),
    }));
  } catch (err) {
    error.value = "无法加载数据，请稍后再试。";
    console.error("Fetch news failed:", err);
  } finally {
    loading.value = false;
  }
};

const fetchActivities = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/activities`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    activities.value = data.map(item => ({
      ...item,
      startTime: new Date(item.start_time).getTime(),
      endTime: new Date(item.end_time).getTime(),
    }));
  } catch (err) {
    error.value = "无法加载数据，请稍后再试。";
    console.error("Fetch activities failed:", err);
  } finally {
    loading.value = false;
  }
};

const fetchPosts = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/wechat/posts?limit=10&page=1`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    posts.value = data.data;
  } catch (err) {
    error.value = "无法加载数据，请稍后再试。";
    console.error("Fetch posts failed:", err);
  } finally {
    loading.value = false;
  }
};

const changeBodyDown = () => {
  const homeEl = homeRef.value;
  const contentEl = contentRef.value;
  if (!homeEl || !contentEl) return;

  contentEl.classList.add('show');
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
    contentEl.classList.remove('show');
    homeEl.classList.add('show');
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
  font-size: 18px;
  font-weight: bold;
}

.with_image {
  height: 200px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: flex-end;
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
  justify-content: space-between;
  margin: 20px 80px;
  font-size: 20px;
}

.card {
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
  font-size: 17px;
  color: var(--c-subtitle);
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
</style>
