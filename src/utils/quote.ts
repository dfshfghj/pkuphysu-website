import { buildPostQuoteMarkdown } from "@/utils/post-quote";
import { buildTreeholeQuoteMarkdown } from "@/utils/treehole-quote";

export type QuoteSource = "forum" | "treehole";

export interface QuoteSelection {
  source: QuoteSource;
  id: number;
}

export const buildQuoteMarkdown = ({ source, id }: QuoteSelection): string =>
  source === "treehole" ? buildTreeholeQuoteMarkdown(id) : buildPostQuoteMarkdown(id);
