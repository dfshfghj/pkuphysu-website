# 前端约定

## 组件分层

帖子 / 评论正文的渲染与引用卡片按三层拆开。**通用能力不要塞进通用组件** —— 通用渲染器不认识业务概念，
业务行为放在上层包装组件里。

| 组件                                                    | 职责                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `components/MarkdownRenderer.vue`                       | 通用渲染器：把服务端渲染好的 HTML 铺出来、渲染公式、站内链接走路由。不认识「引用」，不挂 hover |
| `components/blog-center/ForumContent.vue`               | 论坛内容（帖子 / 评论正文）：`MarkdownRenderer` + 引用链接的标注与 hover 接线                  |
| `components/blog-center/PostQuoteHoverCard.vue`         | 引用卡片本体，对外只暴露 `show(link)`                                                          |
| `components/ui/hover-card/HoverCardExternalTrigger.vue` | 把外部元素注册成 HoverCard 触发元素的通用桥                                                    |

帖子正文（`BlogPostCard`）与评论（`BlogCommentCard`）都用 `ForumContent`。

卡片内部的链接**故意不挂 hover**：那里的链接不响应 hover，标了反而误导，而且鼠标在卡片上划过链接时
卡片会来回跳。所以卡片正文直接用 `MarkdownRenderer`。

## 滚动容器与标签搜索框

`components/ScrollPane.vue` 是页面级滚动容器的唯一入口，替代了原先散落各处的 `el-scrollbar` + `el-backtop`：

- 内部是 `ui/scroll-area`（reka），对外 `defineExpose` 出 `scrollTo(options)` 与 `scrollToTop()`。
- `back-top` 开关控制右下角的回到顶部按钮，`distance`（默认 400）是 `end-reached` 的触发阈值。
- `refresh`（可选，`() => unknown`）传入后启用下拉刷新：只在 `scrollTop === 0` 起手、纵向位移占优时接管手势，
  刷新期间指示器停在阈值位置，结束后回弹。内容位移用 viewport 的 `padding-top` 实现——
  **不要改成 `transform`**，那会让 `position: fixed` 的子孙（详情页的评论输入条）换掉 containing block。
- 用法：`<ScrollPane :distance="400" back-top :refresh="() => refresh(true)" @end-reached="loadMorePosts">`。

`components/SearchTagInput.vue` 是博客中心与树洞共用的搜索输入框，替代 `el-input-tag`：
`v-model` 是 `string[]`，空格提交一个标签；超过 `maxCollapseTags` 的标签折叠为 `+N`，点开是 Popover。
建议列表的浮层用 `Popover` + `Command`，输入框只存在于 DOM 上（reka 的 `TagsInputInput` 不持有 ref），
所以外部选中建议后直接清空 `input.value` 即可。

## 移动端视口

安全区与键盘高度都以 CSS 变量下发到 `:root`，组件只读变量，不要各自计算：

- `--safe-top/right/bottom/left`：系统栏与刘海。Web 端初值来自 `env(safe-area-inset-*)`，
  Android app 里由 `MainActivity` 的 `SafeAreaBridge` 覆盖成实测值。
- `--kb-inset`：软键盘遮挡高度。目前只有 app 会写（`WindowInsetsCompat.Type.ime()`），Web 端恒为 `0px`。

约定：

- 贴底固定的输入条 / 弹层写 `bottom: var(--kb-inset)`，不要写 `bottom-0`。
- 键盘弹起时安全区已被键盘盖住，内边距用 `max(0px, var(--safe-bottom) - var(--kb-inset))`，不要直接相加。
- 已经占满高度的全屏编辑态用 `padding-bottom: calc(var(--safe-bottom) + var(--kb-inset))` 把内容顶上来。
- 依赖视口高度的编辑器（Vditor 的 `height`）在移动端要减掉 `var(--kb-inset)`，否则底部按钮会被键盘盖住。

