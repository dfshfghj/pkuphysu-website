import { createQuotePostToolbarItem } from "@/utils/quote";
import { createPollToolbarItem } from "@/utils/poll";
import { createSurveyToolbarItem } from "@/utils/survey";

export const DEFAULT_EDITOR_TOOLBAR: (string | Record<string, unknown>)[] = [
  "headings",
  "bold",
  "italic",
  "strike",
  "link",
  "|",
  "list",
  "ordered-list",
  "check",
  "code",
  "table",
  "upload",
  "|",
  "undo",
  "redo",
  "|",
  "edit-mode",
  { name: "more", toolbar: ["both", "export", "outline"] },
];
export const POST_MOBILE_TOOLBAR = ["upload", "|", "undo", "redo"];
export const postExtraToolbar = (quote: () => void, poll: () => void, survey: () => void) => [
  "|",
  createQuotePostToolbarItem(quote),
  createPollToolbarItem(poll),
  createSurveyToolbarItem(survey),
];
export const commentExtraToolbar = (quote: () => void) => ["|", createQuotePostToolbarItem(quote)];
