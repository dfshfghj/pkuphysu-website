# PKUPhySU 后端 API 文档

## 论坛模块

基于 Gin 框架，提供用户认证、论坛功能、文件上传等服务。所有 API 响应都遵循统一的格式：

- **成功响应**：
  ```json
  {
    "status": 200,
    "data": { /* 具体数据 */ }
  }
  ```

- **错误响应**：
  ```json
  {
    "status": 400,
    "errid": "error_id",
    "message": "错误描述"
  }
  ```

## 路由列表

### 用户认证相关

#### POST /user/register - 用户注册
**请求参数**：
```json
{
  "username": "string",      // 用户名（必填）
  "password": "string",      // 密码（必填）
  "stuname": "string",       // 学生姓名（可选）
  "stuid": "string",         // 学号（可选）
  "bio": "string"            // 个人简介（可选）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "user": {
      "id": 1,
      "username": "string",
      "verified": false,
      "stuname": "string",
      "stuid": "string",
      "role": 0,
      "disabled": false,
      "bio": "string"
    }
  }
}
```

#### POST /auth/login - 用户登录
**请求参数**：
```json
{
  "username": "string",      // 用户名（必填）
  "password": "string"       // 密码（必填）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "token": "jwt_token",
    "username": "string",
    "userid": 1
  }
}
```

#### POST /iaaa/login - IAAA 认证登录
**请求参数**：
```json
{
  "username": "string",      // IAAA用户名（必填）
  "password": "string"       // IAAA密码（必填）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "token": "jwt_token",
    "username": "string",
    "userid": 1
  }
}
```

#### POST /email/send - 发送邮箱验证码
**请求参数**：
```json
{
  "email": "string"          // 邮箱地址（必填，必须是 @stu.pku.edu.cn 域名）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "verification email sent successfully"
  }
}
```

#### POST /email/verify - 验证邮箱验证码
**请求参数**：
```json
{
  "email": "string",         // 邮箱地址（必填，必须是 @stu.pku.edu.cn 域名）
  "code": "string"           // 验证码（必填）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "token": "jwt_token",
    "username": "string",
    "userid": 1
  }
}
```

### 用户管理相关（需要认证）

#### GET /user/me - 获取当前用户信息
**请求参数**：无

**返回值**：
```json
{
  "status": 200,
  "data": {
    "id": 1,
    "username": "string",
    "verified": true,
    "stuname": "string",
    "stuid": "string",
    "role": 0,
    "disabled": false,
    "bio": "string",
    "has_password": true
  }
}
```

#### DELETE /user/me - 删除当前用户
**请求参数**：无

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "user_deleted_successfully"
  }
}
```

#### PUT /user/me - 更新用户信息
**请求参数**：
```json
{
  "username": "string",      // 新用户名（可选，1-50字符）
  "bio": "string"            // 个人简介（可选，最多200字符）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "user_info_updated_successfully",
    "username": "string",
    "bio": "string"
  }
}
```

#### POST /user/avatar - 上传用户头像
**请求参数**：multipart/form-data
- file: 图片文件（必填，最大5MB，支持jpg/jpeg/png/gif/webp）

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "avatar_uploaded_successfully"
  }
}
```

#### GET /user/avatar/:id - 获取用户头像
**路径参数**：
- id: 用户ID

**返回值**：直接返回图片文件

#### GET /users/search - 搜索用户（@提及 自动补全）
按用户名**前缀**匹配（`ILIKE`），只返回未禁用的用户。`q` 为空时按 `id` 升序返回默认推荐列表，
便于编辑器刚输入 `@` 时立刻弹出候选。

**查询参数**：
- `q`: 用户名前缀（可空，空则返回默认推荐）
- `limit`: 返回条数（默认 8，最大 20）

**返回值**：
```json
{
  "status": 200,
  "data": [
    { "id": 7, "username": "username", "verified": true }
  ]
}
```

### 密码管理（需要认证）

#### POST /auth/change-password - 修改密码
**请求参数**：
```json
{
  "oldPassword": "string",   // 当前密码（必填）
  "newPassword": "string"    // 新密码（必填）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "password_updated_successfully"
  }
}
```

