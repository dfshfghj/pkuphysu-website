import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearUserSearchCache, searchUsers } from "@/utils/user-search";

const mocks = vi.hoisted(() => ({ requestApi: vi.fn() }));

vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));

const okResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

describe("用户搜索（@提及 自动补全）", () => {
  beforeEach(() => {
    clearUserSearchCache();
    mocks.requestApi.mockReset();
  });

  it("空关键词返回默认推荐列表", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([{ id: 1, username: "甲", verified: true }]));

    const users = await searchUsers("   ");

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/users/search?q=&limit=8");
    expect(users).toEqual([{ id: 1, username: "甲", verified: true }]);
  });

  it("按前缀请求并返回用户", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([{ id: 7, username: "甲", verified: true }]));

    const users = await searchUsers("甲");

    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/users/search?q=%E7%94%B2&limit=8");
    expect(users).toEqual([{ id: 7, username: "甲", verified: true }]);
  });

  it("命中缓存不重复请求", async () => {
    mocks.requestApi.mockResolvedValueOnce(okResponse([{ id: 7, username: "甲", verified: true }]));

    await searchUsers("甲");
    await searchUsers("甲");

    expect(mocks.requestApi).toHaveBeenCalledTimes(1);
  });

  it("请求失败返回空数组且不抛异常", async () => {
    mocks.requestApi.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(searchUsers("甲")).resolves.toEqual([]);

    errorSpy.mockRestore();
  });
});
