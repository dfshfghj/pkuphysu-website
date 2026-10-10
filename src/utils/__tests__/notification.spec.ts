import { describe, expect, it } from "vitest";
import { canOpenNotification, notificationRef, notificationTitle, type AppNotification } from "@/utils/notification";

const base: AppNotification = {
  id: 1,
  title: "",
  content: "",
  read: false,
  created_at: "",
  type: "",
};

const build = (overrides: Partial<AppNotification>): AppNotification => ({ ...base, ...overrides });

describe("notificationTitle", () => {
  it("提到：区分帖子与评论", () => {
    expect(notificationTitle(build({ type: "forum_mention", title: "mention_comment", related_username: "小明" }))).toBe(
      "小明 在评论中提到了你"
    );
    expect(notificationTitle(build({ type: "forum_mention", title: "mention_post", related_username: "小明" }))).toBe(
      "小明 在帖子中提到了你"
    );
  });

  it("回复与点赞使用发起人昵称", () => {
    expect(notificationTitle(build({ type: "forum_comment", related_username: "小红" }))).toBe("小红 回复了你的帖子");
    expect(notificationTitle(build({ type: "forum_like", related_username: "小红" }))).toBe("小红 点赞了你的帖子");
    expect(notificationTitle(build({ type: "comment_like", related_username: "小红" }))).toBe("小红 点赞了你的评论");
    expect(notificationTitle(build({ type: "forum_follow", related_username: "小红" }))).toBe("小红 关注了你的帖子");
  });

  it("缺失发起人时回退为「有人」", () => {
    expect(notificationTitle(build({ type: "forum_like" }))).toBe("有人 点赞了你的帖子");
  });

  it("系统类通知直接使用后端内容，不暴露原始类型名", () => {
    expect(notificationTitle(build({ type: "forum_delete", content: "你关注的帖子已被删除" }))).toBe(
      "你关注的帖子已被删除"
    );
    expect(notificationTitle(build({ type: "forum_post_moderation", content: "你的帖子未通过审核" }))).toBe(
      "你的帖子未通过审核"
    );
  });
});

describe("notificationRef", () => {
  it("优先显示评论 id，其次帖子 id", () => {
    expect(notificationRef(build({ related_comment_id: 9, related_post_id: 42 }))).toBe("评论 #9");
    expect(notificationRef(build({ related_post_id: 42 }))).toBe("帖子 #42");
    expect(notificationRef(build({}))).toBe("");
  });
});

describe("canOpenNotification", () => {
  it("有帖子或用户时可跳转", () => {
    expect(canOpenNotification(build({ related_post_id: 1 }))).toBe(true);
    expect(canOpenNotification(build({ related_user_id: 2 }))).toBe(true);
    expect(canOpenNotification(build({}))).toBe(false);
  });
});