### 文件上传与静态资源

#### POST /files/upload - 上传文件
**请求参数**：multipart/form-data
- file: 任意文件（必填，最大5MB）

**返回值**：
```json
{
  "status": 200,
  "data": {
    "url": "/files/md5_hash.ext",
    "ext": "ext",
    "originalName": "original_filename",
    "status": "success",
    "size": 12345,
    "id": "md5_hash.ext"
  }
}
```

#### GET /files/*filename - 获取上传的文件
**路径参数**：
- filename: 文件名（包含MD5哈希和扩展名）

**返回值**：直接返回文件

#### GET /static/*file - 获取静态资源
**路径参数**：
- file: 静态文件路径

**返回值**：直接返回文件

### 论坛功能（需要认证）

#### GET /forum/posts - 获取帖子列表
**查询参数**：
- `limit`: 每页数量（默认25）
- `begin`: 游标起始位置（默认0）
- tag: 标签筛选（可选）
- `keyword`: 关键词搜索（可重复参数，如 `keyword=word1&keyword=word2`）

**返回值**：
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "text": "帖子内容",
      "type": 0,
      "timestamp": 1640995200,
      "follownum": 10,
      "likenum": 5,
      "reply": 3,
      "tags": ["tag1", "tag2"],
      "is_follow": 1,
      "is_like": 0,
      "userid": 1,
      "username": "用户名"
    }
  ]
}
```

#### GET /forum/posts/:id - 获取单个帖子
**路径参数**：
- id: 帖子ID

**返回值**：
```json
{
  "status": 200,
  "data": {
    "id": 1,
    "text": "帖子内容",
    "timestamp": 1640995200,
    "follownum": 10,
    "likenum": 5,
    "reply": 3,
    "tags": ["tag1", "tag2"],
    "is_follow": 1,
    "is_like": 0,
    "userid": 1,
    "username": "用户名"
  }
}
```

#### GET /forum/comments/:id - 获取帖子评论
**路径参数**：
- id: 帖子ID

**查询参数**：
- `limit`: 评论数量限制（必填）
- `sort`: 排序方式（默认"asc"，可选"desc"）
- `begin`: 游标起始位置（默认0）

**返回值**：
```json
{
  "status": 200,
  "data": [
    {
      "cid": 1,
      "pid": 1,
      "text": "评论内容",
      "quote": {
        "cid": 2,
        "userid": 3,
        "username": "被引用用户",
        "text": "被引用内容"
      },
      "timestamp": 1640995200,
      "userid": 2,
      "username": "评论用户",
      "likenum": 3,
      "is_like": 1
    }
  ]
}
```

#### POST /forum/comments - 提交评论
**请求参数**：
```json
{
  "pid": 1,                  // 帖子ID（必填）
  "text": "评论内容",        // 评论内容（必填）
  "quote": 2                 // 引用的评论ID（可选）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "评论提交成功"
  }
}
```

#### POST /forum/posts - 发布帖子
**请求参数**：
```json
{
  "text": "帖子内容",        // 帖子内容（必填）
  "tags": ["tag1", "tag2"],  // 标签列表（可选）
  "poll": {                  // 投票（可选，仅发帖时可创建，编辑不修改投票）
    "multiple": false,       // 是否允许多选
    "options": ["选项A", "选项B"]  // 2~10 个选项，每个最多 100 字
  },
  "survey": {                // 问卷（可选，仅发帖时可创建，编辑不修改问卷）
    "allow_multiple": false, // 是否允许重复提交（默认每人限答一次）
    "blocks": [              // 有序区块列表，最多 100 个，至少 1 个题目区块
      {                      // Markdown 区块：问卷标题/说明等文字
        "kind": "markdown",
        "content": "# 校园问卷\n请如实填写"
      },
      {                      // 题目区块：只有交互配置，题干写在上方的 Markdown 区块里
        "kind": "question",
        "type": "single",    // single/multiple/text/ranking/slider/proportion/scale/upload
        "required": true,    // 是否必答
        "config": { "options": ["选项A", "选项B"] }
      }
    ]
  }
}
```

> 问卷由 **Markdown 区块** 与 **题目区块** 交替组成：文字（标题、题干、说明）写在 Markdown 区块里，题目区块只承载交互（题型 / 选项 / 必答）。空白的 Markdown 区块在保存时会被丢弃。
>
> Markdown 区块在写入时会用后端 lute 解析为 HTML 存库（同 post/comment），读取时在 `content`（原始 Markdown）之外额外返回 `content_html`（解析后的 HTML），展示端直接渲染 `content_html`，`content` 仅用于编辑回填。

**各题型 config**：

| type | config |
|---|---|
| `single` 单选 | `{ "options": string[] }` |
| `multiple` 多选 | `{ "options": string[], "min"?: number, "max"?: number }` |
| `text` 简答 | `{ "placeholder"?: string, "maxLength": number }` |
| `ranking` 排序 | `{ "options": string[] }` |
| `slider` 滑动条 | `{ "min": number, "max": number, "step": number, "default": number, "minLabel"?: string, "maxLabel"?: string }` |
| `proportion` 比重条 | `{ "options": string[], "total": number }` |
| `scale` 量表 | `{ "min": number, "max": number, "minLabel"?: string, "maxLabel"?: string }` |
| `upload` 上传 | `{ "accept": "image" \| "file", "multiple": boolean, "maxCount": number }`（最多 9 个） |

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "帖子发布成功"
  }
}
```

