<template>
    <el-scrollbar>
        <div class="container">
            <div class="main-panel">
                <h2> {{ data.title }} </h2>
                <div class="author-info">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div class="card-info">
                            <el-avatar :size="40" :src="`${API_BASE}/api/avatars/${data.author}`" />
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span> {{ data.author }} </span>
                            <span style="white-space: nowrap; font-size: 14px;"> {{
                                formatTime(data.timestamp).relativeTime
                            }}
                            </span>
                        </div>
                    </div>
                </div>
                <MarkdownRenderer_V2 :content="data.content" :dark-mode="isDark" v-if="data.content" />
                <el-divider />
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; margin: 0 50px 0 50px;">
                    <span> {{ data.likenum }} </span>
                    &nbsp;
                    <el-icon>
                        <Star />
                    </el-icon>
                    </div>
                    
                    <div style="display: flex; align-items: center; margin: 0 50px 0 50px;"
                    @click="displayReply = !displayReply;">
                    <span> {{ data.reply }} </span>
                    &nbsp;
                    <el-icon>
                        <ChatRound />
                    </el-icon>
                    </div>
                </div>
            </div>
            <div class="reply-panel acrylic" v-if="displayReply">
                <h3>回复</h3>
            </div>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { ChatRound, Star } from '@element-plus/icons-vue';
import MarkdownRenderer_V2 from '../components/MarkdownRenderer-v2.vue';
import { isDark } from "../composables/theme";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const data = ref({});

const displayReply = ref(false);

const props = defineProps({
    id: {
        type: String,
        required: true
    }
});

const fetchData = async () => {
    try {
        const res = await fetch(`${API_BASE}/api/blogs/articles/${props.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const _data = await res.json();
        data.value = _data.data;
    } catch (err) {
        error.value = "无法加载数据，请稍后再试。";
        console.error("Fetch posts failed:", err);
    }
};

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedTime = `${month}-${day} ${hours}:${minutes}`;

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    let relativeTime;

    if (diffInSeconds < 60) {
        relativeTime = '刚刚';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        relativeTime = `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        relativeTime = `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        relativeTime = `${days}天前`;
    } else if (diffInSeconds < 604800) {
        const weeks = Math.floor(diffInSeconds / 604800);
        relativeTime = `${weeks}周前`;
    } else {
        const months = Math.floor(diffInSeconds / 2592000);
        relativeTime = `${months}月前`;
    }

    return {
        formattedTime: formattedTime,
        relativeTime: relativeTime
    };
}

onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.container {
    display: flex;
    justify-content: center;
}

.reply-panel {
    min-width: 400px;
    position: fixed;
    right: 0;
    padding-left: 20px;
    padding-right: 10px;
    border: 1px solid var(--c-border);
    border-radius: 0 0 0 10px;
}

.main-panel {
    padding: 0 50px 0 50px;
    border: 1px solid var(--c-border);
    border-radius: 5px;
    margin: 50px 500px 100px 20px;
    width: calc(100vw - 500px);
    min-width: 600px;
    background: var(--c-card);
}

.card-info {
    display: flex;
    margin-right: 20px;
}

@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }

    .main-panel {
        padding: 20px;
        margin: 0px;
        width: auto;
        min-width: 0;
        background: transparent;
    }

    .reply-panel {
        min-width: 0;
        position: static;
        right: 0;
        padding-left: 20px;
        padding-right: 20px;
        border: 1px solid var(--c-border);
        border-radius: 0 0 0 10px;
    }
}
</style>