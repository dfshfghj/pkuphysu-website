import { requestApi } from "@/api/api";
import { buildCommentPreview } from "@/utils/preview";
import { isPostQuoteText } from "@/utils/post-quote";

export interface TreeholeQuote {
  id: number;
  available: boolean;
  text?: string;
  excerpt?: string;
  timestamp?: number;
}

const TREEHOLE_HREF_PATTERN = /^\/treehole\/(\d+)\/?$/;

export const buildTreeholeQuoteMarkdown = (id: number) => `[#${id}](/treehole/${id})`;

export const buildTreeholeSiteUrl = (path: string): string => {
  const base = import.meta.env.VITE_TREEHOLE_URL;
  const match = TREEHOLE_HREF_PATTERN.exec(path);
  return match ? `${base}?post=${encodeURIComponent(`#${match[1]}`)}` : base;
};

export const extractQuotedTreeholeId = (href: string | null | undefined): number | null => {
  if (!href) {
    return null;
  }

  const match = TREEHOLE_HREF_PATTERN.exec(href.trim());
  return match ? Number(match[1]) : null;
};

export const parseTreeholeQuoteLink = (
  text: string | null | undefined,
  href: string | null | undefined
): number | null => {
  if (!isPostQuoteText(text)) {
    return null;
  }
  return extractQuotedTreeholeId(href);
};

const quoteCache = new Map<number, TreeholeQuote>();
const inflight = new Map<number, Promise<void>>();

export const getCachedTreeholeQuote = (id: number) => quoteCache.get(id);

export const clearTreeholeQuoteCache = () => {
  quoteCache.clear();
  inflight.clear();
};

const fetchTreeholeQuote = async (id: number): Promise<void> => {
  try {
    const res = await requestApi(`/api/dev/chapi/api/v3/hole/get?pid=${id}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const result = await res.json();
    const hole = result?.data;
    if (!hole || typeof hole.pid !== "number") {
      quoteCache.set(id, { id, available: false });
      return;
    }

    quoteCache.set(id, {
      id: hole.pid,
      available: true,
      text: hole.text,
      excerpt: buildCommentPreview(hole.text ?? ""),
      timestamp: hole.timestamp,
    });
  } catch (error) {
    console.error("Load treehole quote failed:", error);
  }
};

export const loadTreeholeQuotes = async (ids: number[]): Promise<void> => {
  const unique = [...new Set(ids)];
  const missing = unique.filter((id) => !quoteCache.has(id) && !inflight.has(id));
  if (missing.length === 0) {
    await Promise.all(unique.map((id) => inflight.get(id)));
    return;
  }

  const tasks = missing.map((id) => {
    const task = fetchTreeholeQuote(id).finally(() => inflight.delete(id));
    inflight.set(id, task);
    return task;
  });

  await Promise.all(tasks);
};