#### POST /forum/posts/:id/vote - 投票
对帖子附带的投票投票，**每个用户只能投一次，投出后不可更改**。

**请求参数**：
```json
{
  "option_ids": [1, 2]       // 选中的选项ID；单选投票只能传一个
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "投票成功",
    "poll": { /* 结构见帖子响应中的 poll 字段，此时 voted=true */ }
  }
}
```

**错误**：
- `404 PollNotFound`：该帖子没有投票
- `400 InvalidParams`：选项为空、单选传了多个、或选项不属于该投票
- `409 AlreadyVoted`：已经投过票

#### 帖子响应中的 poll 字段
帖子列表与单帖响应都带有 `poll`（无投票时为 `null`）：

```json
{
  "id": 5,
  "multiple": true,
  "voted": false,           // 当前用户是否已投票
  "can_see_results": false, // 能否看到占比 = 已投票 或 当前用户是作者
  "total_votes": 12,        // 仅 can_see_results 时下发（去重人数）
  "options": [
    { "id": 1, "text": "选项A", "count": 7, "percent": 58, "selected": true },
    { "id": 2, "text": "选项B", "count": 5, "percent": 42, "selected": false }
  ]
}
```

- **占比可见性**：`count` / `percent` / `total_votes` 仅在 `can_see_results` 时下发——**作者总是可见**，其他用户必须先投票。
- `selected` 仅在当前用户已投票时下发，标记其选中的选项。
- 多选下 `percent = count / total_votes`，各项之和可能超过 100。


#### 帖子响应中的 survey 字段
帖子列表与单帖响应都带有 `survey`（无问卷时为 `null`），仅含摘要，完整区块通过问卷接口获取：

```json
{
  "id": 3,
  "question_count": 5,          // 题目区块数
  "status": "open",             // open / closed
  "allow_multiple": false,
  "is_owner": false,            // 当前用户是否作者
  "can_view_results": false,    // 能否查看数据 = 作者 或 管理员
  "response_count": 12          // 仅 can_view_results 时下发
}
```

#### GET /forum/surveys/:id - 获取问卷详情
返回问卷的区块列表，供填写页使用。仅可见该帖的用户可访问。Markdown 区块渲染为文字，题目区块为交互控件（题号按题目区块顺序编号）。

```json
{
  "status": 200,
  "data": {
    "id": 3,
    "post_id": 88,
    "question_count": 5,
    "status": "open",
    "allow_multiple": false,
    "is_owner": false,
    "can_view_results": false,
    "answered": false,          // 当前用户是否已提交
    "can_edit": false,          // 作者且尚无答卷
    "response_count": 12,
    "blocks": [
      { "id": 10, "kind": "markdown", "content": "# 校园问卷", "content_html": "<h1>校园问卷</h1>", "position": 0 },
      {
        "id": 11,
        "kind": "question",
        "type": "single",
        "required": true,
        "position": 1,
        "config": { "options": ["选项A", "选项B"] }
      }
    ]
  }
}
```

