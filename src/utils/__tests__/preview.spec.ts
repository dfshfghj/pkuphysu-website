import { describe, expect, it } from "vitest";
import { buildCommentPreview, buildPreviewComments } from "@/utils/preview";

describe("buildCommentPreview", () => {
  it("拍平块级标签，只留内联内容", () => {
    const html = buildCommentPreview("<p>第一段</p><div>第二段</div>");
    expect(html).not.toContain("<p>");
    expect(html).not.toContain("<div>");
    expect(html).toContain("第一段");
    expect(html).toContain("第二段");
  });

  it("内联公式用 KaTeX 渲染，不残留原始 LaTeX", () => {
    const html = buildCommentPreview('<p>设 <span class="language-math">\\alpha^2</span> 为系数</p>');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain("\\alpha");
  });

  it("单行块级公式压成内联", () => {
    const html = buildCommentPreview('<div class="language-math">x^2 + 1</div>');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain("katex-display");
  });

  it("多行公式退化为占位符", () => {
    const html = buildCommentPreview('<div class="language-math">\\begin{cases} a \\\\ b \\end{cases}</div>');
    expect(html).toBe("[公式]");
  });

  it("丢弃图片与表格结构，保留其中文本", () => {
    const html = buildCommentPreview('<p>看图 <img src="/x.png"></p><table><tr><td>表格文本</td></tr></table>');
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<table");
    expect(html).toContain("看图");
    expect(html).toContain("表格文本");
  });

  it("移除评论自带的危险样式与脚本，保留 KaTeX 的样式", () => {
    const html = buildCommentPreview('<p><span style="position:fixed;top:0">x</span></p><script>alert(1)</script>');
    expect(html).not.toContain("position:fixed");
    expect(html).not.toContain("script");
    expect(html).toContain("x");

    const mathHtml = buildCommentPreview('<span class="language-math">\\frac{1}{2}</span>');
    expect(mathHtml).toContain("style=");
  });
});

describe("buildPreviewComments", () => {
  it("引用他人时带上 @用户名", () => {
    const [comment] = buildPreviewComments([
      { cid: 1, username: "Bob", text: "<p>你说得对</p>", quote: { username: "Alice" } },
    ]);
    expect(comment.mention).toBe("@Alice");
    expect(comment.html).toContain("你说得对");
  });

  it("没有引用时不带 @", () => {
    const [comment] = buildPreviewComments([{ cid: 1, username: "Bob", text: "<p>你好</p>" }]);
    expect(comment.mention).toBe("");
  });

  it("保留只有引用没有正文的评论，丢弃纯图片评论，并按 limit 截取", () => {
    const result = buildPreviewComments(
      [
        { cid: 1, username: "A", text: "", quote: { username: "X" } },
        { cid: 2, username: "B", text: '<p><img src="/x.png"></p>' },
        { cid: 3, username: "C", text: "<p>第三条</p>" },
        { cid: 4, username: "D", text: "<p>第四条</p>" },
      ],
      2
    );
    expect(result.map((comment) => comment.cid)).toEqual([1, 3]);
  });
});
