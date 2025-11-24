<template>
  <el-input v-model="title" placeholder="标题" size="large"></el-input>
  <MarkdownEditor v-model="content" :dark-mode="isDark" :height="500" />
  <el-button @click="submitArticle"> 发布 </el-button>
</template>

<script setup>
import { requestApi } from "../api/api";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import { isDark } from "../composables/theme";

const router = useRouter();
const content = ref("");
const title = ref("");

const submitArticle = async () => {
  console.log(content.value);
  try {
    const res = await requestApi("/api/blogs/submit/article", {
      method: "POST",
      body: JSON.stringify({
        title: title.value,
        content: content.value,
        tag: "",
      }),
    });
    if (!res.ok) throw new Error("上传失败");
    content.value = "";
    router.push("/chat/articles");
  } catch (err) {
    ElMessage.error(err.message || "网络错误");
    console.error(err);
  }
};
</script>

<style scoped></style>
