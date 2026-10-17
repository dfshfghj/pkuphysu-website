import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EditorGuide from "@/pages/blog-center/EditorGuide.vue";
import { useOnboardingStore } from "@/stores/onboarding";

const mocks = vi.hoisted(() => ({
  route: null as any,
  insertValue: vi.fn(),
  getValue: vi.fn(),
  push: vi.fn(),
  narrow: false,
}));
vi.mock("@vueuse/core", async () => {
  const actual = await vi.importActual<typeof import("@vueuse/core")>("@vueuse/core");
  const { ref } = await import("vue");
  return { ...actual, useMediaQuery: () => ref(mocks.narrow) };
});
vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive({ query: {} });
  return { useRoute: () => mocks.route, useRouter: () => ({ replace: vi.fn(), push: mocks.push }) };
});
vi.mock("@/stores/user", () => ({ useUserStore: () => ({ userid: "42", isLoggedIn: true }) }));
const editorStub = {
  name: "MarkdownEditor",
  props: ["modelValue", "toolbar", "extraToolbar", "cacheEnabled", "highlightToolbarItem"],
  setup(_: unknown, { expose }: any) {
    expose({ vditor: { insertValue: mocks.insertValue, getValue: mocks.getValue } });
  },
  template: '<div class="practice-editor" />',
};
const quoteDialogStub = {
  name: "QuotePostDialog",
  props: ["visible"],
  emits: ["update:visible", "select"],
  template: "<div />",
};
const pollDialogStub = {
  name: "PollComposerDialog",
  props: ["visible", "initial"],
  emits: ["update:visible", "confirm"],
  template: "<div />",
};
const surveyDialogStub = {
  name: "SurveyComposerDialog",
  props: ["visible", "initial"],
  emits: ["update:visible", "confirm"],
  template: "<div />",
};
const mountGuide = () =>
  mount(EditorGuide, {
    global: {
      stubs: {
        MarkdownEditor: editorStub,
        QuotePostDialog: quoteDialogStub,
        PollComposerDialog: pollDialogStub,
        SurveyComposerDialog: surveyDialogStub,
        ScrollPane: { template: "<div><slot /></div>" },
        RouterLink: { template: "<a><slot /></a>" },
      },
    },
  });
enableAutoUnmount(afterEach);
beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  mocks.route.query = {};
  mocks.insertValue.mockReset();
  mocks.getValue.mockReset().mockReturnValue("练习内容");
  mocks.push.mockReset();
  mocks.narrow = false;
});

it("matches the real mobile post toolbar including uploads", async () => {
  mocks.narrow = true;
  const wrapper = mountGuide();
  await flushPromises();
  const toolbar = wrapper.findComponent(editorStub).props("toolbar") as any[];
  expect(toolbar.map((item) => (typeof item === "string" ? item : item.name))).toEqual(["upload", "|", "undo", "redo"]);
  expect(wrapper.findAll("button").some((button) => button.text() === "文字格式")).toBe(false);
  expect(wrapper.text()).toContain("手机发帖工具栏保留");
});

it("opens a practice post editor with draft caching disabled and no publishing control", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  expect(wrapper.text()).toContain("编辑器工具栏教程");
  const editor = wrapper.findComponent(editorStub);
  expect(editor.props("cacheEnabled")).toBe(false);
  expect(editor.props("toolbar")).toContain("upload");
  expect((editor.props("extraToolbar") as any[]).filter((x) => x.name).map((x) => x.name)).toEqual([
    "quote-post",
    "poll",
    "survey",
  ]);
  expect(wrapper.text()).toContain("不会发布");
  expect(wrapper.findAll("button").some((button) => ["发布", "发送"].includes(button.text()))).toBe(false);
});

it("opens the real quote picker and inserts the chosen post", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  const editor = wrapper.findComponent(editorStub);
  (editor.props("extraToolbar") as any[]).find((x) => x.name === "quote-post").click();
  await flushPromises();
  const dialog = wrapper.findComponent(quoteDialogStub);
  expect(dialog.props("visible")).toBe(true);
  dialog.vm.$emit("select", { source: "treehole", id: 88 });
  expect(mocks.insertValue).toHaveBeenCalledWith(expect.stringContaining("[#88](/treehole/88)"));
});

it("configures polls and surveys locally without a submit control", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  const editor = wrapper.findComponent(editorStub);
  const extraToolbar = editor.props("extraToolbar") as any[];

  extraToolbar.find((x) => x.name === "poll").click();
  await flushPromises();
  const pollDialog = wrapper.findComponent(pollDialogStub);
  expect(pollDialog.props("visible")).toBe(true);
  pollDialog.vm.$emit("confirm", { multiple: true, options: ["甲", "乙"] });
  await flushPromises();
  expect(wrapper.text()).toContain("投票 · 多选");
  expect(wrapper.text()).toContain("甲");

  extraToolbar.find((x) => x.name === "survey").click();
  await flushPromises();
  const surveyDialog = wrapper.findComponent(surveyDialogStub);
  expect(surveyDialog.props("visible")).toBe(true);
  surveyDialog.vm.$emit("confirm", {
    allow_multiple: false,
    blocks: [{ kind: "question", type: "single", required: true, config: { options: ["A", "B"] } }],
  });
  await flushPromises();
  expect(wrapper.text()).toContain("问卷 · 1 题");
  expect(wrapper.text()).toContain("单选");
  expect(wrapper.findAll("button").some((button) => ["发布", "发送"].includes(button.text()))).toBe(false);
});

it("uses the comment toolbar without post-only features", async () => {
  mocks.route.query = { editor: "comment" };
  const wrapper = mountGuide();
  await flushPromises();
  const editor = wrapper.findComponent(editorStub);
  expect((editor.props("extraToolbar") as any[]).filter((x) => x.name).map((x) => x.name)).toEqual(["quote-post"]);
  expect(wrapper.text()).toContain("点击一条评论");
  expect(wrapper.text()).not.toContain("发起投票");
});

it("completes the account's tutorial and returns home", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  await wrapper.get('[data-action="complete-guide"]').trigger("click");
  expect(localStorage.getItem("onboarding:v1:42")).toBe("completed");
  expect(useOnboardingStore().accountId).toBe("42");
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith({ name: "PostsView" });
});
