import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SurveyResultsView from "@/pages/survey/SurveyResultsView.vue";

const mocks = vi.hoisted(() => ({
  requestApi: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  push: vi.fn(),
  route: null as { params: { id: string } } | null,
}));
vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));
vi.mock("vue-sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive({ params: { id: "7" } });
  return { useRoute: () => mocks.route, useRouter: () => ({ push: mocks.push }) };
});
vi.mock("@/components/survey/SurveyResultBlock.vue", () => ({
  default: { props: ["block", "label", "responseCount"], template: "<div data-result>{{ label }}</div>" },
}));
vi.mock("@/components/survey/SurveyComposerDialog.vue", () => ({
  default: {
    props: ["visible", "initial", "pending", "locked", "closeOnConfirm"],
    emits: ["confirm", "update:visible"],
    template:
      '<div v-if="visible" data-composer><button :disabled="pending" @click="$emit(\'confirm\', initial)">确定</button></div>',
  },
}));
vi.mock("@/components/MarkdownRenderer.vue", () => ({
  default: { props: ["content"], template: "<div>{{ content }}</div>" },
}));

const blocks = [
  { id: 1, kind: "markdown", content: "说明", content_html: "说明" },
  { id: 2, kind: "question", type: "text", required: false, config: { maxLength: 100 }, answered: 3 },
  { id: 3, kind: "markdown", content: "第二题说明", content_html: "第二题说明" },
  { id: 4, kind: "question", type: "single", required: true, config: { options: ["A", "B"] }, answered: 3 },
];
const results = { id: 7, post_id: 88, response_count: 3, status: "open", blocks };
const detail = { ...results, allow_multiple: true, is_owner: true };
const jsonResponse = (data: unknown, ok = true, status = 200) => ({ ok, status, json: async () => ({ data }) });
const api = (owner = true) =>
  mocks.requestApi.mockImplementation(async (path: string, options?: { method?: string }) => {
    if (options?.method === "PUT") return jsonResponse({ message: "已保存" });
    if (path.endsWith("/results/export"))
      return {
        ok: true,
        blob: async () => ({ text: async () => "答卷 ID,答题人,提交时间,第 1 题\n1,张三,2026-10-13,一份完整答案\n" }),
      };
    return jsonResponse(path.endsWith("/results") ? results : { ...detail, is_owner: owner });
  });
const wrappers: ReturnType<typeof mount>[] = [];
const mountPage = () => {
  const wrapper = mount(SurveyResultsView, { global: { stubs: { ScrollPane: { template: "<div><slot /></div>" } } } });
  wrappers.push(wrapper);
  return wrapper;
};
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll("button").find((item) => item.text() === text)!;

beforeEach(() => {
  mocks.route!.params.id = "7";
  mocks.requestApi.mockReset();
  mocks.success.mockReset();
  mocks.error.mockReset();
  mocks.push.mockReset();
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe("SurveyResultsView", () => {
  it("keeps management author-only, numbers question blocks and loads response details lazily", async () => {
    api(false);
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.text()).not.toContain("编辑问卷");
    expect(wrapper.text()).not.toContain("结束问卷");
    expect(wrapper.text()).toContain("导出 CSV");
    expect(wrapper.findAll("[data-result]").map((item) => item.text())).toEqual(["第 1 题", "第 2 题"]);
    expect(mocks.requestApi.mock.calls.some(([path]) => path.endsWith("/export"))).toBe(false);
    await button(wrapper, "答卷明细").trigger("click");
    await flushPromises();
    expect(wrapper.findAll("tbody tr")).toHaveLength(1);
    expect(wrapper.text()).toContain("张三");
    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/surveys/7/results/export");
  });

  it("preserves submission settings from detail when aggregates omit them", async () => {
    api();
    const wrapper = mountPage();
    await flushPromises();
    await button(wrapper, "结束问卷").trigger("click");
    await flushPromises();
    const update = mocks.requestApi.mock.calls.find(([, options]) => options?.method === "PUT")!;
    expect(JSON.parse(update[1].body)).toMatchObject({ allow_multiple: true, status: "closed" });
  });

  it("keeps the edit draft open after save failure and prevents duplicate saves", async () => {
    api();
    const wrapper = mountPage();
    await flushPromises();
    await button(wrapper, "编辑问卷").trigger("click");
    let reject!: (error: Error) => void;
    mocks.requestApi.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        })
    );
    await button(wrapper, "确定").trigger("click");
    expect(button(wrapper, "确定").attributes("disabled")).toBeDefined();
    reject(new Error("offline"));
    await flushPromises();
    expect(wrapper.find("[data-composer]").exists()).toBe(true);
    expect(button(wrapper, "确定").attributes("disabled")).toBeUndefined();
    expect(mocks.error).toHaveBeenCalledWith("保存失败，请重试");
  });

  it("distinguishes a transient failure and retries the results request", async () => {
    api();
    mocks.requestApi.mockImplementationOnce(async () => jsonResponse(null, false, 500));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.text()).toContain("问卷数据加载失败，请重试");
    await button(wrapper, "重试").trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("问卷数据");
    expect(wrapper.findAll("[data-result]")).toHaveLength(2);
  });

  it("does not associate an old response export with a new survey route", async () => {
    api();
    const wrapper = mountPage();
    await flushPromises();
    let resolve!: (response: unknown) => void;
    mocks.requestApi.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    await button(wrapper, "答卷明细").trigger("click");
    mocks.route!.params.id = "8";
    await flushPromises();
    resolve({ ok: true, blob: async () => ({ text: async () => "ID,用户,时间\n7,旧答题人,昨天\n" }) });
    await flushPromises();
    expect(wrapper.text()).not.toContain("旧答题人");
    expect(wrapper.find('[aria-selected="true"]').text()).toBe("统计汇总");
  });

  it("does not let an old save clear a new save after returning to the same survey", async () => {
    api();
    const wrapper = mountPage();
    await flushPromises();
    await button(wrapper, "编辑问卷").trigger("click");
    let finishOld!: (value: unknown) => void;
    mocks.requestApi.mockImplementationOnce(
      () =>
        new Promise((done) => {
          finishOld = done;
        })
    );
    await button(wrapper, "确定").trigger("click");
    mocks.route!.params.id = "8";
    await flushPromises();
    mocks.route!.params.id = "7";
    await flushPromises();
    await button(wrapper, "编辑问卷").trigger("click");
    let finishNew!: (value: unknown) => void;
    mocks.requestApi.mockImplementationOnce(
      () =>
        new Promise((done) => {
          finishNew = done;
        })
    );
    await button(wrapper, "确定").trigger("click");
    finishOld(jsonResponse({}));
    await flushPromises();
    expect(button(wrapper, "确定").attributes("disabled")).toBeDefined();
    finishNew(jsonResponse({}));
    await flushPromises();
    expect(wrapper.find("[data-composer]").exists()).toBe(false);
  });

  it("uses the existing post detail route", async () => {
    api();
    const wrapper = mountPage();
    await flushPromises();
    await button(wrapper, "查看原帖").trigger("click");
    expect(mocks.push).toHaveBeenCalledWith({ name: "CommentsView", params: { id: 88 } });
  });
});
