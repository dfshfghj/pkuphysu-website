import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuotePostDialog from "@/components/blog-center/QuotePostDialog.vue";

const mocks = vi.hoisted(() => ({ requestApi: vi.fn() }));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

const post = (id: number, username: string, text: string) => ({ id, username, text });

const passthrough = (name: string) => defineComponent({ name, template: "<div><slot /></div>" });

const dialogStubs = {
  Dialog: defineComponent({
    name: "Dialog",
    props: { open: { type: Boolean, default: false } },
    template: '<div v-if="open" class="dialog-stub"><slot /></div>',
  }),
  DialogContent: passthrough("DialogContent"),
  DialogHeader: passthrough("DialogHeader"),
  DialogTitle: passthrough("DialogTitle"),
  DialogDescription: passthrough("DialogDescription"),
  DialogFooter: passthrough("DialogFooter"),
};

const mountDialog = () => mount(QuotePostDialog, { props: { visible: true }, global: { stubs: dialogStubs } });

const typeAndSettle = async (wrapper: ReturnType<typeof mountDialog>, value: string) => {
  await wrapper.find("input").setValue(value);
  await vi.advanceTimersByTimeAsync(300);
  await flushPromises();
};

describe("QuotePostDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.requestApi.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初始不展示结果，也不发起请求", () => {
    const wrapper = mountDialog();
    expect(wrapper.findAll(".quote-option")).toHaveLength(0);
    expect(mocks.requestApi).not.toHaveBeenCalled();
  });

  it("输入 #id 直接查该帖", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse(post(45, "张景天", "<p>测试帖子内容</p>")));

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "#45");

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/posts/45");
    const options = wrapper.findAll(".quote-option");
    expect(options).toHaveLength(1);
    expect(options[0].text()).toContain("#45");
    expect(options[0].text()).toContain("张景天");
    expect(options[0].text()).toContain("测试帖子内容");
    expect(options[0].text()).not.toContain("<p>");
  });

  it("纯数字也按 id 处理", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse(post(23, "甲", "<p>内容</p>")));

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "23");

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/posts/23");
  });

  it("关键词走搜索，并带上 limit 与 comment_limit", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([post(1, "甲", "<p>物理</p>"), post(2, "乙", "<p>数学</p>")]));

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "物理");

    expect(mocks.requestApi).toHaveBeenCalledWith(
      "/api/v2/forum/posts?keyword=%E7%89%A9%E7%90%86&limit=8&comment_limit=0"
    );
    expect(wrapper.findAll(".quote-option")).toHaveLength(2);
  });

  it("搜不到时展示空态", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([]));

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "不存在的关键词");

    expect(wrapper.findAll(".quote-option")).toHaveLength(0);
    expect(wrapper.text()).toContain("没有更多");
  });

  it("帖子不存在或不可见时展示空态", async () => {
    mocks.requestApi.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "#999");

    expect(wrapper.findAll(".quote-option")).toHaveLength(0);
    expect(wrapper.text()).toContain("没有更多");
  });

  it("选中后抛出 select 并关闭弹窗", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([post(45, "张景天", "<p>内容</p>")]));

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "内容");

    await wrapper.find(".quote-option").trigger("click");

    expect(wrapper.emitted("select")).toEqual([[45]]);
    expect(wrapper.emitted("update:visible")).toEqual([[false]]);
  });

  it("回车选中第一条结果", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([post(45, "张景天", "<p>内容</p>")]));

    const wrapper = mountDialog();
    await typeAndSettle(wrapper, "内容");

    await wrapper.find("input").trigger("keydown.enter");

    expect(wrapper.emitted("select")).toEqual([[45]]);
  });
});
