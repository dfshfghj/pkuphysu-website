import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SurveyView from "@/pages/survey/SurveyView.vue";
import type { Survey } from "@/utils/survey";

const mocks = vi.hoisted(() => ({
  requestApi: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  route: null as { params: { id: string } } | null,
}));
vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));
vi.mock("vue-sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive({ params: { id: "7" } });
  return { useRoute: () => mocks.route, useRouter: () => ({ push: vi.fn() }) };
});

const Field = defineComponent({
  props: ["block", "modelValue", "disabled", "label"],
  emits: ["update:modelValue", "uploading-change"],
  template: '<div class="field">{{ label }}</div>',
});
const baseSurvey = (extra: Partial<Survey> = {}): Survey => ({
  id: 7,
  post_id: 1,
  question_count: 1,
  status: "open",
  allow_multiple: false,
  is_owner: false,
  can_view_results: false,
  can_edit: false,
  answered: false,
  blocks: [{ id: 10, position: 0, kind: "question", type: "text", required: false, config: { maxLength: 200 } }],
  ...extra,
});
const response = (data: Survey) => ({ ok: true, status: 200, json: async () => ({ data }) });
const wrappers: ReturnType<typeof mount>[] = [];
const mountPage = () => {
  const wrapper = mount(SurveyView, {
    global: {
      stubs: {
        ScrollPane: { template: "<div><slot /></div>" },
        MarkdownRenderer: true,
        SurveyQuestionField: Field,
      },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
};
const button = (wrapper: ReturnType<typeof mountPage>, text: string) =>
  wrapper.findAll("button").find((node) => node.text() === text)!;

describe("SurveyView", () => {
  it("旧路由的详情返回不能覆盖新问卷", async () => {
    let finish!: (value: unknown) => void;
    mocks.requestApi.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const wrapper = mountPage();
    mocks.requestApi.mockResolvedValueOnce(response(baseSurvey({ id: 8, answered: true })));
    mocks.route!.params.id = "8";
    await flushPromises();
    finish(response(baseSurvey()));
    await flushPromises();
    expect(wrapper.text()).toContain("您已提交过");
    expect(wrapper.findComponent(Field).props("disabled")).toBe(true);
  });
  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  });
  beforeEach(() => {
    mocks.route!.params.id = "7";
    mocks.requestApi.mockReset();
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it("allows a fresh response only when repeat submissions are enabled", async () => {
    mocks.requestApi.mockResolvedValueOnce(
      response(baseSurvey({ answered: true, allow_multiple: true, my_answers: { "10": "旧回答" } }))
    );
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.findComponent(Field).props("disabled")).toBe(true);
    await button(wrapper, "再填写一份").trigger("click");
    expect(wrapper.findComponent(Field).props("disabled")).toBe(false);
    expect(wrapper.findComponent(Field).props("modelValue")).toBeUndefined();
    wrapper.findComponent(Field).vm.$emit("update:modelValue", "新回答");
    mocks.requestApi.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await button(wrapper, "提交").trigger("click");
    await flushPromises();
    expect(JSON.parse(mocks.requestApi.mock.calls[1][1].body)).toEqual({
      answers: [{ block_id: 10, value: "新回答" }],
    });
    expect(button(wrapper, "再填写一份").exists()).toBe(true);
  });

  it("keeps single-response and closed surveys locked", async () => {
    mocks.requestApi.mockResolvedValueOnce(response(baseSurvey({ answered: true })));
    const wrapper = mountPage();
    await flushPromises();
    expect(wrapper.text()).not.toContain("再填写一份");
    expect(wrapper.findComponent(Field).props("disabled")).toBe(true);
    wrapper.unmount();
    mocks.requestApi.mockResolvedValueOnce(
      response(baseSurvey({ answered: true, allow_multiple: true, status: "closed" }))
    );
    const closed = mountPage();
    await flushPromises();
    expect(closed.text()).not.toContain("再填写一份");
  });

  it("numbers questions and blocks submission until every upload finishes", async () => {
    mocks.requestApi.mockResolvedValueOnce(response(baseSurvey()));
    const wrapper = mountPage();
    await flushPromises();
    const field = wrapper.findComponent(Field);
    expect(field.props("label")).toBe("第 1 题");
    field.vm.$emit("uploading-change", true);
    await flushPromises();
    expect(button(wrapper, "文件上传中...").attributes("disabled")).toBeDefined();
    await button(wrapper, "文件上传中...").trigger("click");
    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
    field.vm.$emit("uploading-change", false);
    await flushPromises();
    expect(button(wrapper, "提交").attributes("disabled")).toBeUndefined();
  });

  it("ignores a response submitted on the previous route", async () => {
    mocks.requestApi.mockResolvedValueOnce(response(baseSurvey()));
    const wrapper = mountPage();
    await flushPromises();
    let resolve!: (value: unknown) => void;
    mocks.requestApi.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    await button(wrapper, "提交").trigger("click");
    mocks.requestApi.mockResolvedValueOnce(response(baseSurvey({ id: 8 })));
    mocks.route!.params.id = "8";
    await flushPromises();
    resolve({ ok: true, json: async () => ({}) });
    await flushPromises();
    expect(wrapper.text()).not.toContain("您已提交过");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(button(wrapper, "提交").attributes("disabled")).toBeUndefined();
  });
});
