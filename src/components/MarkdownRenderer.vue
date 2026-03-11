<template>
  <div class="markdown-body">
    <div class="math-markdown-content">
      <MarkdownRenderer :content="props.content" :parse-options="parseOptions" />
    </div>
  </div>
</template>

<script setup>
import MarkdownRenderer from "markstream-vue";
import "markstream-vue/index.css";
import "katex/dist/katex.min.css";
import "../styles/github-markdown.css";
import DOMPurify from "dompurify";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});

const parseOptions = {
  preTransformTokens: (tokens) => {
    return tokens.map((token) => {
      if (token.type === "html_block") {
        token.content = DOMPurify.sanitize(token.content || "", {
          ADD_TAGS: ["iframe"],
          ALLOWED_ATTR: ["href", "src", "style", "class", "id"],
          ADD_ATTR: ["sandbox"],
          //ALLOWED_URI_REGEXP: /^(?:https?:\/\/|\/\/)(?:[\w-]+\.)?(?:bilibili\.com|(?:www\.)?youtube(?:-nocookie)?\.com)(?::[0-9]+)?(?:\/.*)?$/i,
        });
      } else if (token.type === "inline" && token.children) {
        token.children = token.children.map((child) => {
          if (child.type === "html_inline" || child.type === "html_block") {
            return {
              ...child,
              content: DOMPurify.sanitize(child.content || "", {
                ADD_TAGS: ["iframe"],
                ALLOWED_ATTR: ["href", "src", "style", "class", "id"],
                ADD_ATTR: ["sandbox"],
                //ALLOWED_URI_REGEXP: /^(?:https?:\/\/|\/\/)(?:[\w-]+\.)?(?:bilibili\.com|(?:www\.)?youtube(?:-nocookie)?\.com)(?::[0-9]+)?(?:\/.*)?$/i,
              }),
            };
          }
          return child;
        });
      }
      return token;
    });
  },
};
</script>

<style scoped>
.markdown-body {
  background-color: transparent;
}

:deep(.node-slot:first-child *) {
  margin-top: 0;
}

:deep(.heading-node) {
  font-family: "KaTeX_Main", serif;
}

:deep(.admonition) {
  background: transparent;
}

.math-markdown-content :deep(.katex-error) {
  color: #cc0000;
  background: #ffeeee;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.math-markdown-content :deep(.katex-error-block) {
  color: #cc0000;
  background: #ffeeee;
  padding: 10px;
  border-radius: 4px;
  margin: 1em 0;
  font-family: monospace;
  text-align: center;
}
</style>
