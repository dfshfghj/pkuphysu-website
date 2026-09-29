<template>
  <div class="group rounded-sm my-2 py-3 comment-card bg-card md:bg-transparent" :key="comment.cid">
    <CollapsibleDiv :max-height="300" @click="onClick">
      <div class="text-sm pt-4 pb-2 mb-2 border-b border-(--c-border) unselectable whitespace-pre-line">
        <div class="flex">
          <div class="flex-1">
            <span> {{ comment.username }} </span>
            <el-icon
              :size="16"
              class="float-right text-center opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity"
              @click="handleCopy"
            >
              <CopyDocument />
            </el-icon>
            <div>
              <span>
                {{ formatTime(comment.timestamp).relativeTime }}
                {{ formatTime(comment.timestamp).formattedTime }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <span v-if="comment.quote" class="text-sm text-(--c-secondary)! inline-block max-w-full overflow-hidden whitespace-nowrap text-ellipsis">
        {{ `@${comment.quote.name_tag}: ${comment.quote.text}` }}
      </span>
      <MarkdownRenderer :content="comment.text" />
      <div v-if="comment.media_ids">
        <img v-for="media_id in comment.media_ids.split(',')" :key="media_id" :src="`/api/dev/media/image?id=${media_id}`" class="rounded-lg max-w-100 mx-auto my-4 object-contain"></img>
      </div>
    </CollapsibleDiv>
  </div>
</template>

<script setup lang="ts">
import { CopyDocument } from "@element-plus/icons-vue";
import { formatTime } from "@/utils";
import { requestApi } from "@/api/api";
import CollapsibleDiv from "@/components/CollapsibleDiv.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import { useForumStore } from "@/stores/forum";
import { toast } from "vue-sonner";

const forumStore = useForumStore();

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});


const handleCopy = async () => {
  try {
    const text = props.comment.text;
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

const onClick = () => {
  // 不再需要 emit，直接通过 props 传递事件
};
</script>
