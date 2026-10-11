export type SurveyQuestionType =
  | "single"
  | "multiple"
  | "text"
  | "ranking"
  | "slider"
  | "proportion"
  | "scale";

export interface SurveyChoiceConfig {
  options: string[];
  min?: number;
  max?: number;
}

export interface SurveyTextConfig {
  placeholder?: string;
  maxLength: number;
}

export interface SurveySliderConfig {
  min: number;
  max: number;
  step: number;
  default: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface SurveyProportionConfig {
  options: string[];
  total: number;
}

export interface SurveyScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export type SurveyQuestionConfig =
  | SurveyChoiceConfig
  | SurveyTextConfig
  | SurveySliderConfig
  | SurveyProportionConfig
  | SurveyScaleConfig;

export interface SurveyMarkdownDraftBlock {
  kind: "markdown";
  content: string;
}

export interface SurveyQuestionDraftBlock {
  kind: "question";
  type: SurveyQuestionType;
  required: boolean;
  config: SurveyQuestionConfig;
}

export type SurveyDraftBlock = SurveyMarkdownDraftBlock | SurveyQuestionDraftBlock;

export interface SurveyDraft {
  allow_multiple: boolean;
  blocks: SurveyDraftBlock[];
}

export interface SurveyMarkdownBlock extends SurveyMarkdownDraftBlock {
  id: number;
  position: number;
  content_html?: string;
}

export interface SurveyQuestionBlock extends SurveyQuestionDraftBlock {
  id: number;
  position: number;
}

export type SurveyBlock = SurveyMarkdownBlock | SurveyQuestionBlock;

export interface SurveySummary {
  id: number;
  question_count: number;
  status: string;
  allow_multiple: boolean;
  is_owner: boolean;
  can_view_results: boolean;
  response_count?: number;
}

export interface Survey extends SurveySummary {
  answered: boolean;
  can_edit: boolean;
  post_id: number;
  my_answers?: Record<string, SurveyAnswerValue>;
  blocks: SurveyBlock[];
}

export interface SurveyResultsOption {
  text: string;
  count?: number;
  percent?: number;
  average_rank?: number;
  average?: number;
}

export interface SurveyMarkdownResultBlock {
  id: number;
  kind: "markdown";
  content: string;
  content_html?: string;
  position?: number;
}

export interface SurveyQuestionResultBlock {
  id: number;
  kind: "question";
  type: SurveyQuestionType;
  required: boolean;
  config: SurveyQuestionConfig;
  position?: number;
  answered: number;
  options?: SurveyResultsOption[];
  values?: { value: number; count: number; percent: number }[];
  texts?: { username: string; text: string }[];
  buckets?: { from: number; to: number; count: number }[];
  average?: number;
  min?: number;
  max?: number;
  total?: number;
  unit?: string;
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

export type SurveyResultBlock = SurveyMarkdownResultBlock | SurveyQuestionResultBlock;

export interface SurveyResults {
  id: number;
  status: string;
  allow_multiple: boolean;
  response_count: number;
  post_id: number;
  blocks: SurveyResultBlock[];
}

export type SurveyAnswerValue = number | number[] | string;

export const SURVEY_QUESTION_TYPES: { value: SurveyQuestionType; label: string }[] = [
  { value: "single", label: "单选" },
  { value: "multiple", label: "多选" },
  { value: "text", label: "简答" },
  { value: "ranking", label: "排序" },
  { value: "slider", label: "滑动条" },
  { value: "proportion", label: "比重条" },
  { value: "scale", label: "量表" },
];

export const SURVEY_STATUS_LABELS: Record<string, string> = {
  open: "进行中",
  closed: "已结束",
};

export const MIN_SURVEY_OPTIONS = 2;
export const MAX_SURVEY_OPTIONS = 50;
export const MAX_SURVEY_SCALE_SPAN = 10;

export const createDefaultConfig = (type: SurveyQuestionType): SurveyQuestionConfig => {
  switch (type) {
    case "single":
    case "ranking":
      return { options: ["选项1", "选项2"] };
    case "multiple":
      return { options: ["选项1", "选项2"] };
    case "text":
      return { placeholder: "", maxLength: 200 };
    case "slider":
      return { min: 0, max: 100, step: 1, default: 50, minLabel: "", maxLabel: "" };
    case "proportion":
      return { options: ["选项1", "选项2"], total: 100 };
    case "scale":
      return { min: 1, max: 5, minLabel: "", maxLabel: "" };
  }
};

export const initialProportionValues = (config: SurveyProportionConfig): number[] => {
  const count = config.options.length;
  if (count <= 0) return [];
  const total = config.total;
  const base = Math.floor(total / count);
  const values = config.options.map(() => base);
  values[count - 1] = total - base * (count - 1);
  return values;
};

export const createMarkdownBlock = (): SurveyMarkdownDraftBlock => ({ kind: "markdown", content: "" });

export const createQuestionBlock = (type: SurveyQuestionType = "single"): SurveyQuestionDraftBlock => ({
  kind: "question",
  type,
  required: false,
  config: createDefaultConfig(type),
});

export const isMarkdownBlock = (block: SurveyDraftBlock | SurveyBlock): block is SurveyMarkdownDraftBlock =>
  block.kind === "markdown";

export const isQuestionBlock = (block: SurveyDraftBlock | SurveyBlock): block is SurveyQuestionDraftBlock =>
  block.kind === "question";

export const countQuestionBlocks = (blocks: SurveyDraftBlock[] | SurveyBlock[]): number =>
  blocks.filter((block) => isQuestionBlock(block)).length;

export const questionHasOptions = (type: SurveyQuestionType) =>
  type === "single" || type === "multiple" || type === "ranking" || type === "proportion";

export const normalizeOptions = (options: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of options) {
    const text = (raw ?? "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
};

const normalizeQuestionBlock = (block: SurveyQuestionDraftBlock): SurveyQuestionDraftBlock => {
  const config = { ...block.config } as SurveyQuestionConfig;
  if (questionHasOptions(block.type)) {
    (config as SurveyChoiceConfig | SurveyProportionConfig).options = normalizeOptions(
      (config as SurveyChoiceConfig | SurveyProportionConfig).options
    );
  }
  return { kind: "question", type: block.type, required: block.required, config };
};

export const normalizeSurveyDraft = (draft: SurveyDraft): SurveyDraft => ({
  allow_multiple: draft.allow_multiple,
  blocks: draft.blocks.reduce<SurveyDraftBlock[]>((acc, block) => {
    if (isMarkdownBlock(block)) {
      const content = block.content.trim();
      if (content) acc.push({ kind: "markdown", content });
      return acc;
    }
    acc.push(normalizeQuestionBlock(block));
    return acc;
  }, []),
});

export const validateSurveyDraft = (draft: SurveyDraft): string | null => {
  const questions = draft.blocks.filter(isQuestionBlock);
  if (questions.length === 0) return "至少需要一道题目";

  let ordinal = 0;
  for (const block of draft.blocks) {
    if (!isQuestionBlock(block)) continue;
    ordinal += 1;
    const label = `第 ${ordinal} 题`;

    if (questionHasOptions(block.type)) {
      const options = normalizeOptions((block.config as SurveyChoiceConfig).options);
      if (options.length < MIN_SURVEY_OPTIONS) return `${label}至少需要 ${MIN_SURVEY_OPTIONS} 个选项`;
      if (options.length > MAX_SURVEY_OPTIONS) return `${label}最多 ${MAX_SURVEY_OPTIONS} 个选项`;
    }

    if (block.type === "multiple") {
      const config = block.config as SurveyChoiceConfig;
      const options = normalizeOptions(config.options);
      const min = config.min ?? 0;
      const max = config.max ?? 0;
      if (min > options.length) return `${label}的最少选择数超过选项数`;
      if (max > 0 && min > max) return `${label}的最少选择数不能大于最多选择数`;
    }

    if (block.type === "slider") {
      const config = block.config as SurveySliderConfig;
      if (config.max <= config.min) return `${label}的最大值必须大于最小值`;
      if (config.step <= 0) return `${label}的步长必须大于 0`;
    }

    if (block.type === "scale") {
      const config = block.config as SurveyScaleConfig;
      if (config.max <= config.min) return `${label}的最大值必须大于最小值`;
      if (config.max - config.min > MAX_SURVEY_SCALE_SPAN)
        return `${label}的档位不能超过 ${MAX_SURVEY_SCALE_SPAN + 1} 档`;
    }
  }

  return null;
};

export const isSurveyAnswerEmpty = (value: SurveyAnswerValue | undefined | null): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export const validateSurveyAnswersClient = (
  blocks: SurveyBlock[],
  answers: Record<number, SurveyAnswerValue>
): string | null => {
  let ordinal = 0;
  for (const block of blocks) {
    if (!isQuestionBlock(block)) continue;
    ordinal += 1;
    const label = `第 ${ordinal} 题`;
    const value = answers[block.id];
    const empty = isSurveyAnswerEmpty(value);
    if (empty) {
      if (block.required) return `${label}为必答`;
      continue;
    }

    if (block.type === "multiple") {
      const config = block.config as SurveyChoiceConfig;
      const selected = value as number[];
      if (config.min && selected.length < config.min) return `${label}至少选择 ${config.min} 项`;
      if (config.max && selected.length > config.max) return `${label}最多选择 ${config.max} 项`;
    }

    if (block.type === "ranking") {
      const config = block.config as SurveyChoiceConfig;
      if ((value as number[]).length !== config.options.length) return `${label}需要为全部选项排序`;
    }

    if (block.type === "text") {
      const config = block.config as SurveyTextConfig;
      if ((value as string).trim().length > config.maxLength) return `${label}不能超过 ${config.maxLength} 个字符`;
    }

    if (block.type === "proportion") {
      const config = block.config as SurveyProportionConfig;
      const sum = (value as number[]).reduce((total, item) => total + item, 0);
      if (Math.abs(sum - config.total) > 0.01) return `${label}的比重之和必须等于 ${config.total}`;
    }
  }

  return null;
};

const SURVEY_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 1.75h8a1.25 1.25 0 0 1 1.25 1.25v10A1.25 1.25 0 0 1 12 14.25H4A1.25 1.25 0 0 1 2.75 13V3A1.25 1.25 0 0 1 4 1.75Z" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

export const createSurveyToolbarItem = (onClick: () => void) => ({
  name: "survey",
  tip: "发起问卷",
  icon: SURVEY_ICON,
  click: onClick,
});
