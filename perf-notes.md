# 首次加载推文缓慢的原因与优化建议

## 现状问题
- Twitter widgets 脚本在页面 load 之后才以 `lazyOnload` 下载，`TweetEmbed` 需要轮询等待 `window.twttr.widgets`，首屏要等第三方脚本与每条嵌入资源完成后才渲染。
- 首屏数据完全在客户端请求：`FeedPage` 是 client 组件，`useFeed` 在 `useEffect` 里首发 `/api/feed`，遇到后端冷启动/连接耗时会放大首屏时间。
- `/api/feed` 每次实时查库，无缓存；同时还会请求 `/api/dates` 以构建日期树，增加往返。

## 优化建议（保持改动小）
- 提前加载 Twitter 脚本  
  - 将 `Script` 策略改为 `afterInteractive`，并添加 `preconnect` 到 `platform.twitter.com` / `pbs.twimg.com`，降低等待。  
  - `onLoad` 时调用 `window?.twttr?.widgets?.load?.()`。
- 首屏服务端预取 + 客户端复用  
  - 在 `app/page.tsx`（Server Component）预取首屏 feed（查库或请求 `/api/feed`），将 `initialItems`/`initialCursor` 传给 `FeedPage`/`useFeed`（`useFeed` 支持 `initialData`）。首屏无需等待首个客户端请求。
- 给 `/api/feed` 添加短缓存  
  - 如果业务允许，设置 `s-maxage`（30–60s）或 `export const revalidate = 60;`，降低冷启动与数据库延迟对首屏的影响。
- 降低首屏渲染负载  
  - 将初始 `limit` 由 10 下调到 6–8，滚动再加载更多；或在 `TweetEmbed` 中用 IntersectionObserver 懒加载（进入视口再 `createTweet`），减少首屏第三方请求并发。
- 并发准备侧边栏数据（可选）  
  - 继续用 localStorage 缓存 `/api/dates`；若要更快，可在服务端也预取日期树并下发，减少首轮双请求。