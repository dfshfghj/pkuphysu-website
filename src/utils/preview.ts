import katex from "katex";

const DROP_SELECTOR =
  "script, style, iframe, object, embed, img, video, audio, canvas, svg, form, input, button, select, textarea, link, meta, template";

const FLATTEN_SELECTOR =
  "p, div, section, article, aside, header, footer, main, nav, li, ul, ol, dl, dt, dd, blockquote, figure, figcaption, h1, h2, h3, h4, h5, h6, pre, table, thead, tbody, tfoot, tr, td, th, hr";

const KEEP_TAGS = new Set([
  "SPAN",
  "A",
  "CODE",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "DEL",
  "INS",
  "MARK",
  "SUB",
  "SUP",
  "BR",
  "KBD",
  "SAMP",
  "VAR",
  "ABBR",
  "SMALL",
  "Q",
  "TIME",
]);

// 评论原文是服务端渲染的 HTML（含 markdown、公式、甚至内联 HTML），
// 预览必须压成内联流：块级标签拍平、非文本元素丢弃、公式转成 KaTeX 内联，
// 只保留 KaTeX 自身需要的 style 属性，避免任意样式撑破卡片布局。
export const buildCommentPreview = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  body.querySelectorAll(DROP_SELECTOR).forEach((el) => el.remove());

  body.querySelectorAll(".language-math").forEach((el) => {
    const latex = (el.textContent ?? "").trim();
    if (/\\\\|\n/.test(latex)) {
      el.replaceWith("[公式]");
      return;
    }
    const holder = doc.createElement("span");
    try {
      // 写入的是 KaTeX 生成的结果（默认 trust=false，不解析 \html* 之类的原始 HTML）
      holder.innerHTML = katex.renderToString(latex, { displayMode: false, throwOnError: true, output: "html" });
      holder.querySelectorAll(".katex-mathml").forEach((el) => el.remove());
    } catch {
      el.replaceWith("[公式]");
      return;
    }
    el.replaceWith(holder);
  });

  [...body.querySelectorAll(FLATTEN_SELECTOR)].forEach((el) => {
    el.replaceWith(...el.childNodes, " ");
  });
  body.querySelectorAll("br").forEach((el) => el.replaceWith(" "));

  [...body.querySelectorAll("*")].forEach((el) => {
    if (!KEEP_TAGS.has(el.tagName)) {
      el.replaceWith(...el.childNodes);
      return;
    }
    const inKatex = !!el.closest(".katex");
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const keep =
        name === "class" ||
        (name === "href" && /^(https?:|\/|#|mailto:)/i.test(attr.value)) ||
        (name === "style" && inKatex);
      if (!keep) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return (body.innerHTML || "").replace(/\s+/g, " ").trim();
};

interface RawPreviewComment {
  cid: number;
  username?: string;
  text?: string;
  quote?: { username?: string } | null;
}

export interface PreviewComment {
  cid: number;
  username: string;
  mention: string;
  html: string;
}

export const buildPreviewComments = (comments: RawPreviewComment[] | undefined, limit = 2): PreviewComment[] =>
  (comments ?? [])
    .map((comment) => ({
      cid: comment.cid,
      username: comment.username ?? "",
      mention: comment.quote?.username ? `@${comment.quote.username}` : "",
      html: buildCommentPreview(comment.text ?? ""),
    }))
    .filter((comment) => comment.html.length > 0 || comment.mention)
    .slice(0, limit);
