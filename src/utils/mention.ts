const MENTION_HREF_PATTERN = /^\/u\/(\d+)\/?$/;
const MENTION_TEXT_PATTERN = /^@\S+$/;

export const buildMentionMarkdown = (username: string, id: number) => `[@${username}](/u/${id})`;

export const parseMentionLink = (text: string | null | undefined, href: string | null | undefined): number | null => {
  if (!text || !MENTION_TEXT_PATTERN.test(text.trim())) {
    return null;
  }
  if (!href) {
    return null;
  }

  const match = MENTION_HREF_PATTERN.exec(href.trim());
  return match ? Number(match[1]) : null;
};
