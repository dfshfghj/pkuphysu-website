<template>
  <div class="group rounded-sm my-2 py-3" :key="post.id">
    <CollapsibleDiv :max-height="500">
      <div class="text-sm pt-4 pb-2 mb-2 border-b border-(--c-border) unselectable">
        <div class="flex">
          <div class="flex-1">
            <span> {{ post.username }} </span>
            <code> #{{ post.id }} </code>
            <el-icon
              :size="16"
              class="float-right text-center opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
              @click.stop="handleCopy"
            >
              <CopyDocument />
            </el-icon>
            <div>
              <div class="float-right mr-4">
                {{ followNum }}
                <el-icon :size="12">
                  <StarFilled v-if="isFollowed" />
                  <Star v-else />
                </el-icon>
              </div>
              <div class="float-right mr-4">
                {{ likeNum }}
                <el-icon :size="12">
                  <IconRiHeartFill v-if="isLiked" />
                  <IconRiHeartLine v-else />
                </el-icon>
              </div>
              <div class="float-right mr-4" v-if="post.reply">
                {{ post.reply }}
                <el-icon :size="12">
                  <ChatLineRound />
                </el-icon>
              </div>
              <span>
                {{ formatTime(post.timestamp).relativeTime }}
                {{ formatTime(post.timestamp).formattedTime }}
              </span>
            </div>
          </div>
        </div>
        <div class="mt-2.5 mr-1">
          <span class="text-sm bg-(--gray-2) px-3 py-1 mr-3 mb-2 rounded-full" v-for="tag in post.tags" :key="tag">
            {{ tag }}
          </span>
        </div>
      </div>

      <MarkdownRenderer :dark-mode="darkMode" :content="post.text" class="cursor-pointer" @click="handleClick" />
      <img
        v-if="post.type == 'image' && post.media_ids == ''"
        :src="`/api/dev/media/image?pid=${post.id}`"
        class="rounded-lg max-w-100 mx-auto my-4 object-contain"
        @click="handleClick"
      />
      <div v-else-if="post.type == 'image'" @click="handleClick">
        <img
          v-for="media_id in post.media_ids.split(',')"
          :key="media_id"
          :src="`/api/dev/media/image?id=${media_id}`"
          class="rounded-lg max-w-100 mx-auto my-4 object-contain"
        />
      </div>
    </CollapsibleDiv>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Star, StarFilled, ChatLineRound, CopyDocument } from "@element-plus/icons-vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import { formatTime } from "@/utils";
import { toast } from "vue-sonner";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["card-click"]);

const isLiked = ref(props.post.is_like);
const isFollowed = ref(props.post.is_follow);
const likeNum = ref(props.post.likenum);
const followNum = ref(props.post.follownum);

const handleClick = () => {
  emit("card-click");
};

const handleCopy = async () => {
  try {
    const text = props.post.text;
    if (!navigator.clipboard) {
      return new Promise((resolve) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.width = "2em";
        textarea.style.height = "2em";
        textarea.style.padding = "0";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        textarea.style.boxShadow = "none";
        textarea.style.background = "transparent";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        try {
          const successful = document.execCommand("copy");
          toast.success("复制成功");
          resolve(successful);
        } catch (err) {
          toast.warning("当前浏览器环境不支持复制");
          console.error("Fallback copy failed", err);
          resolve(false);
        } finally {
          document.body.removeChild(textarea);
        }
      });
    }
    await navigator.clipboard.writeText(text);
    toast.success("复制成功");
  } catch {
    toast.error("复制失败");
  }
};
</script>
