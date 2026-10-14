import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import SurveyComposerDialog from "@/components/survey/SurveyComposerDialog.vue";
import SurveyBlockEditor from "@/components/survey/SurveyBlockEditor.vue";
import type { SurveyDraft } from "@/utils/survey";

const passthrough = (name: string) => defineComponent({ name, template: "<div><slot /></div>" });

const dialogStubs = {
  Dialog: defineComponent({
    name: "Dialog",
    props: { open: { type: Boolean, default: false } },
    template: '<div v-if="open" class="dialog-stub"><slot /></div>',
  }),
  DialogContent: passthrough("DialogContent"),
  DialogHeader: passthrough("DialogHeader"),
  DialogTitle: passthrough("DialogTitle"),
  DialogFooter: passthrough("DialogFooter"),
};

const markdownEditorStub = defineComponent({
  name: "MarkdownEditor",
  props: { modelValue: { type: String, default: "" }, preview: Boolean },
  emits: ["update:modelValue"],
  template: `
    <textarea v-if="!preview" class="markdown-editor-stub" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
    <div v-else class="markdown-preview-stub">{{ modelValue }}</div>
  `,
});

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(SurveyComposerDialog, {
    props: { visible: true, ...props },
    global: { stubs: { ...dialogStubs, MarkdownEditor: markdownEditorStub } },
  });

const confirmButton = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.findAll("button").find((button) => button.text() === "确定")!;

const addButton = (wrapper: ReturnType<typeof mountDialog>, label: string) =>
  wrapper.findAll("button").find((button) => button.text().includes(label))!;

describe("SurveyComposerDialog", () => {
  it("保存模式确认后保留编辑器，pending 时禁止关闭或重复确认", async () => {
    const wrapper = mountDialog({ closeOnConfirm: false });
    await wrapper.find(".markdown-editor-stub").setValue("保留草稿");
    await confirmButton(wrapper).trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("update:visible")).toBeUndefined();
    await wrapper.setProps({ pending: true });
    const save = wrapper.findAll("button").find((button) => button.text() === "保存中...")!;
    expect(save.attributes("disabled")).toBeDefined();
    await save.trigger("click");
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "取消")!
      .trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("update:visible")).toBeUndefined();
    await wrapper.setProps({ pending: false });
    expect((wrapper.find(".markdown-editor-stub").element as HTMLTextAreaElement).value).toBe("保留草稿");
  });

  it("移动区块时保留组件身份与当前编辑状态", async () => {
    const wrapper = mountDialog();
    const editor = wrapper.findAllComponents(SurveyBlockEditor)[0];
    await editor.find('button[aria-label="下移"]').trigger("click");
    const moved = wrapper.findAllComponents(SurveyBlockEditor)[1];
    expect(moved.element === editor.element).toBe(true);
    expect(moved.props("active")).toBe(true);
    expect(moved.find(".markdown-editor-stub").exists()).toBe(true);
  });
  it("默认包含一个 Markdown 区块与一道题", () => {
    const wrapper = mountDialog();
    expect(wrapper.findAll(".block-editor")).toHaveLength(2);
    expect(confirmButton(wrapper).attributes("disabled")).toBeUndefined();
  });

  it("可添加 Markdown 与题目区块", async () => {
    const wrapper = mountDialog();
    await addButton(wrapper, "+ Markdown").trigger("click");
    expect(wrapper.findAll(".block-editor")).toHaveLength(3);
    await addButton(wrapper, "+ 题目").trigger("click");
    expect(wrapper.findAll(".block-editor")).toHaveLength(4);
  });

  it("填好 Markdown 后确定，发出归一化草稿", async () => {
    const wrapper = mountDialog();
    await wrapper.find(".markdown-editor-stub").setValue("  # 标题  ");
    await confirmButton(wrapper).trigger("click");

    const events = wrapper.emitted("confirm");
    expect(events).toHaveLength(1);
    const draft = events![0][0] as SurveyDraft;
    expect(draft.allow_multiple).toBe(false);
    expect(draft.blocks).toHaveLength(2);
    expect(draft.blocks[0]).toEqual({ kind: "markdown", content: "# 标题" });
    expect(draft.blocks[1].kind).toBe("question");
  });

  it("空白 Markdown 区块在确定时被丢弃", async () => {
    const wrapper = mountDialog();
    await confirmButton(wrapper).trigger("click");

    const draft = wrapper.emitted("confirm")![0][0] as SurveyDraft;
    expect(draft.blocks).toHaveLength(1);
    expect(draft.blocks[0].kind).toBe("question");
  });

  it("locked 时隐藏编辑器并显示锁定提示", () => {
    const initial: SurveyDraft = {
      allow_multiple: false,
      blocks: [
        { kind: "markdown", content: "说明" },
        { kind: "question", type: "single", required: true, config: { options: ["A", "B"] } },
      ],
    };
    const wrapper = mountDialog({ initial, locked: true });
    expect(wrapper.find(".composer__locked").exists()).toBe(true);
    expect(wrapper.findAll(".block-editor")).toHaveLength(0);
    expect(wrapper.findAll("button").some((button) => button.text().includes("+ 题目"))).toBe(false);
  });

  it("拖动 cell 可以调整顺序", async () => {
    const initial: SurveyDraft = {
      allow_multiple: false,
      blocks: [
        { kind: "markdown", content: "第一段" },
        { kind: "question", type: "single", required: false, config: { options: ["A", "B"] } },
        { kind: "markdown", content: "第二段" },
      ],
    };
    const wrapper = mountDialog({ initial });
    const editors = wrapper.findAllComponents(SurveyBlockEditor);
    expect(editors).toHaveLength(3);

    editors[2].vm.$emit("dragstart", { dataTransfer: null });
    editors[0].vm.$emit("dragover", { preventDefault: () => {} });
    editors[0].vm.$emit("drop", { preventDefault: () => {} });
    await nextTick();

    await confirmButton(wrapper).trigger("click");
    const draft = wrapper.emitted("confirm")![0][0] as SurveyDraft;
    expect(draft.blocks.map((block) => (block.kind === "markdown" ? block.content : block.kind))).toEqual([
      "第二段",
      "第一段",
      "question",
    ]);
  });

  it("从 initial 载入已有问卷", () => {
    const initial: SurveyDraft = {
      allow_multiple: true,
      blocks: [
        { kind: "markdown", content: "说明" },
        { kind: "question", type: "multiple", required: false, config: { options: ["A", "B", "C"] } },
      ],
    };
    const wrapper = mountDialog({ initial });
    expect(wrapper.findAll(".block-editor")).toHaveLength(2);
    expect((wrapper.find(".composer__checkbox input").element as HTMLInputElement).checked).toBe(true);
  });
});
