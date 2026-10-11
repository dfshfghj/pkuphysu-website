import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import SurveyQuestionField from "@/components/survey/SurveyQuestionField.vue";
import type {
  SurveyAnswerValue,
  SurveyQuestionDraftBlock,
  SurveyQuestionType,
  SurveySliderConfig,
  SurveyTextConfig,
} from "@/utils/survey";

vi.mock("@/utils/upload", () => ({
  uploadFiles: vi.fn(async (files: File[]) =>
    files.map((file, index) => ({ url: `/files/${index}.png`, name: file.name, size: 1 }))
  ),
  uploadedFileUrl: (url: string) => url,
}));

const makeBlock = (type: SurveyQuestionType, config: Record<string, unknown>): SurveyQuestionDraftBlock => ({
  kind: "question",
  type,
  required: false,
  config: config as SurveyQuestionDraftBlock["config"],
});

const mountField = (block: SurveyQuestionDraftBlock, extra: Record<string, unknown> = {}) =>
  mount(SurveyQuestionField, { props: { block, ...extra } });

const lastEmitted = (wrapper: ReturnType<typeof mountField>) => {
  const events = wrapper.emitted("update:modelValue");
  return events![events!.length - 1][0];
};

describe("SurveyQuestionField", () => {
  it("单选渲染选项并在选择时发出下标", async () => {
    const wrapper = mountField(makeBlock("single", { options: ["A", "B"] }));
    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios).toHaveLength(2);
    await radios[1].setValue();
    expect(lastEmitted(wrapper)).toBe(1);
  });

  it("多选发出已选下标数组", async () => {
    const wrapper = mountField(makeBlock("multiple", { options: ["A", "B", "C"] }));
    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true);
    expect(lastEmitted(wrapper)).toEqual([0]);

    await wrapper.setProps({ modelValue: [0] });
    await wrapper.findAll('input[type="checkbox"]')[2].setValue(true);
    expect(lastEmitted(wrapper)).toEqual([0, 2]);
  });

  it("简答发出字符串", async () => {
    const wrapper = mountField(makeBlock("text", { maxLength: 10 }));
    await wrapper.find("textarea").setValue("回答");
    expect(lastEmitted(wrapper)).toBe("回答");
  });

  it("排序默认为原始顺序，可下移交换", async () => {
    const wrapper = mountField(makeBlock("ranking", { options: ["A", "B", "C"] }));
    expect(wrapper.findAll(".survey-field__rank-row")).toHaveLength(3);

    const buttons = wrapper.findAll(".survey-field__rank-tools button");
    await buttons[1].trigger("click");
    expect(lastEmitted(wrapper)).toEqual([1, 0, 2]);
  });

  it("排序题拖动选项发出新的顺序（填写模式）", async () => {
    const wrapper = mountField(makeBlock("ranking", { options: ["A", "B", "C"] }), {
      modelValue: [0, 1, 2] as SurveyAnswerValue,
    });
    const rows = wrapper.findAll(".survey-field__rank-row");
    const dataTransfer = { effectAllowed: "", setData: () => {}, getData: () => "" };

    await wrapper.findAll(".survey-field__rank-handle")[0].trigger("dragstart", { dataTransfer });
    await rows[2].trigger("dragover", { dataTransfer });
    await rows[2].trigger("drop", { dataTransfer });

    expect(lastEmitted(wrapper)).toEqual([1, 2, 0]);
  });

  it("编辑模式下拖动排序题选项重排配置", async () => {
    const wrapper = mountField(makeBlock("ranking", { options: ["A", "B", "C"] }), { editable: true });
    const rows = wrapper.findAll(".survey-field__rank-row");
    const dataTransfer = { effectAllowed: "", setData: () => {}, getData: () => "" };

    await wrapper.findAll(".survey-field__rank-handle")[2].trigger("dragstart", { dataTransfer });
    await rows[0].trigger("dragover", { dataTransfer });
    await rows[0].trigger("drop", { dataTransfer });

    const events = wrapper.emitted("update:block");
    expect((events![events!.length - 1][0] as SurveyQuestionDraftBlock).config).toEqual({
      options: ["C", "A", "B"],
    });
  });

  it("滑动条发出数字", async () => {
    const wrapper = mountField(makeBlock("slider", { min: 0, max: 100, step: 1, default: 50 }));
    await wrapper.find('input[type="range"]').setValue("30");
    expect(lastEmitted(wrapper)).toBe(30);
  });

  it("比重条最后一项自动补足并显示合计", async () => {
    const wrapper = mountField(makeBlock("proportion", { options: ["A", "B"], total: 100 }));
    await wrapper.findAll('input[type="number"]')[0].setValue("60");
    const emitted = lastEmitted(wrapper);
    expect(emitted).toEqual([60, 40]);

    await wrapper.setProps({ modelValue: emitted });
    expect(wrapper.find(".survey-field__proportion-sum").text()).toContain("100 / 100");
  });

  it("量表渲染区间选项", async () => {
    const wrapper = mountField(makeBlock("scale", { min: 1, max: 5 }));
    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios).toHaveLength(5);
    await radios[3].setValue();
    expect(lastEmitted(wrapper)).toBe(4);
  });

  it("有 label 时显示题号与必答标记", () => {
    const block = { ...makeBlock("single", { options: ["A", "B"] }), required: true };
    const wrapper = mountField(block, { label: "第 2 题" });
    expect(wrapper.find(".survey-field__label").text()).toContain("第 2 题");
    expect(wrapper.find(".survey-field__required").exists()).toBe(true);
  });

  it("无 label 的必答题只显示必答标记", () => {
    const block = { ...makeBlock("single", { options: ["A", "B"] }), required: true };
    const wrapper = mountField(block);
    expect(wrapper.find(".survey-field__label").text()).toBe("*");
  });

  it("填写模式下选项文本渲染为禁用的输入框，不显示增删按钮", () => {
    const wrapper = mountField(makeBlock("single", { options: ["A", "B"] }));
    const texts = wrapper.findAll(".survey-field__option-text");
    expect(texts).toHaveLength(2);
    expect(texts[0].attributes("disabled")).toBeDefined();
    expect(wrapper.find(".survey-field__option-add").exists()).toBe(false);
    expect(wrapper.find(".survey-field__option-tool").exists()).toBe(false);
  });

  it("编辑模式下选项文本可编辑并支持增删", async () => {
    const wrapper = mountField(makeBlock("single", { options: ["A", "B"] }), { editable: true });
    const texts = wrapper.findAll(".survey-field__option-text");
    expect(texts).toHaveLength(2);
    expect(texts[0].attributes("disabled")).toBeUndefined();

    await texts[0].setValue("甲");
    const blockEvents = wrapper.emitted("update:block");
    expect(blockEvents![blockEvents!.length - 1][0]).toEqual({
      kind: "question",
      type: "single",
      required: false,
      config: { options: ["甲", "B"] },
    });

    await wrapper.find(".survey-field__option-add").trigger("click");
    const added = wrapper.emitted("update:block")!;
    expect((added[added.length - 1][0] as SurveyQuestionDraftBlock).config).toEqual({
      options: ["A", "B", ""],
    });
  });

  it("填写模式下提交答案不受选项文本输入影响", async () => {
    const wrapper = mountField(makeBlock("multiple", { options: ["A", "B"] }), {
      modelValue: [0] as SurveyAnswerValue,
    });
    expect(wrapper.find(".survey-field__option-add").exists()).toBe(false);
    await wrapper.findAll('input[type="checkbox"]')[1].setValue(true);
    expect(lastEmitted(wrapper)).toEqual([0, 1]);
  });

  it("填写模式下滑动条两端显示数值与标签", () => {
    const wrapper = mountField(
      makeBlock("slider", { min: 0, max: 100, step: 1, default: 50, minLabel: "低", maxLabel: "高" })
    );
    expect(wrapper.findAll(".survey-field__bound")).toHaveLength(0);
    const labels = wrapper.findAll(".survey-field__slider-label");
    expect(labels.map((node) => node.text())).toEqual(["低", "高"]);
    expect(wrapper.find(".survey-field__slider-bounds").text()).toContain("0");
    expect(wrapper.find(".survey-field__slider-bounds").text()).toContain("100");
  });

  it("编辑模式下滑动条的范围与标签改为输入框，拖动设置默认值", async () => {
    const wrapper = mountField(
      makeBlock("slider", { min: 0, max: 100, step: 1, default: 50, minLabel: "低", maxLabel: "高" }),
      { editable: true }
    );

    const bounds = wrapper.findAll(".survey-field__bound");
    expect(bounds).toHaveLength(2);
    expect(bounds[0].attributes("value")).toBe("0");
    expect(bounds[1].attributes("value")).toBe("100");

    const labels = wrapper.findAll("input.survey-field__slider-label");
    expect(labels).toHaveLength(2);
    expect(labels[0].attributes("value")).toBe("低");
    expect(labels[1].attributes("value")).toBe("高");

    await wrapper.find('input[type="range"]').setValue("30");
    const events = wrapper.emitted("update:block");
    const block = events![events!.length - 1][0] as SurveyQuestionDraftBlock;
    expect((block.config as SurveySliderConfig).default).toBe(30);
  });

  it("编辑模式下量表的范围与标签改为输入框", () => {
    const wrapper = mountField(makeBlock("scale", { min: 1, max: 5, minLabel: "低", maxLabel: "高" }), {
      editable: true,
    });
    expect(wrapper.findAll(".survey-field__bound")).toHaveLength(2);
    expect(wrapper.findAll("input.survey-field__slider-label")).toHaveLength(2);
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(5);
  });

  it("比重题最后一个选项自动补足且不可拖动", async () => {
    const wrapper = mountField(makeBlock("proportion", { options: ["A", "B"], total: 100 }), {
      modelValue: [40, 60] as SurveyAnswerValue,
    });
    const ranges = wrapper.findAll('input[type="range"]');
    expect(ranges).toHaveLength(2);
    expect(ranges[0].attributes("max")).toBe("100");
    expect(ranges[1].attributes("disabled")).toBeDefined();

    await ranges[0].setValue("70");
    expect(lastEmitted(wrapper)).toEqual([70, 30]);
  });

  it("比重题每个选项的滑动条下方显示 0 ~ total", () => {
    const wrapper = mountField(makeBlock("proportion", { options: ["A", "B"], total: 100 }));
    const bounds = wrapper.findAll(".survey-field__proportion-bounds");
    expect(bounds).toHaveLength(2);
    expect(bounds[0].text()).toContain("0");
    expect(bounds[0].text()).toContain("100");
  });

  it("编辑模式下比重总分在合计行内编辑", async () => {
    const wrapper = mountField(makeBlock("proportion", { options: ["A", "B"], total: 100 }), { editable: true });
    const total = wrapper.find(".survey-field__proportion-total");
    expect(total.exists()).toBe(true);
    expect(total.attributes("value")).toBe("100");

    await total.setValue("200");
    const events = wrapper.emitted("update:block");
    expect((events![events!.length - 1][0] as SurveyQuestionDraftBlock).config).toMatchObject({ total: 200 });
  });

  it("填写模式下简答显示字数计数", () => {
    const wrapper = mountField(makeBlock("text", { placeholder: "请输入", maxLength: 200 }), {
      modelValue: "回答",
    });
    expect(wrapper.find(".survey-field__text-count").text()).toContain("2/");
    expect(wrapper.find(".survey-field__text-count").text()).toContain("200");
    expect(wrapper.find(".survey-field__text-max").exists()).toBe(false);
  });

  it("编辑模式下简答在 textarea 中编辑占位提示并显示字数上限", async () => {
    const wrapper = mountField(makeBlock("text", { placeholder: "请说明", maxLength: 50 }), { editable: true });
    const textarea = wrapper.find("textarea");
    expect(textarea.attributes("placeholder")).toBe("在此输入占位提示");
    expect(wrapper.find(".survey-field__text-count").text()).toContain("3/");

    await textarea.setValue("新的提示");
    const events = wrapper.emitted("update:block");
    const block = events![events!.length - 1][0] as SurveyQuestionDraftBlock;
    expect((block.config as SurveyTextConfig).placeholder).toBe("新的提示");

    await wrapper.find(".survey-field__text-max").setValue("80");
    const maxEvents = wrapper.emitted("update:block")!;
    expect((maxEvents[maxEvents.length - 1][0] as SurveyQuestionDraftBlock).config).toMatchObject({
      maxLength: 80,
    });
  });

  it("上传题选择文件后发出文件列表", async () => {
    const wrapper = mountField(makeBlock("upload", { accept: "image", multiple: false, maxCount: 1 }));
    const input = wrapper.find('input[type="file"]');
    const file = new File(["x"], "photo.png", { type: "image/png" });
    Object.defineProperty(input.element, "files", { value: [file], configurable: true });

    await input.trigger("change");
    await flushPromises();
    expect(lastEmitted(wrapper)).toEqual([{ url: "/files/0.png", name: "photo.png" }]);
  });

  it("上传题达到数量上限后禁用选择按钮", () => {
    const wrapper = mountField(makeBlock("upload", { accept: "file", multiple: true, maxCount: 1 }), {
      modelValue: [{ url: "/files/a.pdf", name: "a.pdf" }] as SurveyAnswerValue,
    });
    expect(wrapper.find(".survey-field__upload-btn").attributes("disabled")).toBeDefined();
  });

  it("上传题可移除已上传文件", async () => {
    const wrapper = mountField(makeBlock("upload", { accept: "file", multiple: true, maxCount: 3 }), {
      modelValue: [
        { url: "/files/a.pdf", name: "a.pdf" },
        { url: "/files/b.pdf", name: "b.pdf" },
      ] as SurveyAnswerValue,
    });

    await wrapper.findAll(".survey-field__upload-item button")[0].trigger("click");
    expect(lastEmitted(wrapper)).toEqual([{ url: "/files/b.pdf", name: "b.pdf" }]);
  });

  it("编辑模式下上传题显示填写提示", () => {
    const wrapper = mountField(makeBlock("upload", { accept: "image", multiple: false, maxCount: 1 }), {
      editable: true,
    });
    expect(wrapper.find(".survey-field__upload-hint").text()).toContain("填写时可上传");
  });
});