#### POST /forum/surveys/:id/responses - 提交答卷
问卷 `closed` 时拒绝；`allow_multiple=false` 时每人仅可提交一次。`block_id` 为题目区块的 ID。

```json
{
  "answers": [
    { "block_id": 11, "value": 0 },          // 单选：选项下标
    { "block_id": 12, "value": [0, 2] },      // 多选/排序：下标数组
    { "block_id": 13, "value": "文字作答" },   // 简答：字符串
    { "block_id": 14, "value": 42 },          // 滑动条/量表：数字
    { "block_id": 15, "value": [40, 60] },    // 比重条：各项分值，和等于 total（填写端最后一项自动补足）
    { "block_id": 16, "value": [              // 上传：已上传文件的相对地址与原始文件名
      { "url": "/files/9f8e....png", "name": "photo.png" }
    ] }
  ]
}
```

> 上传题需先调用 `POST /files/upload` 拿到 `url`，再把 `{ url, name }` 列表作为作答值；`url` 必须以 `/files/` 开头，数量不超过 `maxCount`。

**错误**：
- `403 SurveyClosed`：问卷已关闭
- `409 AlreadySurveyed`：已经提交过（不允许重复提交时）
- `400 InvalidParams`：必答缺失、下标越界、排序非全排列、比重之和不为 total、上传文件地址非法或数量超限等

#### GET /forum/surveys/:id/results - 获取问卷数据
**仅作者与管理员可访问**。返回同一套区块列表，题目区块附聚合统计（选择/量表按项计数与占比，简答列出文本，排序算平均名次，滑动条算均值与分布，比重条算各项平均分，上传题列出各答题人的文件），Markdown 区块原样下发。

```json
{
  "status": 200,
  "data": {
    "id": 3,
    "post_id": 88,
    "status": "open",
    "response_count": 12,
    "blocks": [
      { "id": 10, "kind": "markdown", "content": "# 校园问卷", "content_html": "<h1>校园问卷</h1>", "position": 0 },
      {
        "id": 11,
        "kind": "question",
        "type": "single",
        "required": true,
        "config": { "options": ["选项A", "选项B"] },
        "answered": 12,
        "options": [
          { "text": "选项A", "count": 7, "percent": 58 },
          { "text": "选项B", "count": 5, "percent": 42 }
        ]
      }
    ]
  }
}
```

#### GET /forum/surveys/:id/results/export - 导出问卷数据
**仅作者与管理员可访问**。返回 `text/csv`（UTF-8 BOM），一行一份答卷，含答卷 ID、答题人、提交时间；题目区块各占一列，表头为 `第 N 题（题型）`。

#### PUT /forum/surveys/:id - 修改问卷
**仅作者可修改**。始终可改状态（`open`/`closed`）与是否允许重复提交；**已有答卷时内容结构锁定**，请求中的 `blocks` 会被忽略（响应 `locked=true`）。

```json
{
  "allow_multiple": false,
  "status": "closed",
  "blocks": [ /* 结构同 POST /forum/posts 的 survey.blocks */ ]
}
```


#### GET /forum/follow - 获取关注的帖子
**查询参数**：
- `limit`: 每页数量（必填）
- `begin`: 游标起始位置（可选）

**返回值**：
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "text": "帖子内容",
      "type": 0,
      "timestamp": 1640995200,
      "follownum": 10,
      "likenum": 5,
      "reply": 3,
      "tags": ["tag1", "tag2"],
      "is_follow": 1,
      "userid": 1,
      "username": "用户名"
    }
  ]
}
```

#### POST /forum/follow/:id - 关注/取消关注帖子
**路径参数**：
- id: 帖子ID

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "关注成功" // 或 "取消关注成功"
  }
}
```

