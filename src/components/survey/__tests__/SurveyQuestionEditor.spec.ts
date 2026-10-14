import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SurveyQuestionEditor from "@/components/survey/SurveyQuestionEditor.vue";
import type { SurveyQuestionDraftBlock, SurveySliderConfig, SurveyUploadConfig } from "@/utils/survey";

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

  it("多选数量提供与选项数一致的边界", () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "multiple",
      required: false,
      config: { options: ["A", "B", "C"] },
    });
    for (const input of wrapper.findAll('input[type="number"]')) {
      expect(input.attributes("min")).toBe("0");
      expect(input.attributes("max")).toBe("3");
      expect(input.attributes("step")).toBe("1");
    }
    expect(wrapper.find(".question-config__help").text()).toContain("必答设置");
  });

  it("上传数量明确限制在 1 至 9 个文件", () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "upload",
      required: false,
      config: { accept: "file", multiple: true, maxCount: 3 },
    });
    const input = wrapper.find('input[type="number"]');
    expect(input.attributes("min")).toBe("1");
    expect(input.attributes("max")).toBe("9");
    expect(wrapper.find(".question-config__help").text()).toContain("9 个文件");
  });

  it("关闭多文件后同步重置数量上限", async () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "upload",
      required: false,
      config: { accept: "file", multiple: true, maxCount: 3 },
    });
    await wrapper.find('[role="checkbox"]').trigger("click");
    expect(lastEmitted(wrapper).config).toEqual({ accept: "file", multiple: false, maxCount: 1 });
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

  it("上传题单选时只渲染允许类型与允许多个", () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "upload",
      required: false,
      config: { accept: "image", multiple: false, maxCount: 1 },
    });
    const labels = wrapper.findAll(".question-config__field > span").map((node) => node.text());
    expect(labels).toEqual(["允许类型", "允许多个"]);
  });

  it("上传题多选时显示最多数量并可更新", async () => {
    const wrapper = mountEditor({
      kind: "question",
      type: "upload",
      required: false,
      config: { accept: "file", multiple: true, maxCount: 3 },
    });
    const labels = wrapper.findAll(".question-config__field > span").map((node) => node.text());
    expect(labels).toEqual(["允许类型", "允许多个", "最多数量"]);

    await wrapper.find('input[type="number"]').setValue("5");
    expect((lastEmitted(wrapper).config as SurveyUploadConfig).maxCount).toBe(5);
  });
});
