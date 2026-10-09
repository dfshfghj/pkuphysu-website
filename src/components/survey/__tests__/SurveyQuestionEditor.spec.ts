import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SurveyQuestionEditor from "@/components/survey/SurveyQuestionEditor.vue";
import type { SurveyQuestionDraftBlock, SurveySliderConfig } from "@/utils/survey";

const mountEditor = (modelValue: SurveyQuestionDraftBlock, disabled = false) =>
  mount(SurveyQuestionEditor, { props: { modelValue, disabled } });

const lastEmitted = (wrapper: ReturnType<typeof mountEditor>) => {
  const events = wrapper.emitted("update:modelValue");
  return events![events!.length - 1][0] as SurveyQuestionDraftBlock;
};

describe("SurveyQuestionEditor", () => {
  it("多选渲染最少 / 最多选择", () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "multiple",
      required: false,
      config: { options: ["A", "B"] },
    });
    const labels = wrapper.findAll(".question-config__field span").map((node) => node.text());
    expect(labels).toEqual(["最少选择（0 为不限）", "最多选择（0 为不限）"]);
  });

  it("滑动条只渲染步长字段", () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "slider",
      required: false,
      config: { min: 0, max: 100, step: 5, default: 50, minLabel: "低", maxLabel: "高" },
    });
    const labels = wrapper.findAll(".question-config__field span").map((node) => node.text());
    expect(labels).toEqual(["步长"]);
  });

  it("无配置的题型不渲染配置区", () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "single",
      required: false,
      config: { options: ["A", "B"] },
    });
    expect(wrapper.find(".question-config").exists()).toBe(false);
  });

  it("disabled 时字段禁用", () => {
    const wrapper = mountEditor(
      { kind: "question", type: "slider", required: false, config: { min: 0, max: 100, step: 5, default: 50 } },
      true
    );
    expect(wrapper.find('input[type="number"]').attributes("disabled")).toBeDefined();
  });

  it("滑块步长字段可更新配置", async () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "slider",
      required: false,
      config: { min: 0, max: 100, step: 5, default: 50 },
    });
    await wrapper.find('input[type="number"]').setValue("10");
    expect((lastEmitted(wrapper).config as SurveySliderConfig).step).toBe(10);
  });
});
