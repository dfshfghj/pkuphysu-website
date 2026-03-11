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
  "tags": ["tag1", "tag2"]   // 标签列表（可选）
}
```

**返回值**：
```json
{
  "status": 200,
  "data": {
    "message": "帖子发布成功"
  }
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