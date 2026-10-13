import { describe, expect, it } from "vitest";
import { prepareVditorPreview } from "@/utils/vditor-preview";

describe("prepareVditorPreview", () => {
  it("preserves the language and source while removing server tokens and line numbers", () => {
    const html =
      '<pre><code class="language-js highlight-chroma"><span class="highlight-ln">1</span><span class="highlight-kr">const</span> x = &quot;&lt;tag&gt;&quot;;\n</code></pre>';
    const doc = new DOMParser().parseFromString(prepareVditorPreview(html), "text/html");
    const code = doc.querySelector("code")!;
    expect(code.className).toBe("language-js");
    expect(code.textContent).toBe('const x = "<tag>";\n');
    expect(code.children).toHaveLength(0);
  });
  it("preserves unrelated HTML around server-highlighted code", () => {
    const html =
      '<style>p { color: red; }</style><p>正文</p><pre><code class="language-js highlight-chroma">42\n</code></pre>';
    expect(prepareVditorPreview(html)).toContain("<style>p { color: red; }</style><p>正文</p>");
  });
  it("leaves inline code and special renderers intact", () => {
    const html = '<p><code>inline</code></p><pre><code class="language-mermaid">graph TD; A--&gt;B</code></pre>';
    expect(prepareVditorPreview(html)).toBe(html);
  });
});
