import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlogCommentEditor from "@/components/blog-center/BlogCommentEditor.vue";

const mocks = vi.hoisted(() => ({
  insertValue: vi.fn(),
  getValue: vi.fn(() => ""),
  exposeVditor: true,
  requestApi: vi.fn(),
  forumStore: { session: 0, refreshPost: vi.fn() },
}));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));
vi.mock("@/stores/forum", () => ({ useForumStore: () => mocks.forumStore }));
enableAutoUnmount(afterEach);

vi.mock("@/components/MarkdownEditor.vue", async () => {
  const { defineComponent } = await import("vue");
  return {
    default: defineComponent({
      name: "MarkdownEditor",
      props: { modelValue: { type: String, default: "" }, extraToolbar: { type: Array, default: () => [] } },
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

const openQuotePicker = async (wrapper: ReturnType<typeof mountEditor>) => {
  const editor = wrapper.findComponent({ name: "MarkdownEditor" });
  const item = (editor.props("extraToolbar") as Array<{ name?: string; click?: () => void }>).find(
    (entry) => entry?.name === "quote-post"
  );
  item!.click!();
  await flushPromises();
};

describe("BlogCommentEditor 引用帖子", () => {
  beforeEach(() => {
    mocks.exposeVditor = true;
    mocks.insertValue.mockReset();
    mocks.getValue.mockReset();
    mocks.getValue.mockReturnValue("");
    mocks.requestApi.mockReset();
    mocks.forumStore.refreshPost.mockReset();
    mocks.forumStore.session = 0;
  });

  it("展开评论框后通过 toolbar 引用能插入引用标记", async () => {
    const wrapper = mountEditor();

    expect(wrapper.find(".quote-pick").exists()).toBe(false);
    await wrapper.find(".unselectable").trigger("click");

    await openQuotePicker(wrapper);

    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).toHaveBeenCalledWith("\n\n[#45](/45)\n\n");
  });

  it("编辑器实例还没就绪时退化成直接追加文本", async () => {
    mocks.exposeVditor = false;
    const wrapper = mountEditor();
    await wrapper.find(".unselectable").trigger("click");

    await openQuotePicker(wrapper);
    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: "MarkdownEditor" }).props("modelValue")).toBe("\n\n[#45](/45)\n\n");
  });

  it("选中树洞帖子时插入树洞引用标记", async () => {
    const wrapper = mountEditor({ source: "treehole", id: 45 });
    await wrapper.find(".unselectable").trigger("click");

    await openQuotePicker(wrapper);
    await wrapper.find(".quote-pick").trigger("click");
    await flushPromises();

    expect(mocks.insertValue).toHaveBeenCalledWith("\n\n[#45](/treehole/45)\n\n");
  });

  it("全屏按钮在编辑器和全屏之间切换", async () => {
    const wrapper = mountEditor();
    await wrapper.find(".unselectable").trigger("click");

    const editor = () => wrapper.find("[data-comment-editor]");
    expect(editor().classes()).not.toContain("is-fullscreen");

    await editor().find(".fullscreen-toggle button").trigger("click");
    expect(editor().classes()).toContain("is-fullscreen");

    await editor().find(".fullscreen-toggle button").trigger("click");
    expect(editor().classes()).not.toContain("is-fullscreen");
  });

  it("refreshes the submitted post even when the editor unmounts before POST completes", async () => {
    let resolvePost!: (response: { ok: boolean }) => void;
    mocks.requestApi.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );
    mocks.getValue.mockReturnValue("new comment");
    const wrapper = mountEditor();
    await wrapper.find(".unselectable").trigger("click");
    const send = wrapper.findAll("button").find((button) => button.text() === "发送")!;
    await send.trigger("click");
    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/comments", {
      method: "POST",
      body: JSON.stringify({ text: "new comment", pid: 7, quote: null }),
    });
    await wrapper.setProps({ postId: 8 });
    wrapper.unmount();
    resolvePost({ ok: true });
    await flushPromises();
    expect(mocks.forumStore.refreshPost).toHaveBeenCalledWith(7);
    expect(mocks.forumStore.refreshPost).toHaveBeenCalledTimes(1);
  });

  it("does not refresh the next account after an old submission completes", async () => {
    let resolvePost!: (response: { ok: boolean }) => void;
    mocks.requestApi.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );
    mocks.getValue.mockReturnValue("new comment");
    const wrapper = mountEditor();
    await wrapper.find(".unselectable").trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "发送")!
      .trigger("click");
    mocks.forumStore.session++;
    resolvePost({ ok: true });
    await flushPromises();
    expect(mocks.forumStore.refreshPost).not.toHaveBeenCalled();
    expect(wrapper.emitted("success")).toBeUndefined();
  });

  it("allows only one comment submission while POST is pending", async () => {
    let resolvePost!: (response: { ok: boolean }) => void;
    mocks.requestApi.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );
    mocks.getValue.mockReturnValue("new comment");
    const wrapper = mountEditor();
    await wrapper.find(".unselectable").trigger("click");
    const send = wrapper.findAll("button").find((button) => button.text() === "发送")!;
    await send.trigger("click");
    await send.trigger("click");
    expect(send.attributes("disabled")).toBeDefined();
    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
    resolvePost({ ok: true });
    await flushPromises();
    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(mocks.forumStore.refreshPost).toHaveBeenCalledTimes(1);
  });
});
