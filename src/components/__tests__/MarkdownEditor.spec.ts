import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import { isDark } from "@/composables/theme";

const mocks = vi.hoisted(() => ({ options: null as any }));

vi.mock("vditor", () => ({
  default: class {
    static preview = vi.fn(async (element: HTMLElement) => {
      element.classList.add("vditor-reset");
      element.innerHTML = '<pre><code class="hljs">preview</code></pre>';
    });
    setValue = vi.fn();
    destroy = vi.fn();
    setTheme = vi.fn();
    constructor(element: HTMLElement, options: { after: () => void }) {
      mocks.options = options;
      // IR uses a pre as the editable surface, alongside nested code previews.
      element.innerHTML = `<div class="vditor-ir"><pre class="vditor-reset"><div class="vditor-ir__node"><pre class="vditor-ir__marker--pre"><code>source</code></pre><div class="vditor-ir__preview"><pre><code class="hljs">preview</code></pre></div></div></pre></div><div class="vditor-wysiwyg"><pre class="vditor-reset"></pre></div><div class="vditor-preview"><div class="vditor-reset"></div></div>`;
      queueMicrotask(options.after);
    }
  },
}));

describe("MarkdownEditor style isolation", () => {
  it("disables Vditor draft persistence for the tutorial without changing normal editors", async () => {
    const practice = mount(MarkdownEditor, { props: { cacheEnabled: false } });
    await flushPromises();
    expect(mocks.options.cache.enable).toBe(false);
    expect(mocks.options.upload.handler).toBeUndefined();
    practice.unmount();
    const normal = mount(MarkdownEditor);
    await flushPromises();
    expect(mocks.options.cache.enable).toBe(true);
    expect(mocks.options.upload.handler).toBeUndefined();
    normal.unmount();
  });
  it("keeps standalone previews isolated from published layout resets", async () => {
    const wrapper = mount(MarkdownEditor, { props: { preview: true, modelValue: "```js\n42\n```" } });
    await flushPromises();
    expect(wrapper.find(".vditor-reset .hljs").exists()).toBe(true);
    expect(wrapper.findAll(".markdown-body")).toHaveLength(0);
    wrapper.unmount();
  });

  it("applies the explicit editor theme independently of the system theme", async () => {
    const wrapper = mount(MarkdownEditor, { props: { darkMode: true } });
    await flushPromises();
    expect(wrapper.classes()).toContain("markdown-theme-dark");
    expect(wrapper.attributes("data-theme")).toBe("dark");
    await wrapper.setProps({ darkMode: false });
    expect(wrapper.classes()).not.toContain("markdown-theme-dark");
    expect(wrapper.attributes("data-theme")).toBe("light");
    wrapper.unmount();
  });
  it("follows the application theme while preserving an explicit light override", async () => {
    const previous = isDark.value;
    const inherited = mount(MarkdownEditor);
    const explicit = mount(MarkdownEditor, { props: { darkMode: false } });
    try {
      await flushPromises();
      isDark.value = false;
      await flushPromises();
      expect(inherited.attributes("data-theme")).toBe("light");
      isDark.value = true;
      await flushPromises();
      expect(inherited.attributes("data-theme")).toBe("dark");
      expect(explicit.attributes("data-theme")).toBe("light");
    } finally {
      inherited.unmount();
      explicit.unmount();
      isDark.value = previous;
    }
  });

  it.each(["ir", "wysiwyg", "sv"] as const)(
    "keeps published Markdown resets off Vditor's %s surfaces",
    async (mode) => {
      const wrapper = mount(MarkdownEditor, { props: { mode, modelValue: "```js\nconst answer = 42;\n```" } });
      await flushPromises();

      expect(wrapper.findAll(".vditor-reset")).toHaveLength(3);
      expect(wrapper.find(".vditor-ir__preview .hljs").exists()).toBe(true);
      expect(wrapper.findAll(".markdown-body")).toHaveLength(0);
      wrapper.unmount();
    }
  );
});
