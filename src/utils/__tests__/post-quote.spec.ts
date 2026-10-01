import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPostQuoteMarkdown,
  clearPostQuoteCache,
  extractQuotedPostId,
  getCachedPostQuote,
  isPostQuoteText,
  loadPostQuotes,
  parsePostQuoteLink,
} from "@/utils/post-quote";

const mocks = vi.hoisted(() => ({ requestApi: vi.fn() }));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

describe("引用标记语法", () => {
  it("生成标准 markdown 链接", () => {
    expect(buildPostQuoteMarkdown(45)).toBe("[#45](/45)");
  });

  it("从 href 解析帖子 id", () => {
    expect(extractQuotedPostId("/45")).toBe(45);
    expect(extractQuotedPostId("  /45  ")).toBe(45);
    expect(extractQuotedPostId("/45/")).toBe(45);
  });

  it("非帖子链接不解析出 id", () => {
    expect(extractQuotedPostId("/u/45")).toBeNull();
    expect(extractQuotedPostId("/45?x=1")).toBeNull();
    expect(extractQuotedPostId("#45")).toBeNull();
    expect(extractQuotedPostId("https://example.com/45")).toBeNull();
    expect(extractQuotedPostId("/abc")).toBeNull();
    expect(extractQuotedPostId("")).toBeNull();
    expect(extractQuotedPostId(null)).toBeNull();
    expect(extractQuotedPostId(undefined)).toBeNull();
  });

  it("识别 `#id` 与手写的「引用 #id」链接文字", () => {
    expect(isPostQuoteText("#45")).toBe(true);
    expect(isPostQuoteText("  #45  ")).toBe(true);
    expect(isPostQuoteText("引用 #45")).toBe(true);
    expect(isPostQuoteText("引用#45")).toBe(true);
    expect(isPostQuoteText("引用 #45 这条")).toBe(false);
    expect(isPostQuoteText("#45 这条")).toBe(false);
    expect(isPostQuoteText("看这个")).toBe(false);
    expect(isPostQuoteText("#abc")).toBe(false);
    expect(isPostQuoteText("")).toBe(false);
  });

  it("文字与 href 都符合才算引用标记", () => {
    expect(parsePostQuoteLink("#45", "/45")).toBe(45);
    expect(parsePostQuoteLink("引用 #45", "/45")).toBe(45);
    // 文字对但 href 不是站内帖子
    expect(parsePostQuoteLink("#45", "https://example.com/45")).toBeNull();
    // href 是站内帖子但文字不是引用 —— 作者手写的普通链接不能被劫持成引用
    expect(parsePostQuoteLink("看这个", "/45")).toBeNull();
    expect(parsePostQuoteLink("#45 这条", "/45")).toBeNull();
  });
});

describe("批量加载引用信息", () => {
  beforeEach(() => {
    clearPostQuoteCache();
    mocks.requestApi.mockReset();
  });

  it("一次请求多个 id 并写入缓存", async () => {
    mocks.requestApi.mockResolvedValueOnce(
      okResponse([
        { id: 45, available: true, username: "甲", excerpt: "内容" },
        { id: 23, available: true, username: "乙", excerpt: "内容" },
      ])
    );

    await loadPostQuotes([45, 23]);

    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/forum/post-quotes?ids=45%2C23");
    expect(getCachedPostQuote(45)?.username).toBe("甲");
    expect(getCachedPostQuote(23)?.username).toBe("乙");
  });

  it("命中缓存不再重复请求", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([{ id: 45, available: true, username: "甲" }]));

    await loadPostQuotes([45]);
    await loadPostQuotes([45]);

    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
  });

  it("接口没返回的 id 记为不可见，避免反复重试", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([{ id: 45, available: true, username: "甲" }]));

    await loadPostQuotes([45, 999]);

    expect(getCachedPostQuote(999)).toEqual({ id: 999, available: false });
    expect(mocks.requestApi).toHaveBeenCalledTimes(1);

    await loadPostQuotes([999]);
    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
  });

  it("请求失败不抛异常，也不写入缓存", async () => {
    mocks.requestApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadPostQuotes([45])).resolves.toBeUndefined();

    expect(getCachedPostQuote(45)).toBeUndefined();
    errorSpy.mockRestore();
  });
});
