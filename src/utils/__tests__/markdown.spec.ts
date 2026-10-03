import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/utils/markdown";

describe("renderMarkdown", () => {
  it("渲染基础 markdown", () => {
    expect(renderMarkdown("# 标题")).toContain("<h1>标题</h1>");
    expect(renderMarkdown("**加粗** 与 `代码`")).toContain("<strong>加粗</strong>");
  });

  it("把待办清单渲染成复选框", () => {
    const html = renderMarkdown("- [ ] 未完成\n- [x] 已完成");
    expect(html).toContain('type="checkbox"');
  });

  it("渲染行内公式", () => {
    expect(renderMarkdown("公式 $x^2$ 结束")).toContain("katex");
  });

  it("剔除脚本等危险内容", () => {
    const html = renderMarkdown('<script>alert(1)</script><p onclick="x()">正文</p>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("正文");
  });
});
