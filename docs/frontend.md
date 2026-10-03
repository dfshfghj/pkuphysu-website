# 前端约定

## 组件分层

帖子 / 评论正文的渲染与引用卡片按三层拆开。**通用能力不要塞进通用组件** —— 通用渲染器不认识业务概念，
业务行为放在上层包装组件里。

| 组件 | 职责 |
| --- | --- |
| `components/MarkdownRenderer.vue` | 通用渲染器：把服务端渲染好的 HTML 铺出来、渲染公式、站内链接走路由。不认识「引用」，不挂 hover |
| `components/blog-center/ForumContent.vue` | 论坛内容（帖子 / 评论正文）：`MarkdownRenderer` + 引用链接的标注与 hover 接线 |
| `components/blog-center/PostQuoteHoverCard.vue` | 引用卡片本体，对外只暴露 `show(link)` |
| `components/ui/hover-card/HoverCardExternalTrigger.vue` | 把外部元素注册成 HoverCard 触发元素的通用桥 |

帖子正文（`BlogPostCard`）与评论（`BlogCommentCard`）都用 `ForumContent`。

卡片内部的链接**故意不挂 hover**：那里的链接不响应 hover，标了反而误导，而且鼠标在卡片上划过链接时
卡片会来回跳。所以卡片正文直接用 `MarkdownRenderer`。

## 滚动容器与标签搜索框

`components/ScrollPane.vue` 是页面级滚动容器的唯一入口，替代了原先散落各处的 `el-scrollbar` + `el-backtop`：

- 内部是 `ui/scroll-area`（reka），对外 `defineExpose` 出 `scrollTo(options)` 与 `scrollToTop()`。
- `back-top` 开关控制右下角的回到顶部按钮，`distance`（默认 400）是 `end-reached` 的触发阈值。
- 用法：`<ScrollPane :distance="400" back-top @end-reached="loadMorePosts">`。

`components/SearchTagInput.vue` 是博客中心与树洞共用的搜索输入框，替代 `el-input-tag`：
`v-model` 是 `string[]`，空格提交一个标签；超过 `maxCollapseTags` 的标签折叠为 `+N`，点开是 Popover。
建议列表的浮层用 `Popover` + `Command`，输入框只存在于 DOM 上（reka 的 `TagsInputInput` 不持有 ref），
所以外部选中建议后直接清空 `input.value` 即可。

## 引用标记

引用标记是一条**标准 Markdown 链接**：

```
[#123](/123)
```

链接文字是 `#<id>`（手写的「引用 #123」也认），`href` 指向帖子路由 `/<id>`。
判定要求**文字与 href 同时符合**，否则作者手写的普通站内链接会被误判成引用。

不引入自定义语法的原因：这样 lute / vditor / bluemonday 全链路零改动就能原样保留，也不影响把
Markdown 原文复制到别处。

插入入口有两处，插入文本为 `\n\n[#id](/id)\n\n`（独立段落，渲染时就是引用卡片）：

- 发帖编辑器 `BlogPostEditor`：工具栏「引用帖子」按钮（通过 `MarkdownEditor` 的 `extraToolbar` 追加）
- 评论框 `BlogCommentEditor`：工具栏是隐藏的，所以「引用」按钮放在「发送」旁边

### 树洞引用

树洞帖用同一条链接规则，只是 `href` 指向 `/treehole/<id>`，插入文本是 `\n\n[#id](/treehole/id)\n\n`：

```
[#123](/treehole/123)
```

引用选择弹窗 `QuotePostDialog` 有「站内 / 树洞」两个来源。树洞是匿名的，所以「树洞」来源的选项与引用卡片
`TreeholeQuoteHoverCard` 都只显示 `#id`、时间与正文，**不显示作者**。树洞没有批量引用接口，只能按 pid 逐条取，
`utils/treehole-quote.ts` 按 id 缓存并合并并发请求；取不到的（`data` 为 null）记为不可见，避免反复重试。

## 树洞已迁出站外

树洞浏览页已从本站移除，迁到独立站点（env `VITE_TREEHOLE_URL`），站内只保留引用能力。

