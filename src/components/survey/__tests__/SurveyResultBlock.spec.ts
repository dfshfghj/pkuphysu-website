import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { VisDonutSelectors } from "@unovis/vue";
import { ChartTooltip } from "@/components/ui/chart";
import SurveyResultBlock from "@/components/survey/SurveyResultBlock.vue";
import type { SurveyQuestionResultBlock, SurveyQuestionType } from "@/utils/survey";

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
    expect(wrapper.text()).toContain("10 份作答");
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

    const filled = mountBlock(makeBlock("text", { texts: [{ username: "小明", text: "很好" }] }));
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
  it("零答卷不伪造均值或图表", () => {
    const wrapper = mountBlock(makeBlock("slider", { answered: 0 }));
    expect(wrapper.text()).toContain("暂无作答");
    expect(wrapper.text()).not.toContain("平均 0");
    expect(wrapper.find(".result-block__plot").exists()).toBe(false);
  });

  it("统计表直接展示多选次数、占比及分母说明", () => {
    const wrapper = mount(SurveyResultBlock, {
      props: {
        block: makeBlock("multiple", {
          required: true,
          options: [
            { text: "A", count: 8, percent: 80 },
            { text: "B", count: 7, percent: 70 },
          ],
        }),
        label: "第 2 题",
        responseCount: 12,
      },
    });
    expect(wrapper.text()).toContain("第 2 题");
    expect(wrapper.text()).toContain("多选 · 必答");
    expect(wrapper.text()).toContain("2 份未答");
    expect(wrapper.find("table").text()).toContain("80%");
    expect(wrapper.find("table").text()).toContain("70%");
    expect(wrapper.text()).toContain("多选占比之和可能超过 100%");
  });

  it("排序结果按平均名次升序并将缺失值置后", () => {
    const wrapper = mountBlock(
      makeBlock("ranking", {
        options: [{ text: "缺失" }, { text: "第二", average_rank: 2 }, { text: "第一", average_rank: 1 }],
      })
    );
    const rows = wrapper.findAll(".result-block__rank-row");
    expect(rows.map((row) => row.find(".result-block__rank-text").text())).toEqual(["第一", "第二", "缺失"]);
    expect(rows[2].text()).toContain("—");
    expect(rows[2].text()).not.toContain("第 0 位");
  });

  it("简答分页并在搜索时回到第一页", async () => {
    const wrapper = mountBlock(
      makeBlock("text", {
        answered: 12,
        texts: Array.from({ length: 12 }, (_, index) => ({ username: `用户${index}`, text: `答案${index}` })),
      })
    );
    expect(wrapper.findAll(".result-block__text")).toHaveLength(10);
    await wrapper.findAll(".result-block__pagination button")[1].trigger("click");
    expect(wrapper.findAll(".result-block__text")).toHaveLength(2);
    await wrapper.find('input[type="search"]').setValue("答案0");
    expect(wrapper.findAll(".result-block__text")).toHaveLength(1);
    expect(wrapper.text()).toContain("答案0");
    await wrapper.find('input[type="search"]').setValue("没有此答案");
    expect(wrapper.text()).toContain("没有匹配的作答");
  });

  it("图片上传使用题目配置作为格式回退并支持文件名筛选", async () => {
    const wrapper = mountBlock(
      makeBlock("upload", {
        config: { accept: "image", multiple: false, maxCount: 1 },
        uploads: [
          { username: "甲", files: [{ url: "/files/a.png", name: "图片甲.png" }] },
          { username: "乙", files: [{ url: "/files/b.png", name: "图片乙.png" }] },
        ],
      })
    );
    expect(wrapper.findAll("img")).toHaveLength(2);
    await wrapper.find('input[type="search"]').setValue("图片乙");
    expect(wrapper.findAll("img")).toHaveLength(1);
    expect(wrapper.find("img").attributes("alt")).toBe("图片乙.png");
  });

  it("缺失均值保留未知，实际零值仍然显示", () => {
    const missing = mountBlock(makeBlock("scale"));
    expect(missing.text()).toContain("平均 —");
    const zero = mountBlock(makeBlock("slider", { average: 0, min_value: 0, max_value: 0 }));
    expect(zero.text()).toContain("平均 0（最低 0 / 最高 0）");
  });

  it("比重表使用配置总分计算比例且随数据刷新更新", async () => {
    const wrapper = mountBlock(
      makeBlock("proportion", {
        config: { options: ["A", "B"], total: 200 },
        options: [
          { text: "A", average: 50 },
          { text: "B", average: 150 },
        ],
      })
    );
    expect(wrapper.find("table").text()).toContain("25%");
    const tooltip = wrapper.findComponent(ChartTooltip).props("triggers")[VisDonutSelectors.segment];
    expect(tooltip({ key: "slice-0", name: "A", "slice-0": 50 })).toContain("A（25%）");
    await wrapper.setProps({
      block: makeBlock("proportion", { total: 100, options: [{ text: "新选项", average: 100 }] }),
    });
    expect(wrapper.find("table").text()).toContain("新选项100100%");
    expect(wrapper.text()).not.toContain("A（25%）");
    expect(tooltip({ key: "slice-0", name: "新选项", "slice-0": 100 })).toContain("新选项（100%）");
    expect(tooltip({ key: "slice-0", name: "新选项", "slice-0": 0 })).toContain("平均 0");
  });
});
