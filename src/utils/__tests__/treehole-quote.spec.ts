import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTreeholeQuoteMarkdown,
  buildTreeholeSiteUrl,
  clearTreeholeQuoteCache,
  extractQuotedTreeholeId,
  getCachedTreeholeQuote,
  loadTreeholeQuotes,
  parseTreeholeQuoteLink,
} from "@/utils/treehole-quote";

const mocks = vi.hoisted(() => ({ requestApi: vi.fn() }));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

describe("树洞引用标记语法", () => {
  it("生成标准 markdown 链接", () => {
    expect(buildTreeholeQuoteMarkdown(45)).toBe("[#45](/treehole/45)");
  });

  it("从 href 解析树洞帖子 id", () => {
    expect(extractQuotedTreeholeId("/treehole/45")).toBe(45);
    expect(extractQuotedTreeholeId("  /treehole/45  ")).toBe(45);
    expect(extractQuotedTreeholeId("/treehole/45/")).toBe(45);
  });

  it("非树洞链接不解析出 id", () => {
    expect(extractQuotedTreeholeId("/45")).toBeNull();
    expect(extractQuotedTreeholeId("/treehole/abc")).toBeNull();
    expect(extractQuotedTreeholeId("/treehole/45?x=1")).toBeNull();
    expect(extractQuotedTreeholeId("/treehole/")).toBeNull();
    expect(extractQuotedTreeholeId("")).toBeNull();
    expect(extractQuotedTreeholeId(null)).toBeNull();
    expect(extractQuotedTreeholeId(undefined)).toBeNull();
  });

  it("文字与 href 都符合才算树洞引用标记", () => {
    expect(parseTreeholeQuoteLink("#45", "/treehole/45")).toBe(45);
    expect(parseTreeholeQuoteLink("引用 #45", "/treehole/45")).toBe(45);
    expect(parseTreeholeQuoteLink("#45", "/45")).toBeNull();
    expect(parseTreeholeQuoteLink("看这个", "/treehole/45")).toBeNull();
  });
});

describe("树洞外部站点地址", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_TREEHOLE_URL", "https://treehole.pkuphysu.cn");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("带 pid 时拼成 ?post=%23<pid>", () => {
    expect(buildTreeholeSiteUrl("/treehole/8585931")).toBe("https://treehole.pkuphysu.cn?post=%238585931");
  });

  it("无 pid 时指向站点首页", () => {
    expect(buildTreeholeSiteUrl("/treehole")).toBe("https://treehole.pkuphysu.cn");
    expect(buildTreeholeSiteUrl("/treehole/search/x")).toBe("https://treehole.pkuphysu.cn");
  });
});

describe("加载树洞引用信息", () => {
  beforeEach(() => {
    clearTreeholeQuoteCache();
    mocks.requestApi.mockReset();
  });

  it("逐条取单帖并写入缓存，不带作者字段", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse({ pid: 45, text: "<p>树洞正文</p>", timestamp: 1790782994 }));

    await loadTreeholeQuotes([45]);

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/dev/chapi/api/v3/hole/get?pid=45");
    const quote = getCachedTreeholeQuote(45);
    expect(quote?.available).toBe(true);
    expect(quote?.excerpt).toContain("树洞正文");
    expect(quote && "username" in quote).toBe(false);
  });

  it("命中缓存不再重复请求", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse({ pid: 45, text: "x" }));

    await loadTreeholeQuotes([45]);
    await loadTreeholeQuotes([45]);

    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
  });

  it("帖子不存在（data 为 null）记为不可见，避免反复重试", async () => {
    mocks.requestApi.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ code: 40400, data: null, success: false, message: "树洞不存在" }),
    });

    await loadTreeholeQuotes([999]);

    expect(getCachedTreeholeQuote(999)).toEqual({ id: 999, available: false });

    await loadTreeholeQuotes([999]);
    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
  });

  it("其它错误不写缓存", async () => {
    mocks.requestApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadTreeholeQuotes([45])).resolves.toBeUndefined();

    expect(getCachedTreeholeQuote(45)).toBeUndefined();
    errorSpy.mockRestore();
  });
});
