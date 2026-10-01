import { requestApi } from "@/api/api";

export interface PostQuote {
  id: number;
  available: boolean;
  userid?: number;
  username?: string;
  text?: string;
  excerpt?: string;
  timestamp?: number;
}

const POST_HREF_PATTERN = /^\/\s*(\d+)\s*\/?$/;
const QUOTE_TEXT_PATTERN = /^(?:引用\s*)?#\d+$/;

export const buildPostQuoteMarkdown = (id: number) => `[#${id}](/${id})`;

export const extractQuotedPostId = (href: string | null | undefined): number | null => {
  if (!href) {
    return null;
  }

  const match = POST_HREF_PATTERN.exec(href.trim());
  return match ? Number(match[1]) : null;
};

export const isPostQuoteText = (text: string | null | undefined): boolean => {
  if (!text) {
    return false;
  }
  return QUOTE_TEXT_PATTERN.test(text.trim());
};

export const parsePostQuoteLink = (
  text: string | null | undefined,
  href: string | null | undefined
): number | null => {
  if (!isPostQuoteText(text)) {
    return null;
  }
  return extractQuotedPostId(href);
};

const quoteCache = new Map<number, PostQuote>();
const inflight = new Map<number, Promise<void>>();

export const getCachedPostQuote = (id: number) => quoteCache.get(id);

export const clearPostQuoteCache = () => {
  quoteCache.clear();
  inflight.clear();
};

const requestPostQuotes = async (ids: number[]): Promise<void> => {
  const params = new URLSearchParams({ ids: ids.join(",") });

  const res = await requestApi(`/api/v2/forum/post-quotes?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const result = await res.json();
  const list: PostQuote[] = Array.isArray(result?.data) ? result.data : [];

  for (const quote of list) {
    if (typeof quote?.id === "number") {
      quoteCache.set(quote.id, quote);
    }
  }

  for (const id of ids) {
    if (!quoteCache.has(id)) {
      quoteCache.set(id, { id, available: false });
    }
  }
};

export const loadPostQuotes = async (ids: number[]): Promise<void> => {
  const missing = [...new Set(ids)].filter((id) => !quoteCache.has(id) && !inflight.has(id));
  if (missing.length === 0) {
    await Promise.all([...new Set(ids)].map((id) => inflight.get(id)));
    return;
  }

  const task = requestPostQuotes(missing)
    .catch((error) => {
      console.error("Load post quotes failed:", error);
    })
    .finally(() => {
      missing.forEach((id) => inflight.delete(id));
    });

  missing.forEach((id) => inflight.set(id, task));
  await task;
};
