export interface AppNotification {
  id: number;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  type: string;
  related_user_id?: number;
  related_username?: string;
  related_post_id?: number;
  related_comment_id?: number;
}

export const notificationTitle = (notification: AppNotification): string => {
  const who = notification.related_username || "有人";
  switch (notification.type) {
    case "forum_mention":
      return notification.title === "mention_post" ? `${who} 在帖子中提到了你` : `${who} 在评论中提到了你`;
    case "forum_comment":
      return `${who} 回复了你的帖子`;
    case "forum_like":
      return `${who} 点赞了你的帖子`;
    case "comment_like":
      return `${who} 点赞了你的评论`;
    case "forum_follow":
      return `${who} 关注了你的帖子`;
    case "forum_post_moderation":
    case "forum_comment_moderation":
    case "forum_delete":
    case "comment_delete":
    case "forum_post_report":
    case "forum_comment_report":
      return notification.content || notification.title;
    default:
      return notification.content || notification.title || "新的消息";
  }
};

export const notificationRef = (notification: AppNotification): string => {
  if (notification.related_comment_id) {
    return `评论 #${notification.related_comment_id}`;
  }
  if (notification.related_post_id) {
    return `帖子 #${notification.related_post_id}`;
  }
  return "";
};

export const canOpenNotification = (notification: AppNotification): boolean =>
  Boolean(notification.related_post_id || notification.related_user_id);
