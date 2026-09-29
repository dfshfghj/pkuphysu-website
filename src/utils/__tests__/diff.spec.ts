import { describe, expect, it } from "vitest";
import { diffStats, lineDiff } from "@/utils/diff";

describe("lineDiff", () => {
  it("标记新增、删除与未变行", () => {
    const lines = lineDiff("# 标题\n原文\n结尾", "# 标题\n新文\n结尾");
    expect(lines).toEqual([
      { type: "same", text: "# 标题" },
      { type: "del", text: "原文" },
      { type: "add", text: "新文" },
      { type: "same", text: "结尾" },
    ]);
  });

  it("处理纯新增和纯删除", () => {
    expect(lineDiff("", "a\nb").map((l) => l.text)).toEqual(["a", "b"]);
    expect(lineDiff("a\nb", "").map((l) => l.type)).toEqual(["del", "del"]);
  });

  it("相同文本没有差异", () => {
    const lines = lineDiff("a\nb", "a\nb");
    expect(lines.every((l) => l.type === "same")).toBe(true);
    expect(diffStats(lines)).toEqual({ added: 0, removed: 0 });
  });

  it("统计增删行数", () => {
    expect(diffStats(lineDiff("a\nb\nc", "a\nc\nd"))).toEqual({ added: 1, removed: 1 });
  });
});
