import { buildPostQuoteMarkdown } from "@/utils/post-quote";
import { buildTreeholeQuoteMarkdown } from "@/utils/treehole-quote";

export type QuoteSource = "forum" | "treehole";

export interface QuoteSelection {
  source: QuoteSource;
  id: number;
}

export const buildQuoteMarkdown = ({ source, id }: QuoteSelection): string =>
  source === "treehole" ? buildTreeholeQuoteMarkdown(id) : buildPostQuoteMarkdown(id);

export const QUOTE_POST_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <rect x="4" y="5" width="2.5" height="2.5" rx="0.6" fill="currentColor"/>
  <rect x="7.5" y="5" width="4.5" height="1.4" rx="0.7" fill="currentColor"/>
  <rect x="4" y="9" width="8" height="1.4" rx="0.7" fill="currentColor"/>
</svg>`;

export const createQuotePostToolbarItem = (onClick: () => void) => ({
  name: "quote-post",
  tip: "引用帖子",
  icon: QUOTE_POST_ICON,
  click: onClick,
});
