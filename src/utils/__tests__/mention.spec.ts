import { describe, expect, it } from "vitest";
import { buildMentionMarkdown, parseMentionLink } from "@/utils/mention";

describe("提及标记语法", () => {
  it("生成标准 markdown 链接", () => {
    expect(buildMentionMarkdown("username", 1)).toBe("[@username](/u/1)");
  });

  it("文字与 href 都符合才算提及", () => {
    expect(parseMentionLink("@username", "/u/1")).toBe(1);
    expect(parseMentionLink("  @username  ", "/u/1/")).toBe(1);
  });

  it("href 不是用户主页时不算提及", () => {
    expect(parseMentionLink("@username", "/45")).toBeNull();
    expect(parseMentionLink("@username", "/treehole/1")).toBeNull();
    expect(parseMentionLink("@username", "/user/1")).toBeNull();
    expect(parseMentionLink("@username", "https://example.com/u/1")).toBeNull();
    expect(parseMentionLink("@username", null)).toBeNull();
  });

  it("文字不是 @用户名 时不算提及", () => {
    expect(parseMentionLink("看这个", "/u/1")).toBeNull();
    expect(parseMentionLink("@username a", "/u/1")).toBeNull();
    expect(parseMentionLink("", "/u/1")).toBeNull();
    expect(parseMentionLink(null, "/u/1")).toBeNull();
  });

  it("引用标记不会被当成提及", () => {
    expect(parseMentionLink("#45", "/45")).toBeNull();
  });
});
