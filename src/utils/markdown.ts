import MarkdownIt from "markdown-it";
import { tasklist } from "@mdit/plugin-tasklist";
import { katex } from "@mdit/plugin-katex";
import DOMPurify from "dompurify";

const md = new MarkdownIt({ html: true, linkify: true }).use(tasklist).use(katex);

// 目前只用于渲染仓库自带的文档，仍然过一遍 DOMPurify，避免以后内容来源变化时留下注入面
export const renderMarkdown = (source: string) => DOMPurify.sanitize(md.render(source));
