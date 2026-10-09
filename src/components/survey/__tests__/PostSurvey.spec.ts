import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostSurvey from "@/components/survey/PostSurvey.vue";
import type { SurveySummary } from "@/utils/survey";

const mocks = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

const baseSurvey: SurveySummary = {
  id: 7,
  question_count: 3,
  status: "open",
  allow_multiple: false,
  is_owner: false,
  can_view_results: false,
};

const mountSurvey = (survey: SurveySummary) => mount(PostSurvey, { props: { survey } });

describe("PostSurvey", () => {
  beforeEach(() => {
    mocks.routerPush.mockReset();
  });

  it("渲染入口标题与题数", () => {
    const wrapper = mountSurvey(baseSurvey);
    expect(wrapper.find(".post-survey__title").text()).toBe("参与问卷");
    expect(wrapper.find(".post-survey__meta").text()).toContain("3 题");
  });

  it("点击卡片跳转到填写页", async () => {
    const wrapper = mountSurvey(baseSurvey);
    await wrapper.find(".post-survey").trigger("click");
    expect(mocks.routerPush).toHaveBeenCalledWith("/survey/7");
  });

  it("可查看数据时显示入口并跳转数据页", async () => {
    const wrapper = mountSurvey({ ...baseSurvey, is_owner: true, can_view_results: true, response_count: 12 });
    expect(wrapper.find(".post-survey__meta").text()).toContain("12 份答卷");
    const resultsButton = wrapper.find(".post-survey__results");
    expect(resultsButton.exists()).toBe(true);
    await resultsButton.trigger("click");
    expect(mocks.routerPush).toHaveBeenCalledWith("/survey/7/results");
  });

  it("不可查看数据时不显示入口", () => {
    const wrapper = mountSurvey(baseSurvey);
    expect(wrapper.find(".post-survey__results").exists()).toBe(false);
  });
});