手机浏览器暂不处理键盘遮挡：各家行为不一致（有的自己顶出空间），以后要用 `visualViewport` 统一，
但注意 Tauri WebView 里 `visualViewport` 不反映键盘高度（tauri#10631），app 端只能走原生 insets。

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

## 提及标记

与引用同一套思路，提及标记也是一条**标准 Markdown 链接**：

```
[@username](/u/id)
```

链接文字是 `@<用户名>`，`href` 指向用户主页 `/u/<id>`；**文字与 href 同时符合**才算提及，
避免把作者手写的普通站内链接误判。判定在 `utils/mention.ts` 的 `parseMentionLink`。

- **编辑器**：`MarkdownEditor` 用 Vditor 原生 `hint.extend`（`key: "@"`）做自动补全。Vditor 的
  `hint(value)` 支持返回 Promise，且有 `hint.delay` debounce，因此直接调后端 `GET /users/search`
  做前缀搜索（`utils/user-search.ts` 带缓存）。刚输入 `@`（关键词为空）时后端返回默认推荐列表，
  因此候选框会**立即弹出**，无需再敲一个字符。选中后插入 `[@用户名](/u/<id>)`，末尾补一个空格。
  注意 Vditor 的 `getKey` 只在 `@` 位于**行首或空格之后**才触发提示。
- **展示**：`ForumContent` 标注 `a[data-mention]` 并挂 `UserMentionHoverCard`（复用 `/users/:id/stats`，
  与帖子卡片的头像悬浮卡一致）；点击由 `MarkdownRenderer` 的站内链接统一走路由。
- **评论引用前缀**：`BlogCommentCard` 里引用另一条评论时的 `@作者` 也复用同一套：渲染成指向
  `/u/<userid>` 的链接并挂 `UserMentionHoverCard`，点击跳作者主页（`quote` payload 需带 `userid`）。
- **通知**：被 @ 的用户在内容可见时收到 `forum_mention` 通知；评论的 `quote` 也按提及处理，
  并与正文里显式 @ 去重（后端 `notifyMentions` 统一处理，见 `docs/api.md`）。

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
watch(
  elRef,
  (el) => {
    if (el) decorate(el);
  },
  { flush: "post" }
);
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

## 构建产物

- `npm run build`（web）产出预压缩 `.gz`（`vite-plugin-compression`，gzip level 9，>10KB 才压），
  供 nginx `gzip_static` 用。
- `npm run build:app`（app）**不产出 `.gz`**，插件用 `disable: mode === "app"` 关掉。原因：
  Tauri 把 `frontendDist` 的每个文件在编译期用 brotli 压进二进制（`tauri-codegen`
  `embedded_assets.rs`，release quality 9，无扩展名过滤），运行时解压。资源不走 HTTP，
  没有 content negotiation，`.gz` 永远不会被读取；留着只会让安装包多背一份死重量
  （实测 73 个文件 / 5.17MB）。
- 两个模式都输出到 `dist/`，所以先跑 web 再跑 app 会互相覆盖。
- `scripts/sync-vditor.mjs` 的 `EXCLUDED_PATHS` 决定哪些 vditor 子包不进 `public/vditor`。
  目前只排掉 `js/mathjax`：Vditor 的默认公式引擎是 `KaTeX`（`mathRender.ts` 的 `defaultOptions`），
  项目里所有 `math` 配置都没写 `engine`，所以 `tex-svg-full.js` 永远不会被加载。
  **要排更多子包前先确认没人手打对应代码块**——`preview/index.ts` 的 `afterRender` 会无条件调
  `mermaidRender` / `graphvizRender` / `chartRender` 等，只有等页面里真的出现该语言的代码块才 `addScript`。
- 排掉子包后必须让 `.vditor-version` 戳跟着变（脚本里戳是 `${version}:${EXCLUDED_PATHS}`），
  否则幂等判断会直接 `exit(0)`，改动不生效。
