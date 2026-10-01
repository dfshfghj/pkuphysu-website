# CHANGELOG

## [Unreleased]

### Added

- 「关于本站」页面（`/about`，公开访问）：渲染本仓库的 CHANGELOG / TODO / README
- 帖子作者可编辑自己的帖子（最多 3 次），并查看历史版本
- 帖子 / 评论的作者可删除自己的内容，管理员保留原有删除入口
- 主页帖子卡片展示最新评论预览：每条最多 2 行，公式用 KaTeX 内联渲染，引用回复显示 `@用户名`
- 移动端底部导航栏（主页 / 板块 / 发帖 / 通知 / 设置），发帖弹窗全屏并精简工具栏
- 设置页新增「退出登录」

### Fixed

- vditor 静态资源与 `node_modules` 版本不一致导致编辑器报 `lute.SetCallout is not a function`，资源改为按版本分目录（`/vditor/<version>/...`）

### Changed

- 卡片操作（复制 / 历史版本 / 编辑 / 举报 / 删除）收进「…」下拉菜单，并在移动端常显
- 移动端顶栏精简为「关注 + 搜索」，各页面大标题在移动端隐藏
- 帖子列表请求携带 `comment_limit=2`

## [0.0.0] - 2026-04-16

### Changed

- 移除 Python 后端，前端改用 shadcn 组件
