import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BlogCommentEditor from "@/components/blog-center/BlogCommentEditor.vue";

const mocks = vi.hoisted(() => ({
  insertValue: vi.fn(),
  getValue: vi.fn(() => ""),
  exposeVditor: true,
}));

vi.mock("@/components/MarkdownEditor.vue", async () => {
  const { defineComponent } = await import("vue");
  return {
    default: defineComponent({
      name: "MarkdownEditor",
      props: { modelValue: { type: String, default: "" } },
      emits: ["update:modelValue"],
      setup(_, { expose }) {
        if (mocks.exposeVditor) {
          expose({ vditor: { insertValue: mocks.insertValue, getValue: mocks.getValue } });
        }
      },
      template: "<div />",
    }),
  };
});

vi.mock("vue-sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const makeQuoteStub = (selection: { source: string; id: number }) =>
  defineComponent({
    name: "QuotePostDialog",
    props: { visible: { type: Boolean, default: false } },
    emits: ["update:visible", "select"],
    setup(props, { emit }) {
      return () =>
        props.visible ? h("button", { class: "quote-pick", onClick: () => emit("select", selection) }, "pick") : null;
    },
  });

const mountEditor = (selection = { source: "forum", id: 45 }) =>
  mount(BlogCommentEditor, {
    props: { postId: 7 },
    global: { stubs: { QuotePostDialog: makeQuoteStub(selection) } },
  });

describe("BlogCommentEditor 引用帖子", () => {
  beforeEach(() => {
    mocks.exposeVditor = true;
    mocks.insertValue.mockReset();
    mocks.getValue.mockReset();
    mocks.getValue.mockReturnValue("");
  });

  it("展开评论框后点「引用」能插入引用标记", async () => {
    const wrapper = mountEditor();

    expect(wrapper.find(".quote-pick").exists()).toBe(false);
    await wrapper.find(".unselectable").trigger("click");

    const quoteButton = wrapper.findAll("button").find((btn) => btn.text() === "引用");
    expect(quoteButton).toBeTruthy();

    await quoteButton!.trigger("click");
    await flushPromises();

    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).toHaveBeenCalledWith("\n\n[#45](/45)\n\n");
  });

  it("编辑器实例还没就绪时退化成直接追加文本", async () => {
    mocks.exposeVditor = false;
    const wrapper = mountEditor();
    await wrapper.find(".unselectable").trigger("click");

    await wrapper
      .findAll("button")
      .find((btn) => btn.text() === "引用")!
      .trigger("click");
    await flushPromises();
    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: "MarkdownEditor" }).props("modelValue")).toBe("\n\n[#45](/45)\n\n");
  });

  it("选中树洞帖子时插入树洞引用标记", async () => {
    const wrapper = mountEditor({ source: "treehole", id: 45 });
    await wrapper.find(".unselectable").trigger("click");

    await wrapper
      .findAll("button")
      .find((btn) => btn.text() === "引用")!
      .trigger("click");
    await flushPromises();
    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).toHaveBeenCalledWith("\n\n[#45](/treehole/45)\n\n");
  });
});
