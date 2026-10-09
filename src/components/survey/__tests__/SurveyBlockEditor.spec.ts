import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import SurveyBlockEditor from "@/components/survey/SurveyBlockEditor.vue";
import { Select } from "@/components/ui/select";
import type { SurveyDraftBlock, SurveyQuestionDraftBlock } from "@/utils/survey";

const markdownEditorStub = defineComponent({
  name: "MarkdownEditor",
  props: { modelValue: { type: String, default: "" } },
  emits: ["update:modelValue"],
  template:
    '<textarea class="markdown-editor-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const markdownContentStub = defineComponent({
  name: "MarkdownContent",
  props: { source: { type: String, default: "" } },
  template: '<div class="markdown-content-stub">{{ source }}</div>',
});

const questionEditorStub = defineComponent({
  name: "SurveyQuestionEditor",
  props: { modelValue: { type: Object, required: true }, disabled: Boolean },
  emits: ["update:modelValue"],
  template: '<div class="question-editor-stub" />',
});

const questionFieldStub = defineComponent({
  name: "SurveyQuestionField",
  props: { block: { type: Object, required: true }, editable: Boolean, fieldName: String },
  emits: ["update:modelValue", "update:block"],
  template: '<div class="question-field-stub" :data-editable="editable" />',
});

const mountBlock = (block: SurveyDraftBlock, extra: Record<string, unknown> = {}) =>
  mount(SurveyBlockEditor, {
    props: { block, index: 0, total: 2, ...extra },
    global: {
      stubs: {
        MarkdownEditor: markdownEditorStub,
        MarkdownContent: markdownContentStub,
        SurveyQuestionEditor: questionEditorStub,
        SurveyQuestionField: questionFieldStub,
      },
    },
  });

const markdownBlock = (): SurveyDraftBlock => ({ kind: "markdown", content: "文字" });
const questionBlock = (): SurveyDraftBlock => ({
  kind: "question",
  type: "single",
  required: false,
  config: { options: ["A", "B"] },
});

describe("SurveyBlockEditor", () => {
  it("非激活的 Markdown 区块显示预览，点击后请求激活", async () => {
    const wrapper = mountBlock(markdownBlock(), { active: false });
    expect(wrapper.find(".block-editor__preview").exists()).toBe(true);
    expect(wrapper.find(".markdown-editor-stub").exists()).toBe(false);

    await wrapper.find(".block-editor__preview").trigger("click");
    expect(wrapper.emitted("activate")).toHaveLength(1);
  });

  it("点击 Markdown 区块任意位置都请求激活", async () => {
    const wrapper = mountBlock(markdownBlock(), { active: false });
    await wrapper.find(".block-editor__badge").trigger("click");
    expect(wrapper.emitted("activate")).toHaveLength(1);
  });

  it("激活的 Markdown 区块显示编辑器并可编辑", async () => {
    const wrapper = mountBlock(markdownBlock(), { active: true });
    expect(wrapper.find(".block-editor__preview").exists()).toBe(false);
    const editor = wrapper.find(".markdown-editor-stub");
    expect(editor.exists()).toBe(true);

    await editor.setValue("新内容");
    const events = wrapper.emitted("update:modelValue");
    expect(events![events!.length - 1][0]).toEqual({ kind: "markdown", content: "新内容" });
  });

  it("题目区块同时渲染题型选择器、配置工具栏与可编辑的答题控件", () => {
    const wrapper = mountBlock(questionBlock());
    expect(wrapper.find(".block-editor__type").exists()).toBe(true);
    expect(wrapper.find(".block-editor__required").exists()).toBe(true);
    expect(wrapper.find(".question-editor-stub").exists()).toBe(true);
    const field = wrapper.find(".question-field-stub");
    expect(field.exists()).toBe(true);
    expect(field.attributes("data-editable")).toBe("true");
  });

  it("切换题型会重置配置", async () => {
    const wrapper = mountBlock(questionBlock());
    wrapper.findComponent(Select).vm.$emit("update:modelValue", "scale");
    await nextTick();

    const events = wrapper.emitted("update:modelValue");
    expect(events![events!.length - 1][0]).toMatchObject({ kind: "question", type: "scale" });
  });

  it("勾选必答会发出更新", async () => {
    const wrapper = mountBlock(questionBlock());
    await wrapper.find(".block-editor__required input").setValue(true);
    const events = wrapper.emitted("update:modelValue");
    expect((events![events!.length - 1][0] as SurveyQuestionDraftBlock).required).toBe(true);
  });

  it("拖动把手发出 dragstart", async () => {
    const wrapper = mountBlock(markdownBlock());
    await wrapper.find(".block-editor__handle").trigger("dragstart");
    expect(wrapper.emitted("dragstart")).toHaveLength(1);
  });

  it("点击题目区块发出 activate", async () => {
    const wrapper = mountBlock(questionBlock());
    await wrapper.find(".block-editor").trigger("click");
    expect(wrapper.emitted("activate")).toHaveLength(1);
  });

  it("点击工具按钮不触发 activate", async () => {
    const wrapper = mountBlock(questionBlock(), { index: 0, total: 2 });
    await wrapper.findAll(".block-editor__tools button")[1].trigger("click");
    expect(wrapper.emitted("move-down")).toHaveLength(1);
    expect(wrapper.emitted("activate")).toBeUndefined();
  });

  it("上移 / 下移 / 删除按钮发出事件", async () => {
    const wrapper = mountBlock(markdownBlock(), { index: 0, total: 2 });
    const buttons = wrapper.findAll(".block-editor__tools button");
    expect(buttons[0].attributes("disabled")).toBeDefined();
    await buttons[1].trigger("click");
    expect(wrapper.emitted("move-down")).toHaveLength(1);
    await buttons[2].trigger("click");
    expect(wrapper.emitted("remove")).toHaveLength(1);
  });
});
