import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";
import BlogPostEditor from "@/components/blog-center/BlogPostEditor.vue";

const passthrough = (name: string) => defineComponent({ name, template: "<div><slot /></div>" });
const stub = (name: string) => defineComponent({ name, template: "<div />" });

const stubs = {
  MarkdownEditor: stub("MarkdownEditor"),
  AutoCompleteTagInput: stub("AutoCompleteTagInput"),
  QuotePostDialog: stub("QuotePostDialog"),
  Button: stub("Button"),
  "el-icon": passthrough("ElIcon"),
  Close: stub("Close"),
};

const mountUnderParent = (parentScopeId: string) => {
  const Host = defineComponent({
    __scopeId: parentScopeId,
    render: () => h(BlogPostEditor, { visible: true }),
  } as never);

  return mount(Host as never, { global: { stubs } });
};

describe("BlogPostEditor 根节点结构", () => {
  it("保持单根，父组件的 scopeId 才会落到根元素上", () => {
    const scopeId = "data-v-parent-scope";
    const wrapper = mountUnderParent(scopeId);

    expect((wrapper.element as Element).hasAttribute(scopeId)).toBe(true);
  });
});
