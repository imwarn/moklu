# 流量统计与搜索引擎收录接入指南（Moklu）

> 适用站点：`https://moklu.app`（部署架构：Coolify + Cloudflare 橙云代理）。
> 选型原则：与 Moklu「本地零上传、隐私优先」定位一致，采用 **Cloudflare Web Analytics** —— 不写 Cookie、不做跨站指纹跟踪、不收集个人可识别信息（PII），且零额外第三方运行时依赖。

---

## 一、CSP 最小放行前置条件

Moklu 的响应头真相源在 [`public/_headers`](../public/_headers)，并由 [`scripts/check-headers.mjs`](../scripts/check-headers.mjs) 机械校验。为支持 Cloudflare Web Analytics，CSP 仅放行以下两个最小域名（`script-src` 仍严格禁止 `'unsafe-inline'` 与 `'unsafe-eval'`）：

| CSP 指令 | 新增放行域 | 用途 |
| --- | --- | --- |
| `script-src` | `https://static.cloudflareinsights.com` | 加载 `beacon.min.js` 统计脚本 |
| `connect-src` | `https://cloudflareinsights.com` | 浏览器发送 PV / Core Web Vitals 统计 beacon |

若线上已在 Cloudflare **Transform Rules → Modify Response Header** 或 Coolify 应用容器 nginx 中启用严格 CSP，请按 [`docs/cloudflare-response-headers.md`](./cloudflare-response-headers.md) 同步更新线上的 `Content-Security-Policy` 响应头，避免统计脚本或上报请求被拦截。

---

## 二、开启 Cloudflare Web Analytics（二选一）

> **注意**：以下两种方式**只能二选一**。同时开启自动注入与手动 token 会导致页面加载两次 beacon、PV 翻倍。

### 方式 A：Cloudflare Dashboard 自动注入（推荐，零代码变更）

`moklu.app` 已接入 Cloudflare 橙云代理（Proxied），可由 Cloudflare 边缘自动向所有 HTML 响应注入 beacon：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入左侧 **Analytics & Logs → Web Analytics**。
2. 点击 **Add a site**，选择已托管在当前账号下的站点 `moklu.app`。
3. 保持 **Automatic setup（自动配置）** 开启并保存。
4. 若线上启用了 CSP，确认边缘响应头已同步包含第一节中的两个域名。
5. 用无痕窗口访问 `https://moklu.app/` 与 `https://moklu.app/zh/merge-images/`，打开浏览器 DevTools：
   - **Network**：应看到 `beacon.min.js`（或 `/cdn-cgi/rum`）请求返回 `200`/`204`。
   - **Console**：零 `Content-Security-Policy` 拦截报错。
   - 几分钟后回到 Cloudflare Web Analytics 面板确认出现实时访问数据。

### 方式 B：手动 Token 注入（构建期 `VITE_CF_BEACON_TOKEN`）

如果需要自行控制注入开关（例如仅对生产环境启用、关闭 Cloudflare 自动改写 HTML，或切换到非橙云源站），可使用构建期环境变量 `VITE_CF_BEACON_TOKEN`：

1. 在 Cloudflare Dashboard 进入 **Analytics & Logs → Web Analytics → Manage site**。
2. 切换到 **Manual setup**（或关闭 Automatic setup），从官方 JS 代码片段中复制 `data-cf-beacon` 里的 `token` 字符串（形如 `0123456789abcdef0123456789abcdef`）。
3. 在 Coolify 的 Moklu 应用配置中，添加**构建期环境变量**（Build Variable）：
   ```env
   VITE_CF_BEACON_TOKEN=<你的32位Token>
   ```
4. 触发重新构建与部署（`npm run build`）。
5. **注入行为约定**：
   - **设置了 `VITE_CF_BEACON_TOKEN`**（且去除空白后非空）：Vite 构建时自动向 `dist/index.html` 的 `<head>` 注入：
     ```html
     <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"<TOKEN>"}'></script>
     ```
     随后的 `node scripts/prerender-seo.mjs` 以 `dist/index.html` 为模板预渲染所有多语言静态路由，因此全部 SSG 页面都会自动携带该脚本。
   - **未设置 `VITE_CF_BEACON_TOKEN`（或为空）**：**不注入任何脚本标签**，本地开发与未配置的预览环境保持零统计代码。
6. **上线核验**：
   ```bash
   # 验证线上 HTML 包含 beacon 脚本（使用方式 B 时）
   curl -sS https://moklu.app/ | grep -i 'cloudflareinsights.com/beacon.min.js'

   # 验证线上安全头已放行最小 CSP 集合
   curl -sSI https://moklu.app/ | grep -i 'content-security-policy'
   ```

---

## 三、向搜索引擎提交 Sitemap

构建产物已自动生成 `https://moklu.app/sitemap.xml` 与 `https://moklu.app/robots.txt`（并在 `robots.txt` 中声明了 `Sitemap:` 地址）。建议在发布新路由或核心内容更新后主动在站长平台完成绑定与提交。

### 1. Google Search Console（GSC）

