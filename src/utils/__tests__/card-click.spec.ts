import { describe, expect, it } from "vitest";
import { shouldIgnoreCardClick } from "@/utils";

const eventOn = (el: Element) => ({ target: el }) as unknown as MouseEvent;

describe("shouldIgnoreCardClick", () => {
  it("忽略链接与按钮上的点击", () => {
    const link = document.createElement("a");
    const button = document.createElement("button");
    document.body.append(link, button);

    expect(shouldIgnoreCardClick(eventOn(link))).toBe(true);
    expect(shouldIgnoreCardClick(eventOn(button))).toBe(true);
  });

  it("忽略链接内部元素的点击", () => {
    const link = document.createElement("a");
    const span = document.createElement("span");
    link.appendChild(span);
    document.body.appendChild(link);

    expect(shouldIgnoreCardClick(eventOn(span))).toBe(true);
  });

  it("无选中文本时允许卡片点击", () => {
    const span = document.createElement("span");
    document.body.appendChild(span);

    expect(shouldIgnoreCardClick(eventOn(span))).toBe(false);
  });

  it("存在选中文本时忽略卡片点击", () => {
    const span = document.createElement("span");
    span.textContent = "hello";
    document.body.appendChild(span);

    const range = document.createRange();
    range.selectNodeContents(span);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(shouldIgnoreCardClick(eventOn(span))).toBe(true);
    selection.removeAllRanges();
  });
});
