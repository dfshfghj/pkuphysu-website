import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostPoll from "@/components/blog-center/PostPoll.vue";
import type { Poll } from "@/stores/forum";

const mocks = vi.hoisted(() => ({ requestApi: vi.fn() }));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 1,
  multiple: false,
  voted: false,
  can_see_results: false,
  options: [
    { id: 10, text: "选项甲" },
    { id: 11, text: "选项乙" },
  ],
  ...overrides,
});

const mountPoll = (value: Poll) =>
  mount(PostPoll, { props: { postId: 5, poll: value } });

const voteButton = (wrapper: ReturnType<typeof mountPoll>) =>
  wrapper.findAll("button").find((button) => button.text() === "投票")!;

describe("PostPoll", () => {
  beforeEach(() => {
    mocks.requestApi.mockReset();
  });

  it("未投票且看不到结果时只展示选项，不泄露占比", () => {
    const wrapper = mountPoll(poll());
    expect(wrapper.text()).toContain("选项甲");
    expect(wrapper.text()).toContain("选项乙");
    expect(wrapper.text()).not.toContain("%");
    expect(wrapper.text()).toContain("投票后可见结果");
    expect(voteButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("选中选项后可投票，并把选择提交给后端", async () => {
    const voted = poll({
      voted: true,
      can_see_results: true,
      total_votes: 2,
      options: [
        { id: 10, text: "选项甲", count: 1, percent: 50, selected: true },
        { id: 11, text: "选项乙", count: 1, percent: 50, selected: false },
      ],
    });
    mocks.requestApi.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { message: "投票成功", poll: voted } }),
    });

    const wrapper = mountPoll(poll());
    await wrapper.find("input[value='10']").setValue(true);

    expect(voteButton(wrapper).attributes("disabled")).toBeUndefined();

    await voteButton(wrapper).trigger("click");
    await flushPromises();

    expect(mocks.requestApi).toHaveBeenCalledWith(
      "/api/v2/forum/posts/5/vote",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ option_ids: [10] }),
      })
    );
    expect(wrapper.text()).toContain("50%");
    expect(wrapper.text()).toContain("共 2 人参与");
    expect(wrapper.emitted("voted")).toEqual([[voted]]);
  });

  it("作者未投票时也能看到占比，同时仍可投票", () => {
    const wrapper = mountPoll(
      poll({
        can_see_results: true,
        total_votes: 3,
        options: [
          { id: 10, text: "选项甲", count: 2, percent: 67 },
          { id: 11, text: "选项乙", count: 1, percent: 33 },
        ],
      })
    );

    expect(wrapper.text()).toContain("67%");
    expect(wrapper.text()).toContain("共 3 人参与");
    expect(voteButton(wrapper)).toBeTruthy();
    expect(wrapper.text()).not.toContain("投票后可见结果");
  });

  it("单选下重复选择只保留一个", async () => {
    const wrapper = mountPoll(poll());
    await wrapper.find("input[value='10']").setValue(true);
    await wrapper.find("input[value='11']").setValue(true);

    const checked = wrapper.findAll("input").filter((input) => (input.element as HTMLInputElement).checked);
    expect(checked).toHaveLength(1);
    expect((checked[0].element as HTMLInputElement).value).toBe("11");
  });

  it("多选下可同时选中多个", async () => {
    const wrapper = mountPoll(poll({ multiple: true }));
    await wrapper.find("input[value='10']").setValue(true);
    await wrapper.find("input[value='11']").setValue(true);

    const checked = wrapper.findAll("input").filter((input) => (input.element as HTMLInputElement).checked);
    expect(checked).toHaveLength(2);
  });
});
