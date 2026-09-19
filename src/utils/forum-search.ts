import type { LocationQuery, LocationQueryRaw } from "vue-router";

export type ForumSearchToken = string;

interface ForumQueryConfig {
  query?: ForumSearchToken[];
  tag?: string;
}

interface ForumQueryOptions {
  begin?: number | string;
  limit?: number;
}

const ID_PREFIX = "#";
const TAG_PREFIX = ":";

export const normalizeSearchTokens = (tokens: ForumSearchToken[] = []) =>
  tokens
    .filter((token): token is string => typeof token === "string")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

export const extractPostIdToken = (tokens: ForumSearchToken[] = []) => {
  const idToken = normalizeSearchTokens(tokens).find((token) => token.startsWith(ID_PREFIX));
  if (!idToken) {
    return null;
  }

  const normalized = idToken.slice(1);
  return /^\d+$/.test(normalized) ? Number(normalized) : null;
};

export const buildSearchRouteQuery = (tokens: ForumSearchToken[] = []): LocationQueryRaw => {
  const query: LocationQueryRaw = {};
  const normalizedTokens = normalizeSearchTokens(tokens);
  const keywords = normalizedTokens.filter((token) => !token.startsWith(ID_PREFIX) && !token.startsWith(TAG_PREFIX));
  const tags = normalizedTokens
    .filter((token) => token.startsWith(TAG_PREFIX))
    .map((token) => token.slice(1))
    .filter((token) => token.length > 0);
  const postId = extractPostIdToken(normalizedTokens);

  if (keywords.length > 0) {
    query.keyword = keywords.length === 1 ? keywords[0] : keywords;
  }

  if (tags.length > 0) {
    query.tag = tags.length === 1 ? tags[0] : tags;
  }

  if (postId !== null) {
    query.id = String(postId);
  }

  return query;
};

export const getSearchTokensFromRouteQuery = (query: LocationQuery): ForumSearchToken[] => {
  const tokens: ForumSearchToken[] = [];
  const keywords = query.keyword ?? [];
  const tags = query.tag ?? [];

  if (typeof keywords === "string") {
    tokens.push(keywords);
  } else if (Array.isArray(keywords)) {
    tokens.push(...keywords.filter((keyword): keyword is string => typeof keyword === "string"));
  }

  if (typeof tags === "string") {
    tokens.push(`${TAG_PREFIX}${tags}`);
  } else if (Array.isArray(tags)) {
    tokens.push(
      ...tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => `${TAG_PREFIX}${tag}`)
    );
  }

  if (typeof query.id === "string" && query.id.length > 0) {
    tokens.push(`${ID_PREFIX}${query.id}`);
  }

  return normalizeSearchTokens(tokens);
};

export const buildForumListParams = (
  config: ForumQueryConfig = {},
  options: ForumQueryOptions = {}
) => {
  const params = new URLSearchParams();
  const normalizedTokens = normalizeSearchTokens(config.query);

  normalizedTokens
    .filter((token) => !token.startsWith(ID_PREFIX) && !token.startsWith(TAG_PREFIX))
    .forEach((keyword) => {
      params.append("keyword", keyword);
    });

  normalizedTokens
    .filter((token) => token.startsWith(TAG_PREFIX))
    .map((token) => token.slice(1))
    .filter((token) => token.length > 0)
    .forEach((tag) => {
      params.append("tag", tag);
    });

  if (config.tag) {
    params.append("tag", config.tag);
  }

  if (options.limit) {
    params.append("limit", String(options.limit));
  }

  if (options.begin !== undefined) {
    params.append("begin", String(options.begin));
  }

  return params;
};
