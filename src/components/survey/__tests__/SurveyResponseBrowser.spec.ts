import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SurveyResponseBrowser from "@/components/survey/SurveyResponseBrowser.vue";

const headers = ["答卷 ID", "答题人", "提交时间", "第 1 题"];
const rows = Array.from({ length: 21 }, (_, index) => [
  String(index + 1),
  `用户${index + 1}`,
  "2026-10-13",
  index === 20 ? "第一行\n特殊答案" : "普通答案",
]);
const mountBrowser = () =>
  mount(SurveyResponseBrowser, {
    props: { table: { headers, rows } },
    global: {
      stubs: {
        DialogContent: { template: "<div><slot /></div>" },
      },
    },
  });

describe("SurveyResponseBrowser", () => {
  it("paginates and searches complete answers beyond the current page", async () => {
    const wrapper = mountBrowser();
    expect(wrapper.findAll("tbody tr")).toHaveLength(10);
    await wrapper
      .findAll("button")
      .find((button) => button.text() === "下一页")!
      .trigger("click");
    expect(wrapper.find("tbody td").text()).toBe("11");
    await wrapper.find("input").setValue("特殊答案");
    expect(wrapper.findAll("tbody tr")).toHaveLength(1);
    expect(wrapper.find("tbody td").text()).toBe("21");
    expect(wrapper.text()).toContain("第 1 / 1 页");
  });

  it("shows full multiline answers as text in the response detail", async () => {
    const wrapper = mountBrowser();
    await wrapper.find("input").setValue("特殊答案");
    await wrapper.find('[aria-label="查看答卷 21"]').trigger("click");
    expect(wrapper.find("dl").text()).toContain("第一行\n特殊答案");
    expect(wrapper.findAll("dt").map((item) => item.text())).toEqual(headers);
  });

  it("distinguishes no responses from an empty search and resets on refresh", async () => {
    const wrapper = mountBrowser();
    await wrapper.find("input").setValue("不存在");
    expect(wrapper.text()).toContain("没有匹配的答卷");
    await wrapper.find("input").setValue("");
    await wrapper.setProps({ table: { headers, rows: [] } });
    expect(wrapper.text()).toContain("暂无答卷");
  });
});
