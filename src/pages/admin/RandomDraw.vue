<script setup>
import { useUserStore } from "../../stores/user";
const userStore = useUserStore();

const word = ref(""); // 显示的文字
const textColor = ref("white"); // 文字颜色
const status = ref(0); // 抽奖状态: 0=运行中, 1=停止
const currentLayout = ref(3); // 当前动画布局
const luckyDogs = ref([]); // 中奖名单
const selectedName = ref("人数不足"); // 当前选中的名字
const isAnimating = ref(false); // 是否正在动画循环

// URL 参数
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const urlParams = new URLSearchParams(window.location.search);
const ensureLoop = parseInt(urlParams.get("least")) || 20;
const randomControl = parseFloat(urlParams.get("random")) || 0.1;
const prizeType = urlParams.get("prize");
const eventName = urlParams.get("event") || "抽奖";
// const method = urlParams.get("method") || "tradition"; // tradition | click_control
const method = "click_control";
word.value = urlParams.get("word") || eventName;
// word.value = "二等奖抽奖";

// 数据状态
let allStudents = null;
let names = [];
let pointList = [];
let totalPoints = 0;
let studentNum = 0;
let loopCounter = 0;

// -------------------------------
// 2. Canvas 动画核心逻辑
// -------------------------------

let canvas, context, particles, text, nextText, reOrder, shape;
let showLoop, numberLoop;

