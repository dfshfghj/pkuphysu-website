import { requestApi } from "@/api/api";

export interface MentionUser {
  id: number;
  username: string;
  verified: boolean;
}

const cache = new Map<string, MentionUser[]>();
const MAX_CACHE_ENTRIES = 100;

export const clearUserSearchCache = () => cache.clear();

export const searchUsers = async (query: string, limit = 8): Promise<MentionUser[]> => {
  const keyword = query.trim();

  const cacheKey = `${keyword.toLowerCase()}#${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({ q: keyword, limit: String(limit) });
    const res = await requestApi(`/api/v2/users/search?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    const users: MentionUser[] = Array.isArray(result?.data) ? result.data : [];

    if (cache.size >= MAX_CACHE_ENTRIES) {
      cache.clear();
    }
    cache.set(cacheKey, users);
    return users;
  } catch (error) {
    console.error("Search users failed:", error);
    return [];
  }
};