- 站内遗留的 `/treehole/*` 链接，点击时由 `utils/treehole-link.ts` 的全局捕获监听一步新窗口打开外部站点，
  目标是 `${VITE_TREEHOLE_URL}?post=%23<pid>`（外部站点会把 `?post=` 的值填进搜索框）。
  **展示模式与 Vditor 编辑模式统一走这条路径**：编辑模式下 Vditor 对链接走原生整页跳转，等页面重载完
  再 `window.open` 已经没有用户手势，会被浏览器当弹窗拦掉。
- `router` 的 `TreeholeRedirect` 只是直接输入 URL 时的兜底，做同页跳转。
- 取树洞数据一律走 `/api/dev/chapi/api/v3/hole/...`。开发用 vite proxy、生产用 nginx 都会剥掉 `/api/dev`
  再转发到树洞镜像的 `/chapi/...`；直接请求裸 `/chapi/...` 在生产会命中 SPA 的 HTML fallback。

## 单根组件

**组件必须保持单根**，不要把弹窗之类的兄弟节点放在根元素外面。

Vue 的 `setScopeId` 只在 `vnode === parentComponent.subTree` 时才把父组件的 scopeId 传给子组件根元素；
多根（fragment）时每个根都不满足这个条件，父级 scoped `:deep()` 规则会**整体失效**。
`BlogCenter.vue` 里的 `:deep(.vditor)` 就是靠这个机制穿透到编辑器内部的，一旦破坏，
表现为「编辑器背景不对」。所以编辑器的主题变量改成在 `MarkdownEditor.vue` 自己的
`.vditor-container` 上声明，不再依赖父级穿透。

teleport 出去的内容不受影响，所以把弹窗放进根元素内部没有副作用。

同理，组件自己该有的样式写在自己的 `<style scoped>` 里，不要依赖父组件穿透。

## 浮层交互

「指针从触发元素移到浮层上时不能关」这件事**不要手搓**。自己写延时 + 状态位会在鼠标快速移动时出错
（表现为移出反而不收、移入反而收起），而且很难测出来。

用 reka 自带的 grace area（等价于 Radix 的 grace area / floating-ui 的 `safePolygon`）：

```vue
<HoverCard :open="open" :close-delay="0" @update:open="open = $event">
  <HoverCardExternalTrigger ref="externalTriggerRef" />
  <HoverCardContent :reference="reference">…</HoverCardContent>
</HoverCard>
```

`HoverCardExternalTrigger` 内部通过 reka 公开导出的 `injectHoverCardRootContext()`，把任意元素赋给
`rootContext.triggerElement`，效果等价于 `<HoverCardTrigger>`。适用场景是触发元素来自 `v-html`、
没法用组件包起来。

## 内容节点会被反复创建时

浮层每次打开都会重建 DOM。这种情况下内容要用 `v-html` 声明式绑定（节点重挂载时 Vue 会自动重新填充），
**不要**只在 `watch(数据)` 里写 `innerHTML` —— 数据命中缓存、没有变化时 watch 不触发，节点就会是空的。

渲染后的后处理（公式渲染、事件监听）挂在元素上：

```ts
watch(elRef, (el) => { if (el) decorate(el) }, { flush: "post" });
```

## 测试

- `src/test/setup.ts` 全局 stub 了 `teleport`，测真实传送行为要在 mount 时覆盖 `stubs: { teleport: false }`。
- stub 掉 `HoverCard` / `Dialog` 这类 reka 组件后，依赖其 provide/inject 上下文的子组件会抛
  `Injection … not found`。这类情况应该**把上层业务组件一并 stub 掉**（如 `ForumContent`），
  而不是只 stub 最底层的 UI 原语。
- reka 的 grace area 在 jsdom 里驱动不了（所有 `getBoundingClientRect` 都是 0，多边形判定走不通）。
  能测的是接线本身：hover 之后触发元素确实被注册进去了。
- 模拟指针在两个元素之间移动时，事件顺序要和浏览器一致：
  `pointerout → pointerleave → pointerover → pointerenter`（新元素）**然后** `mouseout → mouseleave → mouseover → mouseenter`（旧元素）。
  顺序写反会让测试假通过。
- 写完测试要验证它有牙：临时把修复改回错误实现，确认测试真的失败，再还原（还原要**完整**，
  只还原一半会得到"照样通过"的假象）。
