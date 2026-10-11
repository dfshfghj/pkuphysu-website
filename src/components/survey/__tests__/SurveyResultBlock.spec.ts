import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import SurveyResultBlock from "@/components/survey/SurveyResultBlock.vue";
import type {
  SurveyQuestionResultBlock,
  SurveyQuestionType,
} from "@/utils/survey";

vi.mock("@/utils/upload", () => ({
  uploadedFileUrl: (url: string) => `/api/v2/static${url}`,
}));

if (!("getComputedTextLength" in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
    configurable: true,
    value: () => 0,
  });
}

if (!("getBBox" in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  });
}

const makeBlock = (
  type: SurveyQuestionType,
  extra: Partial<SurveyQuestionResultBlock> = {}
): SurveyQuestionResultBlock =>
  ({
    id: 1,
    kind: "question",
    type,
    required: false,
    config: {},
    answered: 10,
    ...extra,
  }) as SurveyQuestionResultBlock;

const mountBlock = (block: SurveyQuestionResultBlock) =>
  mount(SurveyResultBlock, { props: { block, label: "第 1 题" } });

describe("SurveyResultBlock", () => {
  it("单选渲染横向条形图", () => {
    const wrapper = mountBlock(
      makeBlock("single", {
        options: [
          { text: "A", count: 6, percent: 60 },
          { text: "B", count: 4, percent: 40 },
        ],
      })
    );
    expect(wrapper.find(".result-block__plot").exists()).toBe(true);
    expect(wrapper.text()).toContain("10 人作答");
  });

  it("量表渲染均值与条形图", () => {
    const wrapper = mountBlock(
      makeBlock("scale", {
        average: 3.5,
        values: [
          { value: 1, count: 1, percent: 10 },
          { value: 5, count: 9, percent: 90 },
        ],
      })
    );
    expect(wrapper.text()).toContain("平均 3.5");
    expect(wrapper.find(".result-block__plot").exists()).toBe(true);
  });

  it("滑动条渲染均值与条形图", () => {
    const wrapper = mountBlock(
      makeBlock("slider", {
        average: 42,
        unit: "%",
        min_value: 0,
        max_value: 100,
        buckets: [
          { from: 0, to: 50, count: 3 },
          { from: 50, to: 100, count: 7 },
        ],
      })
    );
    expect(wrapper.text()).toContain("平均 42%（最低 0 / 最高 100）");
    expect(wrapper.find(".result-block__plot").exists()).toBe(true);
  });

  it("比重题渲染饼图图例（含百分比）", async () => {
    const wrapper = mountBlock(
      makeBlock("proportion", {
        total: 100,
        options: [
          { text: "A", average: 60 },
          { text: "B", average: 40 },
        ],
      })
    );
    await nextTick();
    expect(wrapper.find(".result-block__plot--pie").exists()).toBe(true);
    expect(wrapper.text()).toContain("A（60%）");
    expect(wrapper.text()).toContain("B（40%）");
  });

  it("排序题渲染平均名次", () => {
    const wrapper = mountBlock(
      makeBlock("ranking", {
        options: [{ text: "A", average_rank: 1.2 }],
      })
    );
    expect(wrapper.text()).toContain("平均第 1.2 位");
  });

  it("简答题渲染文字与空状态", () => {
    const empty = mountBlock(makeBlock("text", { texts: [] }));
    expect(empty.text()).toContain("暂无文字作答");

    const filled = mountBlock(
      makeBlock("text", { texts: [{ username: "小明", text: "很好" }] })
    );
    expect(filled.text()).toContain("小明");
    expect(filled.text()).toContain("很好");
  });

  it("上传题渲染图片缩略图", () => {
    const wrapper = mountBlock(
      makeBlock("upload", {
        accept: "image",
        uploads: [{ username: "小明", files: [{ url: "/files/a.png", name: "a.png" }] }],
      })
    );
    const img = wrapper.find(".result-block__upload-thumb img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("/api/v2/static/files/a.png");
  });

  it("上传题渲染文件链接", () => {
    const wrapper = mountBlock(
      makeBlock("upload", {
        accept: "file",
        uploads: [{ username: "小明", files: [{ url: "/files/a.pdf", name: "a.pdf" }] }],
      })
    );
    expect(wrapper.find(".result-block__upload-thumb").exists()).toBe(false);
    const link = wrapper.find(".result-block__upload-link");
    expect(link.text()).toBe("a.pdf");
  });
});
