import { describe, expect, it } from "vitest";
import { parseSurveyResponsesCsv } from "@/utils/survey-responses";

describe("survey response CSV", () => {
  it("reads BOM, quoted commas, escaped quotes and multiline answers", () => {
    expect(
      parseSurveyResponsesCsv('\uFEFF答卷 ID,答题人,提交时间,第 1 题\r\n1,"张,三",2026-10-13,"第一行\n他说""好"""\r\n')
    ).toEqual({
      headers: ["答卷 ID", "答题人", "提交时间", "第 1 题"],
      rows: [["1", "张,三", "2026-10-13", '第一行\n他说"好"']],
    });
  });

  it("preserves empty answers and zero values", () => {
    expect(parseSurveyResponsesCsv("ID,用户,时间,题1,题2\n1,匿名,,0,\n").rows).toEqual([["1", "匿名", "", "0", ""]]);
  });

  it("handles a header-only export and an empty file", () => {
    expect(parseSurveyResponsesCsv("ID,用户,时间\r\n")).toEqual({ headers: ["ID", "用户", "时间"], rows: [] });
    expect(parseSurveyResponsesCsv("\uFEFF")).toEqual({ headers: [], rows: [] });
  });

  it.each(['ID,用户\n1,"未结束', 'ID,用户\n1,"张"三', "ID,用户\n1,张,多出一列"])(
    "rejects malformed exports without misaligning answers: %s",
    (csv) => {
      expect(() => parseSurveyResponsesCsv(csv)).toThrow();
    }
  );
});
