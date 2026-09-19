import { describe, expect, it } from "vitest";
import {
  buildForumListParams,
  buildSearchRouteQuery,
  extractPostIdToken,
  getSearchTokensFromRouteQuery,
} from "@/utils/forum-search";

describe("forum-search helpers", () => {
  it("serializes mixed tokens into route query", () => {
    expect(buildSearchRouteQuery(["keyword", ":tag", "#42"])).toEqual({
      keyword: "keyword",
      tag: "tag",
      id: "42",
    });
  });

  it("hydrates tokens from route query", () => {
    expect(
      getSearchTokensFromRouteQuery({
        keyword: ["foo", "bar"],
        tag: "baz",
        id: "7",
      })
    ).toEqual(["foo", "bar", ":baz", "#7"]);
  });

  it("builds forum list params without id tokens", () => {
    const params = buildForumListParams(
      { query: ["keyword", ":tag", "#42"], tag: "extra" },
      { begin: 10, limit: 20 }
    );

    expect(params.getAll("keyword")).toEqual(["keyword"]);
    expect(params.getAll("tag")).toEqual(["tag", "extra"]);
    expect(params.get("begin")).toBe("10");
    expect(params.get("limit")).toBe("20");
    expect(extractPostIdToken(["keyword", ":tag", "#42"])).toBe(42);
  });
});