#### POST /forum/like/:id - 点赞/取消点赞帖子
**路径参数**：
- id: 帖子ID

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "点赞成功", // 或 "取消点赞成功"
    "likenum": 6,
    "is_liked": true
  }
}
```

#### POST /forum/comment/like/:id - 点赞/取消点赞评论
**路径参数**：
- id: 评论ID

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "点赞成功", // 或 "取消点赞成功"
    "likenum": 4,
    "is_liked": true
  }
}
```

#### GET /forum/tags - 获取所有标签
**请求参数**：无

**返回值**：
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "tag_name": "标签名称",
      "is_default": false
    }
  ]
}
```

#### GET /forum/post-quotes - 批量获取被引用帖子的内容
正文里的引用卡片渲染用。一次最多解析 50 个 id，超出部分忽略；重复 id 会去重。

引用标记就是一条**标准 Markdown 链接**，不引入自定义语法（因此 lute / vditor / 其它渲染器都不会解析冲突）：

```
[#45](/45)
```

链接文字是 `#<id>`（手写的「引用 #45」也认），`href` 指向帖子路由 `/<id>`。前端要求**文字与 href 同时符合**才认定为引用，
避免把作者手写的普通站内链接误判成引用。正文里它就是普通链接（沿用 Markdown 链接样式），**hover 时才弹出引用卡片**展示被引帖的完整正文。

**查询参数**：
- `ids`: 帖子 ID，逗号分隔（如 `ids=45,23,999`）

**返回值**（顺序与请求一致）：
```json
{
  "status": 200,
  "data": [
    {
      "id": 45,
      "available": true,
      "userid": 1,
      "username": "用户名",
      "text": "渲染并清洗后的完整正文 HTML",
      "excerpt": "正文纯文本摘要，最多 120 字，供 text 为空时兜底",
      "timestamp": 1790782994
    },
    { "id": 999, "available": false }
  ]
}
```

`available` 为 `false` 表示帖子不存在、已被删除，或当前用户无权查看（三种情况不区分，避免泄露帖子是否存在）。

#### 提及（@）与通知

帖子 / 评论正文里的提及标记同样是一条**标准 Markdown 链接**（不引入自定义语法）：

```
[@username](/u/id)
```

链接文字是 `@<用户名>`，`href` 指向用户主页路由 `/u/<id>`。编辑器输入 `@` 时用
`GET /users/search` 做前缀补全，选中后插入该标记。

- 内容**变为可见时**（无需审核直接发布，或审核通过）后端会解析正文里的 `[@...](/u/<id>)` 链接，
  给被提及的用户创建 `type: "forum_mention"` 的通知（`title` 为 `mention_post` / `mention_comment`）。
- 评论若引用了另一条评论（`quote`），被引评论的作者也按「提及」处理，**与正文里显式 @ 去重**；
  `quote` payload 因此带上被引作者的 `userid`，前端把引用前缀渲染成与提及一致的链接。
- 不给自己发通知；正文里多次 @ 同一人只发一条。

### 管理员功能（需要管理员权限）

#### DELETE /admin/forum/posts/:id - 删除帖子
**路径参数**：
- id: 帖子ID

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "帖子删除成功"
  }
}
```

#### DELETE /admin/forum/comments/:id - 删除评论
**路径参数**：
- id: 评论ID

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "评论删除成功"
  }
}
```

### 系统功能

#### GET /ping - 健康检查（需要认证）
**请求参数**：无

**返回值**：`pong`

#### GET /db-tables - 获取数据库表列表
**请求参数**：无

**返回值**：
```json
{
  "status": 200,
  "data": ["table1", "table2", ...]
}
```

## 认证说明

- 所有标记为"需要认证"的路由都需要在请求头中包含 `Authorization: Bearer <token>` 
- 管理员功能需要用户具有 ADMIN 角色
- JWT token 通过 `/auth/login`、`/iaaa/login` 或 `/email/verify` 接口获取

## 错误码说明

- **400**: 请求参数错误
- **401**: 未授权或认证失败
- **403**: 权限不足
- **404**: 资源未找到
- **409**: 资源冲突（如用户名已存在）
- **429**: 请求频率限制
- **500**: 服务器内部错误