<template>
<el-input v-model="title" placeholder="标题" size="large"></el-input>
<MarkdownEditor v-model="content" :dark-mode="isDark" :height="500"/>
<el-button @click="submitArticle"> 发布 </el-button>
</template>

<script setup> 
import MarkdownEditor from '../components/MarkdownEditor.vue';
import { isDark } from "../composables/theme";
import { useUserStore } from "../stores/user";

const router = useRouter();
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const userStore = useUserStore();
const content = ref('');
const title = ref('');

const submitArticle = async () => {
  console.log(content.value);
  try {
    const res = await fetch(`${API_BASE}/api/blogs/submit/article`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify({
        title: title.value,
        content: content.value,
        tag: "",
      }),
    });
    if (!res.ok) throw new Error("上传失败");
    content.value = '';
    router.push("/chat/articles");
  } catch (err) {
    ElMessage.error(err.message || "网络错误");
    console.error(err);
  }
};
</script>

<style scoped>
</style>