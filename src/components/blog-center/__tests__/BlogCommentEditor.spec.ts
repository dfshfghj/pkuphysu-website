import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
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

const QuotePostDialogStub = defineComponent({
  name: "QuotePostDialog",
  props: { visible: { type: Boolean, default: false } },
  emits: ["update:visible", "select"],
  template: '<button v-if="visible" class="quote-pick" @click="$emit(\'select\', 45)">pick</button>',
});

const mountEditor = () =>
  mount(BlogCommentEditor, {
    props: { postId: 7 },
    global: { stubs: { QuotePostDialog: QuotePostDialogStub } },
  });

describe("BlogCommentEditor 引用帖子", () => {
  beforeEach(() => {
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

    await wrapper.findAll("button").find((btn) => btn.text() === "引用")!.trigger("click");
    await flushPromises();
    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: "MarkdownEditor" }).props("modelValue")).toBe("\n\n[#45](/45)\n\n");
  });
});
