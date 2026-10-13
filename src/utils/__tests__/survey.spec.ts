import { describe, expect, it } from "vitest";
import {
  MAX_SURVEY_BLOCKS,
  MAX_SURVEY_UPLOAD_FILES,
  createQuestionBlock,
  normalizeSurveyDraft,
  validateSurveyAnswersClient,
  validateSurveyDraft,
  type SurveyAnswerValue,
  type SurveyDraft,
  type SurveyQuestionBlock,
  type SurveyQuestionConfig,
  type SurveyQuestionType,
} from "@/utils/survey";

const draftWith = (type: SurveyQuestionType, config: SurveyQuestionConfig): SurveyDraft => ({
  allow_multiple: false,
  blocks: [{ ...createQuestionBlock(type), config }],
});

const answerError = (type: SurveyQuestionType, value: SurveyAnswerValue, config?: SurveyQuestionConfig) => {
  const block: SurveyQuestionBlock = { ...createQuestionBlock(type), id: 1, position: 0 };
  if (config) block.config = config;
  return validateSurveyAnswersClient([block], { 1: value });
};

describe("survey draft validation", () => {
  it("retains normalization of empty markdown and duplicate choices", () => {
    const draft = draftWith("multiple", { options: [" A ", "A", "", "B"], max: 2 });
    draft.blocks.unshift({ kind: "markdown", content: "  " });
    const normalized = normalizeSurveyDraft(draft);
    expect(normalized.blocks).toEqual([
      { ...createQuestionBlock("multiple"), config: { options: ["A", "B"], max: 2 } },
    ]);
    expect(validateSurveyDraft(normalized)).toBeNull();
    expect((draft.blocks[1] as { config: SurveyQuestionConfig }).config).toEqual({
      options: [" A ", "A", "", "B"],
      max: 2,
    });
  });

  it("enforces the backend content block limit", () => {
    const draft = draftWith("single", { options: ["A", "B"] });
    draft.blocks.push(
      ...Array.from({ length: MAX_SURVEY_BLOCKS - 1 }, () => ({ kind: "markdown" as const, content: "说明" }))
    );
    expect(validateSurveyDraft(draft)).toBeNull();
    draft.blocks.push({ kind: "markdown", content: "超限" });
    expect(validateSurveyDraft(draft)).toContain(`${MAX_SURVEY_BLOCKS}`);
  });

  it.each([{ min: -1 }, { max: -1 }, { min: 0.5 }, { max: Number.NaN }, { max: 3 }, { min: 2, max: 1 }])(
    "rejects invalid choice limits %j",
    (limits) => {
      expect(validateSurveyDraft(draftWith("multiple", { options: ["A", "B"], ...limits }))).not.toBeNull();
    }
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid text limits %s", (maxLength) => {
    expect(validateSurveyDraft(draftWith("text", { maxLength }))).not.toBeNull();
  });

  it.each([
    { min: Number.NaN },
    { max: Number.POSITIVE_INFINITY },
    { step: 0 },
    { step: Number.NaN },
    { default: -1 },
    { default: 101 },
    { default: Number.NaN },
    { min: 100, max: 0 },
  ])("rejects invalid slider settings %j", (patch) => {
    expect(
      validateSurveyDraft(draftWith("slider", { min: 0, max: 100, step: 1, default: 50, ...patch }))
    ).not.toBeNull();
  });

  it("retains arbitrary in-range slider defaults and large positive steps", () => {
    expect(validateSurveyDraft(draftWith("slider", { min: 0, max: 100, step: 200, default: 2.5 }))).toBeNull();
  });

  it.each([
    { min: 0.5, max: 5 },
    { min: 0, max: 11 },
    { min: 5, max: 5 },
    { min: 0, max: Number.NaN },
  ])("rejects invalid scale bounds %j", (config) => {
    expect(validateSurveyDraft(draftWith("scale", config))).not.toBeNull();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid proportion totals %s", (total) => {
    expect(validateSurveyDraft(draftWith("proportion", { options: ["A", "B"], total }))).not.toBeNull();
  });

  it.each([0, -1, 1.5, MAX_SURVEY_UPLOAD_FILES + 1, Number.NaN])("rejects invalid upload limits %s", (maxCount) => {
    expect(validateSurveyDraft(draftWith("upload", { accept: "file", multiple: true, maxCount }))).not.toBeNull();
  });

  it("rejects unsupported upload modes", () => {
    for (const config of [
      { accept: "video", multiple: false, maxCount: 1 },
      { accept: "file", multiple: "true", maxCount: 1 },
    ]) {
      expect(validateSurveyDraft(draftWith("upload", config as SurveyQuestionConfig))).not.toBeNull();
    }
  });

  it("accepts legal configs for every supported question type", () => {
    for (const type of ["single", "multiple", "text", "ranking", "slider", "proportion", "scale", "upload"] as const) {
      expect(validateSurveyDraft({ allow_multiple: false, blocks: [createQuestionBlock(type)] })).toBeNull();
    }
  });
});

describe("survey answer validation", () => {
  it.each([-1, 2, 0.5, Number.NaN, Number.POSITIVE_INFINITY, "0"])("rejects invalid single choices %s", (value) => {
    expect(answerError("single", value)).not.toBeNull();
  });

  it("rejects duplicate, incomplete and invalid option lists", () => {
    expect(answerError("multiple", [0, 0])).not.toBeNull();
    expect(answerError("multiple", [0, 2])).not.toBeNull();
    expect(answerError("ranking", [0, 0])).not.toBeNull();
    expect(answerError("ranking", [0])).not.toBeNull();
    expect(answerError("ranking", [1, 0])).toBeNull();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 101, "50"])("rejects invalid slider answers %s", (value) => {
    expect(answerError("slider", value)).not.toBeNull();
  });

  it("allows in-range slider values without step alignment and requires integer scale values", () => {
    expect(answerError("slider", 2.5, { min: 0, max: 100, step: 10, default: 50 })).toBeNull();
    expect(answerError("scale", 2.5)).not.toBeNull();
    expect(answerError("scale", 5)).toBeNull();
  });

  it("rejects negative, nonfinite and incomplete proportions", () => {
    for (const value of [[-1, 101], [Number.NaN, 100], [100], [50, 40]]) {
      expect(answerError("proportion", value)).not.toBeNull();
    }
    expect(answerError("proportion", [33.33, 66.67])).toBeNull();
  });

  it("rejects wrong text and upload shapes without throwing", () => {
    expect(answerError("text", 123)).not.toBeNull();
    expect(answerError("upload", [1])).not.toBeNull();
    expect(answerError("upload", [{ url: "", name: "file" }])).not.toBeNull();
    expect(
      answerError("upload", [
        { url: "/a", name: "a" },
        { url: "/b", name: "b" },
      ])
    ).not.toBeNull();
    expect(answerError("upload", [{ url: "/a", name: "a" }])).toBeNull();
  });

  it("preserves optional skips and required answer checks", () => {
    const block: SurveyQuestionBlock = { ...createQuestionBlock("single"), id: 1, position: 0 };
    expect(validateSurveyAnswersClient([block], {})).toBeNull();
    block.required = true;
    expect(validateSurveyAnswersClient([block], {})).toContain("必答");
  });
});