1. 打开 [Google Search Console](https://search.google.com/search-console/)，点击 **Add property（添加资源）**。
2. 优先选择 **Domain（网域）** 类型，输入 `moklu.app`（覆盖根域与所有子路径）。
3. 按提示复制 `google-site-verification=...` 的 **TXT** 记录值，前往 Cloudflare Dashboard → **DNS → Records** 添加一条根域（`@`）TXT 记录，保存后回到 GSC 点击 **Verify**。
4. 验证通过后，进入左侧 **Indexing → Sitemaps**，在 **Add a new sitemap** 中填入：
   ```text
   sitemap.xml
   ```
   提交完整地址 `https://moklu.app/sitemap.xml`。
5. 在 **URL Inspection** 中抽检首页（`/`）、中文拼图页（`/zh/merge-images`）等高价值页面，确认抓取状态为 200 且 canonical 与 `hreflang` 解析正确。

### 2. Bing Webmaster Tools

1. 打开 [Bing Webmaster Tools](https://www.bing.com/webmasters/)。
2. **推荐最快方式**：若已完成 GSC 验证，直接点击 **Import your sites from Google Search Console** 一键导入 `moklu.app`、所有权验证和 sitemap。
3. **手动方式**：选择手动添加 `https://moklu.app/`，通过 Cloudflare DNS 添加 CNAME/TXT 验证记录后，在左侧 **Sitemaps → Submit sitemap** 提交：
   ```text
   https://moklu.app/sitemap.xml
   ```

---

## 四、可选：接入 IndexNow 加速收录

[IndexNow](https://www.indexnow.org/) 协议允许站点在发布更新后主动向 Bing、Yandex、Naver、Seznam 等支持该协议的搜索引擎推送变更 URL，缩短收录延迟（无需等待常规爬虫轮询）。

### 1. 生成并托管 Key 文件

1. 生成一个 32 位小写十六进制随机 key（例如本地运行 `openssl rand -hex 16`）：
   ```bash
   openssl rand -hex 16
   # 示例输出：a1b2c3d4e5f60718293a4b5c6d7e8f90
   ```
2. 在仓库 `public/` 下新建 `<YOUR_KEY>.txt`（例如 `public/a1b2c3d4e5f60718293a4b5c6d7e8f90.txt`），文件内容仅为该 key 本身（UTF-8 纯文本、无多余空格或 HTML）。
3. 部署后确认可直接访问且返回 200 纯文本：
   ```bash
   curl -sS https://moklu.app/<YOUR_KEY>.txt
   ```
   > 若部署在 Cloudflare 橙云下，确认 WAF / Bot Fight Mode 未拦截搜索引擎对 `https://moklu.app/<YOUR_KEY>.txt` 的回源校验。

### 2. 发布后推送变更 URL

新版本部署上线后，按需提交新增或核心变更的 URL（单次最多 10,000 条）：

```bash
curl -sS -X POST https://api.indexnow.org/indexnow \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d '{
    "host": "moklu.app",
    "key": "<YOUR_KEY>",
    "keyLocation": "https://moklu.app/<YOUR_KEY>.txt",
    "urlList": [
      "https://moklu.app/",
      "https://moklu.app/zh/",
      "https://moklu.app/merge-images",
      "https://moklu.app/zh/merge-images"
    ]
  }'
```

返回 HTTP `200`（已受理）或 `202`（已入队等待 key 校验）即表示提交成功。后续如需全自动化，可将上述请求接入发版后的 GitHub Actions workflow，并从已发布的 `sitemap.xml` 提取 URL 列表批量推送。

---

## 五、隐私优先漏斗埋点（`src/utils/telemetry.ts`）

除页面级 PV 统计外，Moklu 在 [`src/utils/telemetry.ts`](../src/utils/telemetry.ts) 中提供零依赖、本地内存缓冲的隐私优先漏斗事件记录工具，用于度量工具打开到导出的转化漏斗：

- **允许的事件集合（`FunnelEventName`）**：
  - `tool_view`
  - `image_loaded`
  - `export_completed`
  - `copy_completed`
  - `format_rejected`
  - `studio_handoff`
  - `pro_cta_clicked`
  - `not_found_view`（记录 404 落地页按去敏路由 `slug`、语种 `locale`、缺失扩展名 `ext` 的每日计数，用于定位失效外链与过期资源引用）
- **强隐私剥离规则（永不泄露 PII 与本地文件名）**：
  - 任意匹配 `/name|path|url|src|blob|data|file/i` 的属性键会被无条件剥离。
  - 仅白名单短键 `mime` 与 `ext` 允许保留（且截断至最多 16 个字符，如 `image/heic`、`webp`）。
  - 任何以 `data:`、`blob:`、`http(s)://`、`file://` 或本地绝对路径开头的值也会被剥离。
- **生产同源自动上报与本地零外发**：
  - 本地开发（`localhost`）、单测、E2E 与自建镜像默认仅保存在浏览器内存的最近 100 条环形队列中（零网络请求）。
  - 在正式域名 `https://moklu.app` 下，自动通过同源 `navigator.sendBeacon('/_telemetry', ...)` 发往边缘 Worker [`workers/telemetry/`](../workers/telemetry/wrangler.jsonc)，按「天 + 事件 + 工具 + 路由 + 语种 + 扩展名」聚合累加到 Cloudflare D1 数据库 `moklu-funnel`（表 `funnel_daily`，零单条会话明细、零 Cookie、不存 IP；同时该边缘 Worker 在 `moklu.app/*` 自动注入 `public/_headers` 的完整 CSP 与安全头；如需关闭上报可设 `VITE_ANALYTICS_ENDPOINT=off`）。
  - 部署与日常查询命令：
    ```bash
    # 部署/更新边缘安全头与同源漏斗 Worker (moklu.app/*)
    npm run cf:deploy-telemetry

    # 查询最近 7 天各工具漏斗、被拒文件格式分布与 404 (not_found_view) 热点路径
    npm run funnel:report -- 7

    # 将 dist/sitemap.xml 全部 120 条 URL 推送至 IndexNow
    npm run indexnow
    ```
