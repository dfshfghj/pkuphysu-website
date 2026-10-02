# 后端约定

## 目录分层

| 目录 | 职责 |
| --- | --- |
| `internal/model` | GORM 模型。新增模型必须注册进 `model.Models`，否则不会 AutoMigrate |
| `internal/db` | 数据访问。handler 不直接写查询 |
| `server/handles` | HTTP 处理，统一用 `utils.RespondSuccess` / `utils.RespondError` |
| `server/middlewares` | 认证、限流 |
| `server/router.go` | 路由注册 |

## 可见性

帖子 / 评论的可见性规则集中在 `internal/db/forum.go`：

- 已通过审核（`approved`），或**当前用户就是作者本人**

新写的查询要复用 `forumPostVisibleToUserQuery` / `forumCommentVisibleToUserQuery`（或 handler 层的
`canViewForumContent`），不要另起一套判断。

对外返回"某条内容是否存在"的接口，**不要把"不存在"和"无权查看"区分开**，避免泄露内容是否存在。
例如 `GET /forum/post-quotes` 对这两种情况统一返回 `available: false`。

## 附属数据走按需的小接口

列表接口（帖子列表、评论列表）保持轻量，不要为了展示顺带塞进附属数据。需要额外信息的场景另开小接口：

- `GET /users/:id/stats` —— 头像悬浮卡要的三个计数
- `GET /forum/post-quotes` —— 正文引用卡片要的作者与摘要

## 文本截断

`utils.TruncateString` 按 **rune** 计数。中文一个字占 3 字节，按字节切会从字符中间截断产生乱码。

## 代码风格

- 导出的类型 / 函数保留一行 Go doc 注释，与相邻代码保持一致。
- `gofmt` 的告警要单独看：仓库里混了 CRLF 与 LF，`gofmt -l ./...` 会把所有文件都列出来。
  判断自己改的文件是否干净，用 `tr -d '\r' < file > /tmp/x.go && gofmt -l /tmp/x.go`。