// 配置常量
const FPS = 60;
const mainNum = 360;
const partNum = mainNum / 3;
const halfX = 450;
const halfY = 250;
const colors = [
  ["#e67e22", "#2c3e50"],
  ["#c0392b", "#ff7e15"],
  ["#1d75cf", "#3a5945"],
  ["#702744", "#f98d00"],
  ["#e67e22", "#2c3e50"],
  ["#c0392b", "#ff7e15"],
  ["#1d75cf", "#3a5945"],
  ["#702744", "#f98d00"],
  ["#e67e22", "#2c3e50"],
  ["#c0392b", "#ff7e15"],
  ["#e67e22", "#2c3e50"],
  ["#c0392b", "#ff7e15"],
  ["#1d75cf", "#3a5945"],
  ["#c0392b", "#ff7e15"],
  ["#702744", "#f98d00"],
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOrder(arr, start, end) {
  for (let i = start; i < end; i++) arr[i] = i;
  for (let i = end - 1; i > start; i--) {
    const j = randomBetween(start, i);
    [arr[j], arr[i]] = [arr[i], arr[j]];
  }
}

function createCanvas() {
  const container = document.querySelector(".ip-slideshow");
  if (!container) return;

  canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = 700;
  container.appendChild(canvas);
  context = canvas.getContext("2d");

  particles = [];
  text = [];
  nextText = [[], []];
  reOrder = [];
  shape = {};

  initAnimation();
}

function initAnimation() {
  randomOrder(reOrder, 0, mainNum);
  createParticles();
  createText(word.value);
  showLoop = setInterval(showPic, 2500);
  loop();
}

function createParticles() {
  for (let a = 0; a < mainNum; a++) {
    const e = (2 * Math.PI * a) / mainNum;
    const c = 0.5 * canvas.width + 10 * Math.cos(e);
    const d = 180 + 10 * Math.sin(e);
    const radius = randomBetween(0, 12);
    const hasBorn = !(radius > 0 || 12 > radius);
    const color = colors[10][Math.floor(Math.random() * colors[10].length)];

    particles.push({
      x: c,
      y: d,
      hasBorn,
      ease: 0.04 + 0.06 * Math.random(),
      bornSpeed: 0.03 + 0.1 * Math.random(),
      alpha: 0,
      maxAlpha: 0.5 + 0.5 * Math.random(),
      radius,
      maxRadius: 12,
      color,
      angle: 0,
      steps: e,
    });
  }
}

function createText(textStr) {
  context.font = "150px Lato, Arial, sans-serif";
  context.fillStyle = textColor.value;
  context.textAlign = "center";
  const spacedText = textStr.split("").join(String.fromCharCode(8202));
  context.fillText(spacedText, 0.5 * canvas.width, canvas.height - 50);

  const imageData = context.getImageData(0, canvas.height - 250, canvas.width, 250);
  nextText[0] = [];

  for (let d = 0; d < imageData.width; d += 4) {
    for (let e = 0; e < imageData.height; e += 2) {
      const f = imageData.data[e * imageData.width * 4 + 4 * d - 1];
      if (f === 255) {
        nextText[0].push({
          x: d,
          y: e + canvas.height - 250,
          orbit: randomBetween(1, 3),
          angle: 0,
        });
      }
    }
  }

  clearWord();
  const seed = nextText[0].length;
  createTextParticles(seed);
  createTextFrame(seed);
}

function createTextParticles(count) {
  text = [];
  for (let b = 0; b < count; b++) {
    const radius = randomBetween(0, 12);
    const hasBorn = !(radius > 0 || 12 > radius);
    text.push({
      x: 0.5 * canvas.width,
      y: canvas.height - 100,
      hasBorn,
      ease: 0.04 + 0.06 * Math.random(),
      bornSpeed: 0.07 + 0.07 * Math.random(),
      alpha: 0,
      maxAlpha: 0.4 + 0.5 * Math.random(),
      radius,
      maxRadius: 8,
      color: "#FFFFFF",
      interactive: false,
    });
  }
}

function createTextFrame(count) {
  nextText[1] = [];
  const d = count / 5.236;
  const e = 1.618 * d;
  for (let f = 0; f < count; f++) {
    let b, c;
    if (f < d) {
      b = canvas.width / 2 - halfX;
      c = canvas.height / 2 - halfY + (2 * f * halfY) / d;
    } else if (f < d + e) {
      c = canvas.height / 2 + halfY;
      b = canvas.width / 2 - halfX + (2 * (f - d) * halfX) / e;
    } else if (f < 2 * d + e) {
      b = canvas.width / 2 + halfX;
      c = canvas.height / 2 - halfY + (2 * (f - d - e) * halfY) / d;
    } else {
      c = canvas.height / 2 - halfY;
      b = canvas.width / 2 - halfX + (2 * (f - 2 * d - e) * halfX) / e;
    }
    nextText[1].push({ x: b, y: c, orbit: randomBetween(15, 25), angle: 0 });
  }
}

function updataTransition() {
  particles.forEach((a, b) => {
    switch (currentLayout.value) {
      case 1:
        shape.x = 0.5 * canvas.width + 100 * -Math.sin(reOrder[b]);
        shape.y = 0.5 * canvas.height + 60 * Math.sin(reOrder[b]) * Math.cos(reOrder[b]);
        break;
      case 2:
        shape.x = 0.5 * canvas.width + 140 * Math.sin(a.steps);
        shape.y = 180 + 140 * Math.cos(a.steps);
        break;
      case 3:
        let g = 0.5 * mainNum - 1;
        const f = (2 * Math.PI * reOrder[b]) / g;
        if (reOrder[b] < particles.slice(0, g).length) {
          shape.x = 0.5 * canvas.width + 80 * Math.cos(f);
          shape.y = 180 + 140 * Math.sin(f);
        } else {
          g = 0.5 * particles.length;
          shape.x = 0.5 * canvas.width + 140 * Math.cos(f);
          shape.y = 180 + 80 * Math.sin(f);
        }
        break;
      case 4:
        shape.x = 0.5 * canvas.width + 90 * (1 - Math.sin(reOrder[b])) * Math.cos(reOrder[b]);
        shape.y = 320 + 140 * (-Math.sin(reOrder[b]) - 1);
        break;
      case 5:
        shape.x = 0.5 * canvas.width + 90 * Math.sin(reOrder[b]) * Math.cos(reOrder[b]);
        shape.y = 320 + 140 * (-Math.sin(reOrder[b]) - 1);
    }
    a.x += 0.08 * (shape.x + 5 * Math.cos(a.angle) - a.x);
    a.y += 0.08 * (shape.y + 5 * Math.sin(a.angle) - a.y);
    a.angle += 0.08;
  });

  const isOpen = 0; // isTextOpen 是 0
  text.forEach((a, b) => {
    if (nextText[isOpen][b]) {
      a.x += 0.15 * (nextText[isOpen][b].x + Math.cos(nextText[isOpen][b].angle + b) * nextText[isOpen][b].orbit - a.x);
      a.y += 0.15 * (nextText[isOpen][b].y + Math.sin(nextText[isOpen][b].angle + b) * nextText[isOpen][b].orbit - a.y);
      nextText[isOpen][b].angle += 0.08;
    }
  });
}

function update() {
  updataTransition();
  particles.forEach(a => {
    a.alpha += 0.05 * (a.maxAlpha - a.alpha);
    if (a.hasBorn) {
      a.radius += (0 - a.radius) * a.bornSpeed;
      if (Math.round(a.radius) === 0) {
        const c = Math.floor((3 * particles.indexOf(a)) / mainNum);
        a.color = colors[randomNum.value[c]][Math.floor(Math.random() * colors[currentLayout.value].length)];
        a.hasBorn = false;
      }
    } else {
      a.radius += (a.maxRadius - a.radius) * a.bornSpeed;
      if (Math.round(a.radius) === a.maxRadius) a.hasBorn = true;
    }
  });

  text.forEach(a => {
    a.alpha += 0.05 * (a.maxAlpha - a.alpha);
    if (a.hasBorn) {
      a.radius += (0 - a.radius) * a.bornSpeed;
      if (Math.round(a.radius) === 0) a.hasBorn = false;
    } else {
      a.radius += (a.maxRadius - a.radius) * a.bornSpeed;
      if (Math.round(a.radius) === a.maxRadius) a.hasBorn = true;
    }
  });
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(a => {
    context.save();
    context.globalAlpha = a.alpha;
    context.fillStyle = a.color;
    context.beginPath();
    context.arc(a.x, a.y, a.radius, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  });
  text.forEach(a => {
    context.save();
    context.globalAlpha = a.alpha;
    context.fillStyle = textColor.value;
    context.beginPath();
    context.arc(a.x, a.y, a.radius, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  });
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function clearWord() {
  context.clearRect(0, canvas.height - 250, canvas.width, 250);
}

function showPic() {
  if (status.value === 0) {
    currentLayout.value++;
    randomOrder(reOrder, 0, mainNum);
    if (currentLayout.value < 3) currentLayout.value = 3;
    if (currentLayout.value > 5) currentLayout.value = 2;
  }
}

// -------------------------------
// 3. 业务逻辑
// -------------------------------

async function fetchData() {
  try {
    const res = await fetch(`${API_BASE}/api/random_draw/cj_json`,{
      method: "GET",
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      }
    });

    if (!res.ok) {
      setText("网络故障？");
      return;
    }
    const data = await res.json();
    allStudents = data.data;
    if (Array.isArray(allStudents)) {
      names = allStudents;
    } else {
      names = Object.keys(allStudents);
      names.forEach(name => {
        const point = allStudents[name][prizeType] + 1;
        pointList.push(point);
        totalPoints += point;
        studentNum += 1;
      });
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    setText("加载失败");
  }
}

function setText(s) {
  if (context) {
    clearWord();
    nextText = [[], []];
    createText(s);
  }
}

function naiveSelect() {
  if (names.length === 0) return "人数不足";
  if (pointList.length > 0) {
    const randPoint = Math.floor(Math.random() * totalPoints);
    let accumPoint = 0;
    for (let i = 0; i < studentNum; i++) {
      accumPoint += pointList[i];
      if (accumPoint > randPoint) return names[i];
    }
  }
  return names[Math.floor(Math.random() * names.length)];
}

function randomSelect() {
  selectedName.value = naiveSelect();
  setText(selectedName.value);

  if (luckyDogs.value.includes(selectedName.value)) {
    // 如果重复，重新选择
    setTimeout(randomSelect, 50);
    return;
  }

  loopCounter++;
  if (loopCounter > ensureLoop && Math.random() < randomControl && isAnimating.value && method === "tradition") {
    stopAnimation();
    luckyDogs.value.push(selectedName.value);
    setTimeout(() => {
      textColor.value = "#1d73c9";
    }, 140);
    setTimeout(restore, 10000);
  }
}

function restore() {
  if (!isAnimating.value) {
    textColor.value = "white";
    setText(eventName);
  }
}

function startAnimation() {
  if (names.length === 0) {
    setText("尚未就绪");
    return;
  }
  if (isAnimating.value) return;

  clearTimeout(timeoutHandle);
  textColor.value = "white";
  randomSelect();
  handle = setInterval(randomSelect, 140);
  isAnimating.value = true;
}

function stopAnimation() {
  clearInterval(handle);
  handle = null;
  isAnimating.value = false;
}

function toggleAnimation() {
  if (method === "click_control") {
    if (isAnimating.value) {
      stopAnimation();
      luckyDogs.value.push(selectedName.value);
      setTimeout(() => {
        textColor.value = "#1d73c9";
      }, 140);
      timeoutHandle = setTimeout(restore, 5000);
    } else {
      startAnimation();
    }
  }
}

// -------------------------------
// 4. Vue 生命周期钩子
// -------------------------------

onMounted(() => {
  fetchData();
  createCanvas();

  // 监听点击事件
  const playZone = document.getElementById("play-zone");
  if (playZone) {
    playZone.addEventListener("click", toggleAnimation);
  }

  // 监听回车键
  const handleKeydown = e => {
    if (e.key === "Enter") {
      location.reload();
    }
  };
  window.addEventListener("keydown", handleKeydown);

  // 清理函数
  onUnmounted(() => {
    if (playZone) {
      playZone.removeEventListener("click", toggleAnimation);
    }
    window.removeEventListener("keydown", handleKeydown);
    if (showLoop) clearInterval(showLoop);
    if (handle) clearInterval(handle);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });
});

// -------------------------------
// 5. 模板变量 (用于 v-model 等)
// -------------------------------

let handle = ref(null);
let timeoutHandle = ref(null);
const randomNum = ref([0, 0, 0]);

function randomNumberArray() {
  const r = randomBetween(0, 180);
  const s = Math.floor(r / 10);
  randomNum.value[0] = Math.floor(s / 10) % 10;
  randomNum.value[1] = s % 10;
  randomNum.value[2] = r % 10;
}

const bg_path = '/images/bg.webp'
import Sider from '../../components/layouts/Sider.vue';
</script>

<template>
  <div style="position: fixed; z-index: 999;"> <Sider class="dark"/> </div>
  <div id="play-zone" :style="{ backgroundImage: `url(${bg_path})` }">
    <div class=".ip-slideshow">
      <div class="ip-slideshow"></div>
    </div>
  </div>
</template>

<style scoped>
.browsehappy {
  margin: 0.2em 0;
  background: #ccc;
  color: #000;
  padding: 0.2em 0;
}
#play-zone {
  background: top center no-repeat;
  background-size: cover;
}
.footer,
.header,
.marketing {
  padding-left: 15px;
  padding-right: 15px;
}
.header {
  border-bottom: 1px solid #e5e5e5;
}
.header h3 {
  margin-top: 0;
  margin-bottom: 0;
  line-height: 40px;
  padding-bottom: 19px;
}
.footer {
  text-align: center;
  position: absolute;
  bottom: 0;
  padding-top: 19px;
  color: #000;
  width: 100%;
}
.container-narrow > hr {
  margin: 30px 0;
}
.jumbotron {
  text-align: center;
  border-bottom: 1px solid #e5e5e5;
}
.jumbotron .btn {
  font-size: 21px;
  padding: 14px 24px;
}
.marketing {
  margin: 40px 0;
}
.marketing p + h4 {
  margin-top: 28px;
}
@media screen and (min-width: 768px) {
  .container {
    max-width: 730px;
  }
  .footer,
  .header,
  .marketing {
    padding-left: 0;
    padding-right: 0;
  }
  .header {
    margin-bottom: 30px;
  }
  .jumbotron {
    border-bottom: 0;
  }
}
.ip-slideshow,
.ip-slideshow-wrapper {
  position: relative;
  width: 100%;
  height: 700px;
  overflow: hidden;
}
.ip-nav-left,
.ip-nav-right {
  width: 80px;
  height: 80px;
  top: 50%;
  margin-top: -40px;
  z-index: 100;
  position: absolute;
  border: 6px solid #fff;
  border-radius: 50%;
  transition: all 0.3s;
}
.ip-nav-left {
  left: 20px;
  -webkit-transform: translateX(-100%);
  -ms-transform: translateX(-100%);
  transform: translateX(-100%);
  opacity: 0;
}
.ip-nav-right {
  right: 20px;
  -webkit-transform: translateX(100%);
  -ms-transform: translateX(100%);
  transform: translateX(100%);
  opacity: 0;
}
.ip-nav-left:hover,
.ip-nav-right:hover {
  background-color: orange;
  cursor: pointer;
}
.ip-nav-left:after,
.ip-nav-right:after {
  width: 100%;
  height: 100%;
  color: #fff;
  font-family: Lato, sans-serif;
  font-size: 70px;
  line-height: 62px;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
}
.ip-nav-left:after {
  content: "<";
}
.ip-nav-right:after {
  content: ">";
}
@-webkit-keyframes mymove {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  10% {
    -webkit-transform: rotate(30deg);
    transform: rotate(30deg);
  }
  20% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  30% {
    -webkit-transform: rotate(-30deg);
    transform: rotate(-30deg);
  }
  40% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  47% {
    -webkit-transform: rotate(20deg);
    transform: rotate(20deg);
  }
  54% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  58% {
    -webkit-transform: rotate(-10deg);
    transform: rotate(-10deg);
  }
  100%,
  62% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
}
@keyframes mymove {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  10% {
    -webkit-transform: rotate(30deg);
    transform: rotate(30deg);
  }
  20% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  30% {
    -webkit-transform: rotate(-30deg);
    transform: rotate(-30deg);
  }
  40% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  47% {
    -webkit-transform: rotate(20deg);
    transform: rotate(20deg);
  }
  54% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  58% {
    -webkit-transform: rotate(-10deg);
    transform: rotate(-10deg);
  }
  100%,
  62% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
}
.logo {
  width: 130px;
  height: 130px;
  position: absolute;
  left: 30px;
  bottom: 30px;
}
.logo1 {
  width: 130px;
  height: 130px;
  position: absolute;
  right: 30px;
  bottom: 30px;
}

</style>
