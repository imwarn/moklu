# Cloudflare 侧安全响应头配置（Moklu）

> 目标：闭合 v0.12 验收中 OPS-01 / OPS-02 的 FAIL 项。
> 配置本体在 `public/_headers`（唯一真相源），本文说明**为什么这么配**、**怎么上线**、**怎么验证**。

## 一、现状（2026-10-21 实测）

`curl -sSI https://moklu.app/` 的结果：

| 头 | 现状 | 问题 |
| --- | --- | --- |
| `Content-Security-Policy` | **缺失** | 无 XSS 兜底 |
| `Strict-Transport-Security` | **缺失** | 无 HSTS 钉扎 |
| `X-Content-Type-Options` | **缺失** | 无 MIME 嗅探防护 |
| `Referrer-Policy` | **缺失** | 跨站泄露完整 Referer |
| `X-Frame-Options` | **缺失** | 可被任意站点 iframe |
| `Cache-Control`（HTML） | **缺失**，`cf-cache-status: DYNAMIC` | 入口文档可被启发式缓存 → 新部署后仍加载旧 assets 图 |
| `Cache-Control`（`/assets/*`） | `max-age=14400` | 应为 `immutable` 长缓存 |

**`max-age=14400` 的来源判断**：`/logo.svg`、`/favicon.svg`、`/assets/*` 全是 4 小时，而 `/` 是 `DYNAMIC` 无该头 —— 这个分布符合 Cloudflare 的 **Browser Cache TTL 默认 4 小时**，不是源站设置的。所以资产长缓存要同时改「源站头」和「关掉 CF 的默认覆盖」。

---

## 二、CSP 是怎么定出来的（全部来自代码证据）

CSP 最怕照抄模板。下面每一条都有仓库里的实测依据：

| 指令 | 取值 | 为什么必须是这个 |
| --- | --- | --- |
| `script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com` | hashed bundle + HEIC WASM 实例化 + Cloudflare Web Analytics beacon | `index.html` 无内联 `<script>`，全仓库 `grep 'eval(\|new Function('` 为 0 → **禁止** `'unsafe-inline'` / `'unsafe-eval'`；`'wasm-unsafe-eval'` 仅允许 `WebAssembly.instantiate` 按需解码 iPhone `.heic` / `.avif`（`heic-to/csp`）；同时放行无 cookie 的 Cloudflare Web Analytics 外部脚本（`beacon.min.js`） |
| `style-src ... 'unsafe-inline'` | 必须加 | 33 个组件用 React `style={{...}}`（行内 style 属性受 `style-src` 管辖） |
| `style-src ... fonts.googleapis.com` | 必须加 | `src/utils/fonts.ts:186,207` 在**运行时**动态注入 `<link rel=stylesheet href="https://fonts.googleapis.com/...">` |
| `font-src ... fonts.gstatic.com` | 必须加 | 字体文件由 gstatic 提供 |
| `font-src ... data:` | 必须加 | `loadUploadedFont` 从 data URL 注册用户上传字体 |
| `img-src data: blob:` | 必须加 | 截图以 data URL 存储；预览用 `URL.createObjectURL` |
| `worker-src blob:` | 保险 | Konva/打包链路可能起 blob worker |
| `connect-src` 三个 AI 域 + `https://cloudflareinsights.com` | 必须加 | `src/ai/providers.ts` 定义 `api.openai.com` / `openrouter.ai` / `generativelanguage.googleapis.com` 由浏览器直连；`cloudflareinsights.com` 用于 Cloudflare Web Analytics beacon 上报 |
| `object-src 'none'` | 收紧 | 无插件内容 |
| `frame-ancestors 'none'` | 收紧 | 与 `X-Frame-Options: DENY` 一致 |

### ⚠️ 已知限制：自定义 AI 端点会被 CSP 拦截

`src/ai/client.ts:291` 支持用户填写**任意** `baseUrl`（provider = `custom`）。CSP 是静态头，无法预知用户的自定义域名，因此**自定义 provider 会被 `connect-src` 拦下**。

三个选择：

1. **接受**（**当前采用**）：CSP 保住主站安全边界，三个内置 provider 不受影响；自定义端点需自建代理。
2. **扩展白名单**：把团队常用的自定义域名加进 `connect-src`，改一次配置加一个域。
3. **放宽为 `connect-src https:`**：功能全通，但 XSS 可外传数据 —— 等于放弃这道防线，不建议。

### 已采用方案：明确拒绝，而不是静默失败

CSP 拦截和 CORS 拒绝在 `fetch()` 眼里**完全一样**，都是 `TypeError: Failed to fetch`。如果不做处理，用户填了自定义端点只会看到"CORS 错误"，然后去查一个根本不存在的问题。

所以 `src/ai/client.ts` 现在会在报错前先判断请求域名是否落在 `connect-src` 白名单内：

```
Could not generate image for custom. The page's Content-Security-Policy does
not allow connecting to https://llm.internal.example.com, so the browser
blocked the request before it left the device. Use one of the built-in
providers (OpenAI, OpenRouter, Google) or route the custom endpoint through
your own proxy on this origin. (Failed to fetch)
```

而不是误导性的：

```
Could not generate image for custom. Check your network connection and that
the base URL is correct and allows direct browser requests (CORS)...
```

`CSP_CONNECT_ALLOWED_ORIGINS`（`src/ai/client.ts`）与 `public/_headers` 的 `connect-src`
是同一份事实的两处表达，`scripts/check-headers.mjs` 会交叉校验并让 CI 失败，
避免以后换 provider 时一处改了另一处没改。

---

## 三、上线步骤（Coolify + Cloudflare）

### 先确认各层职责

Moklu 的 Coolify Resource 为 **Application / Railpack（或历史 Nixpacks）/ SPA**，由应用容器内的静态服务器（Railpack 默认 Caddy，或 Coolify Static/SPA 管线生成的 Nginx）提供文件；外部 HTTPS / 域名转发由 Coolify 的反向代理以及可能存在的 Cloudflare 负责。**不要把下面的任何 nginx `server { listen 443 ssl; }` 配置直接粘贴到 Coolify 默认反向代理**，也不要修改 Coolify 管理的宿主机 nginx/Traefik 配置。

`public/_headers` 只是 **Cloudflare Pages / Netlify 格式的配置源文件**，适用于本地 `scripts/serve-headers.mjs` 预演；Coolify 默认的 Railpack/Nixpacks 静态服务器、Cloudflare 的普通代理 DNS 记录**都不会自动读取它**。PR 合并或重新部署 Moklu **不等于线上安全响应头生效**。

### 阶段 A：合并 / 部署 UI 修复，先不强制 CSP

1. PR 的普通 CI 和 **Live Reliability Gate** 先通过；合并到 `main`。
2. 在 Coolify 部署对应 commit，确认 `https://moklu.app/` 的 UI 已更新（浏览器 DevTools / 新版右侧 toolbar）。
3. 在 GitHub Actions → **Deployment Smoke** 运行两种阶段：
   - `include_acceptance=false`、`require_csp=false`：基础连通性、项目备份恢复等，不要求新 UI 或已配置 CSP。
   - Coolify 已部署新版后，设 `include_acceptance=true`、`require_csp=false`：加入 UI-01/02/03/04/05/07 等修复验收。**旧版线上站点不应运行这个门禁**。
4. 不要将本地 `serve-headers` 的 CSP 测试通过，解释为 `moklu.app` 的 CSP 已上线。

### 阶段 B：启用安全头（Worker 边缘主执行 + Transform Rules 单一真相源说明）

`public/_headers` 是仓库内唯一的响应头真相源，在线上按以下分层协同生效，避免重复定义或相互覆盖：

1. **主执行层（`workers/telemetry` Edge Worker，路由 `moklu.app/*`）**：`workers/telemetry/src/headersPolicy.ts` 与 `public/_headers` 保持逐字节一致（由 `workers/telemetry/src/index.test.ts` 机械门禁校验），负责在 Coolify 源站前方统一注入 `Content-Security-Policy`、`Cross-Origin-Opener-Policy`、`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`，同时执行按路径分层的 `Cache-Control`、`CDN-Cache-Control`、`cf.cacheEverything` 边缘缓存（隔离命名空间 `moklu-edge-v3`）、静态资源缺失内容协商（子资源/`curl` 返回 `404 text/plain` 且不入缓存；浏览器顶层文档导航返回 4 语种预渲染 `404.html` + `404 text/html` + `noindex, nofollow`）、显式 `/en` 与 `/en/<slug>` 的规范 `301` 重定向，以及未知非静态路径直取 4 语种 `404.html` 并返回真实 HTTP `404` + `X-Robots-Tag: noindex, follow` 的抓取卫生策略。
2. **补充/兜底层（Cloudflare Response Header Transform Rule，`scripts/sync-cf-headers.mjs`）**：当已完成 `npx wrangler login`（或配置 `CLOUDFLARE_API_TOKEN`）时，可运行零漂移同步脚本，将 `public/_headers` 的 `/*` 安全头（含 `Cross-Origin-Opener-Policy` 与 `Content-Security-Policy`）同步至 `moklu.app` 的 `http_response_headers_transform` 规则集（规则引用名 `moklu_security_headers`），作为 Worker 停用或旁路时的边缘安全头兜底。两者读取同一份 `public/_headers` 定义，**使用 `set` 覆写同名头而非叠加多个冲突 CSP**。

```bash
npm run cf:sync-headers -- --dry-run   # 预览将同步的响应头（含 COOP 与 CSP）
npm run cf:sync-headers                # 同步至 moklu.app 边缘规则集
curl -sSI https://moklu.app/ | grep -iE 'content-security-policy|cross-origin-opener-policy|cache-control|cdn-cache-control'
```

如果需要通过 Cloudflare Dashboard 手动核对，该脚本等价于为该域名创建 **Rules → Transform Rules → Modify Response Header**：

- 匹配条件为 `http.host eq "moklu.app"`，而不是误影响其他项目域名；
- 选择 **Set static**，按 `public/_headers` 中 `/*` 规则逐条填写 `X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`、`Cross-Origin-Opener-Policy`、`Permissions-Policy` 和 **完整** `Content-Security-Policy`；
- 复制 **完整 CSP**，保存后用 `curl -sSI https://moklu.app/` 检查返回值，不要只相信控制台已保存；验证是否出现截断、重复 CSP 或其他规则覆盖；
- 若当前 Cloudflare 套餐、权限或规则限制不允许配置完整 CSP，请改为**通过 `workers/telemetry` Worker 或应用自身静态服务器配置响应头**，而不是放宽 CSP 以掩盖限制。不同计划的额度和长度限制以 Dashboard 的校验及真实响应为准。

注意：不要同时在 Cloudflare 和 Coolify 源站设置互相冲突的 CSP；多个 CSP 响应头会同时被浏览器执行，不是“后者覆盖前者”。

**不使用 Cloudflare Worker / Transform Rules 时：** 需要通过 Coolify 的 Dockerfile / 自定义构建配置，让**应用容器内**的 nginx 在 HTTP `80` 端口附加安全头；HTTPS 终止仍由 Coolify 反向代理处理。应保留实际正在运行的 SPA `try_files ... /index.html` 路由，以及现有 `root` 和代理端口。不要直接照抄示例中的 `/var/www/moklu/dist` 或假设存在 `/etc/nginx/snippets/moklu-headers.conf`。如果想用 `include`，必须在镜像里**先创建**对应片段文件，并在带 `add_header` 的每个 `location` 中包含它（nginx 的 `add_header` 存在继承陷阱）。修改后在容器中执行 `nginx -t`，再进行部署/重启；不要直接修改 Coolify 管理的宿主代理。

#### 接入 Cloudflare Web Analytics 时的边缘头同步要求

启用 Cloudflare Web Analytics（详见 [`docs/analytics.md`](./analytics.md)）后，无论是通过 Cloudflare Dashboard **自动注入**还是构建期环境变量 `VITE_CF_BEACON_TOKEN` **手动注入**，都必须确保线上实际生效的 `Content-Security-Policy`（`workers/telemetry` Worker、Cloudflare Transform Rules 或 Coolify 应用容器 nginx）同步包含最小放行集合：

- `script-src` 增加 `https://static.cloudflareinsights.com`（允许加载外部 `beacon.min.js`，不需要放宽 `'unsafe-inline'`）
- `connect-src` 增加 `https://cloudflareinsights.com`（允许浏览器发送 RUM / PV beacon 请求；若为同域 `/cdn-cgi/rum`，已由 `'self'` 放行）

> 提示：修改 `public/_headers` 后，Coolify / Cloudflare 不会自动同步到线上边缘规则。若修改了安全头或缓存规则，请同步部署 `workers/telemetry`（并按需执行 `npm run cf:sync-headers`），再用 `curl -sSI https://moklu.app/` 与浏览器 DevTools 确认零 `securitypolicyviolation`。

### 阶段 C：浏览器 bfcache、Cloudflare 边缘缓存（`CDN-Cache-Control` + `cf.cacheEverything`）与 HSTS

Moklu 采用「浏览器条件重验证 + Cloudflare 边缘短缓存 + 未知路由防软 404」三层缓存架构（由 `public/_headers` 声明并由 `workers/telemetry` 在边缘强制执行），彻底消除 HTML `no-store` 破坏浏览器 Back-Forward Cache（bfcache）以及 `cf-cache-status: DYNAMIC` 每次穿透源站的问题：

| 路径 | `Cache-Control`（浏览器） | `CDN-Cache-Control`（边缘） | Worker `cf.cacheEverything` | 额外策略 |
| --- | --- | --- | --- | --- |
| 120 条已知多语言 SSG HTML 路由（`/`、`/index.html` 及 `en`/`zh`/`ja`/`ko` × 30 slug，含/不含尾斜杠） | `public, no-cache`（保留 bfcache，同时强制 ETag 重验证防止发布后命中旧资源图） | `public, s-maxage=60, stale-while-revalidate=86400` | `GET`/`HEAD` 开启，`200-299: 60s`（`moklu-edge-v3`） | 无 `X-Robots-Tag` |
| 显式英文前缀路径（`/en`、`/en/`、`/en/<known-slug>`） | `public, max-age=3600` | 不输出 | 不穿透源站，边缘直接响应 `301 Moved Permanently` | 重定向至规范路径 `/` 或 `/<slug>/`（保留 query string）并附带全部安全头；`/en/<unknown>` 走下方未知路由 `404` |
| `/assets/*`（内容哈希分包）与静态非 HTML 资源扩展名（`.js`/`.css`/`.wasm`/`.png` 等） | `public, max-age=31536000, immutable`（仅 `/assets/*` 合法 200） | `public, max-age=31536000, immutable`（仅 `/assets/*` 合法 200） | `GET`/`HEAD` 开启，`200: 31536000s`（仅合法非 HTML 响应入 `moklu-edge-v3`） | 若 Coolify SPA `try_files` 返回 `200 text/html` 或上游返回 `>= 400`，立即取消响应体且**绝不写入边缘缓存**，并按请求类型内容协商：① `<script>`/`<link>`/`<img>`/`fetch()`/`curl` 等子资源返回 `404 text/plain; charset=utf-8` + `Cache-Control: no-store` + `Vary: Accept, Sec-Fetch-Dest, Sec-Fetch-Mode` + `X-Robots-Tag: noindex, nofollow`；② 浏览器顶层文档导航（`Sec-Fetch-Mode: navigate` / `Sec-Fetch-Dest: document` 或无 `Sec-Fetch-*` 且 `Accept: text/html`）按 URL 前缀或 `Accept-Language` 从源站拉取对应语种 `/{,zh/,ja/,ko/}404.html`（兜底 `/404.html` → `/index.html`），返回 `404 text/html; charset=utf-8` + `Cache-Control: no-store` + `Vary: Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode` + `X-Robots-Tag: noindex, nofollow` |
| 短 TTL 静态与爬虫文件（`/theme-init.js`、`/sitemap.xml`、`/robots.txt`、`/llms.txt`、`/logo*.svg`、`/favicon.svg`、`/apple-touch-icon.png`、`/og-image.png`、`/templates/*`） | `public, max-age=3600` | `public, s-maxage=3600, stale-while-revalidate=86400` | `GET`/`HEAD` 开启，`200: 3600s`（仅合法非 HTML 响应入缓存） | `/theme-init.js` 与 `/logo*.svg` 显式附带 `X-Content-Type-Options: nosniff`；若源站误返 `text/html` 同样按上述静态资源缺失内容协商返回 `404` |
| `/fb6946466b9027e3bbb1506815e0f52e.txt`（IndexNow 校验） | `public, max-age=86400` | `public, s-maxage=86400` | `GET`/`HEAD` 开启，`200: 86400s` | `X-Content-Type-Options: nosniff` |
| `/healthz.txt`、`/healthz`、`/healthz/`、`/healthz/index.html`、`_telemetry*` | `no-store` | 移除/不输出 | 关闭（直透源站或 Worker 本地响应） | 禁止代理与 CDN 缓存 |
| 未知非静态路径（如 `/studio/unknown-check`、`/ja/non-existent`、`/merge-image`） | `no-store` | 移除/不输出 | 关闭（不写入边缘缓存） | 按路径首段语言前缀或 `Accept-Language` 从源站拉取预渲染的 `/404.html` 或 `/{zh,ja,ko}/404.html`（兜底 `/404.html` → `/index.html`），返回真实 **`404 Not Found`** HTML + `Vary: Accept, Accept-Language, Sec-Fetch-Dest, Sec-Fetch-Mode` + `X-Robots-Tag: noindex, follow`，彻底消除软 404 |

Cloudflare 的 **Caching → Configuration → Browser Cache TTL** 应保持 **Respect Existing Headers**，避免默认 4 小时 TTL 覆盖源站与 Worker 的精确 `Cache-Control` 策略。上线后分别抽查 `/`、`/zh/merge-images/`、`/en/merge-images`（`301`）、`/assets/index-*.js`（`200 immutable`）、`curl` 访问 `/assets/missing.js`（`404 text/plain`）、浏览器直开 `/assets/missing.js`（`404 text/html` + 对应语种 `404.html`）、`/theme-init.js`、`/healthz.txt` 与 `/ja/missing-tool`（`404 text/html` + `/ja/404.html`）的响应头。

HSTS 必须在确认目标域名及需要覆盖的子域名都能正常 HTTPS 后分阶段开启：先 `max-age=300`，观察后再扩大；`includeSubDomains` 和 `preload` **不要默认直接启用**。如果通过 Cloudflare 开启 HSTS，可使用 **SSL/TLS → Edge Certificates → HSTS**，具体可用性依你的 Cloudflare 配置为准。

### 阶段 D：强制线上 CSP / 发布验收

确认线上 `Content-Security-Policy` 已按预期返回，且新 UI 构建已部署后：

1. GitHub Actions → **Deployment Smoke**：`include_acceptance=true`、`require_csp=true`，强制运行实际响应头上的 CSP 测试；缺失 CSP 直接失败。
2. 查看 `tests/live/csp.spec.mjs` 的 `securitypolicyviolation` 结果，实际 Quick Design、字体加载、PNG 导出不得出现 CSP 拦截。
3. 执行 `scripts/verify-deploy.sh`，归档构建标识、缓存、安全头和 UI 断言；若生产 SHA 仍为 `unknown`，按第五节补充构建元数据。
4. 确认 Coolify 回滚可用后，才能把安全头/版本一致性标记为 RC 验收通过。

---

## 四、验证

### 本地预演（不碰生产）

```bash
npm run build
node scripts/serve-headers.mjs dist 4174   # 按 public/_headers 发头

# 头是否齐全
curl -sSI http://localhost:4174/ | grep -iE 'content-security|x-content-type|referrer|frame-options|cache-control'

# 配置与代码是否一致（provider 域名 / 缓存策略 / 无 unsafe-eval）
node scripts/check-headers.mjs

# CSP 实测：跑完整业务流并捕获 securitypolicyviolation
MOKLU_REQUIRE_CSP=1 MOKLU_DEPLOY_URL=http://localhost:4174 npx playwright test tests/live/csp.spec.mjs \
  --config=tests/live/playwright.config.mjs --project=chromium-desktop

# 回归：确认 CSP 没打坏编辑器
MOKLU_LIVE_ACCEPTANCE=1 MOKLU_DEPLOY_URL=http://localhost:4174 npx playwright test tests/live/acceptance.spec.mjs \
  --config=tests/live/playwright.config.mjs --project=chromium-desktop
```

### 上线后：一条命令（新版 UI 与安全头均生效之后）

```bash
scripts/verify-deploy.sh                  # 严格检查新版 UI + 实际安全头
scripts/verify-deploy.sh http://localhost:4174   # 验证本地构建
scripts/verify-deploy.sh --no-browser     # 只查头和构建标识，未配置安全头会如实失败
```

它会回答三个「跑测试通过」答不了的问题：

1. **线上到底是哪个构建？** 检查 bundle 里有没有 `toolbar-right` 标记，并读出 Settings 分块里注入的 commit
2. **那些阻断缺陷真的没了吗？** 真机探测 UI-01/02/03/04/07，打印实测数值
3. **安全头生效了吗？** 逐项检查，并区分「缺失」和「有但不是想要的」

输出示例（旧版 vs 新版）:

```text
2. Build identity (is this the fixed build?)
  ✗ fixed toolbar build     bundle is PRE-FIX (no toolbar-right) — fixes not deployed
  ! deployed commit         unknown — build has no .git (see docs §5)

5. Live defect probes
  ✗ UI-02                   overflowPx=177 visible=29.2%
  ✗ UI-04 Templates         tab escapes=6/6

──── 19 checks: 0 pass  8 fail  ...

VERDICT: FAIL — 8 blocking check(s).
```

修复版跑出来是 `18 pass / 0 fail / 1 warn`（warn 是 HSTS 分阶段未开）。

它**不是**「配了什么就通过什么」：拿它跑未修复的线上站点，探测项会实打实报失败。

`tests/live/csp.spec.mjs` 会断言部署真的带上了 CSP，并捕获 `securitypolicyviolation` —— 光看头存在不算通过，要业务流跑完零违规才算。

### 这套验证是可信的（已做反向验证）

故意把 `style-src` 里的 `fonts.googleapis.com` 删掉，测试**立即失败**并报出字体被拦截。说明这不是"配了什么就通过什么"的空测试。

---

## 五、Coolify / Railpack 构建中的版本号与 Commit Hash（消除 `unknown`）

`vite.config.ts` 按以下 4 级优先级解析 `__GIT_HASH__`（注入 Studio「设置」弹窗左下角）：

1. **PaaS 环境变量**：`SOURCE_COMMIT`、`COOLIFY_GIT_COMMIT_SHA`、`RAILWAY_GIT_COMMIT_SHA`、`CF_PAGES_COMMIT_SHA`、`VERCEL_GIT_COMMIT_SHA`、`GITHUB_SHA`、`COMMIT_REF`。
2. **纯 Node 文件系统直读 `.git/HEAD`**：无需容器内安装 `git` 命令，直接读取 `.git/HEAD`、`refs/` 与 `packed-refs`（适配精简 Node 镜像保留了 `.git/` 但无 `git` 二进制的场景）。
3. **本地 `git rev-parse --short HEAD`**。
4. **UTC 构建日期戳兜底（`bYYYYMMDD`，如 `b20261125`）**：当 Coolify 为复用 Docker/BuildKit 层缓存而默认剥离 `.git/` 且不注入 `SOURCE_COMMIT` 时，自动回退为当日构建戳，不再显示 `unknown`。

> **若希望线上直接显示精确的 7 位 Git Commit SHA（而非 `bYYYYMMDD` 构建戳）**：
> 打开 `Coolify Dashboard -> Application -> Advanced -> Build`，将 **Source commit availability** 切换为 **`Available during build only`**（注意：由于每次推送的 `SOURCE_COMMIT` 不同，开启后会按提交刷新构建缓存层；保持默认关闭则显示 `bYYYYMMDD` 并享受最快缓存命中）。

---

## 六、Coolify 迁移指南：从 Nixpacks 无缝切换到 Railpack（消除废弃警告）

Nixpacks 已进入维护/废弃阶段，仓库根目录已提供经过官方 Schema（`https://schema.railpack.com`）校验的 `railpack.json`，支持在 Coolify 中零代码修改直接切换至 **Railpack**：

```json
{
  "$schema": "https://schema.railpack.com",
  "provider": "node",
  "packages": {
    "node": "22"
  },
  "steps": {
    "build": {
      "commands": [
        "npm run build"
      ]
    }
  },
  "deploy": {
    "aptPackages": [
      "...",
      "curl"
    ]
  }
}
```

### 设计说明

1. **`provider: "node"` + `packages.node: "22"`**：显式锁定 Node Provider 与 Node 22（与 `.nvmrc` 保持一致），避免仓库根目录存在 `index.html` 与 `public/` 时被误判为跳过构建的纯静态站点。
2. **`steps.build.commands: ["npm run build"]`**：完整执行 `tsc -b && vite build && node scripts/prerender-seo.mjs`，在 `dist/` 中产出全部 92 条多语言预渲染目录（`dist/<route>/index.html`）、`dist/index.html`、`dist/sitemap.xml`、`dist/robots.txt`、`dist/llms.txt` 及轻量健康检查文件（`dist/healthz.txt`、`dist/healthz/index.html`）。不覆写 `steps.build.inputs`，保留 Railpack 自动生成的依赖安装与源码输入层。
3. **`deploy.aptPackages: ["...", "curl"]`**：使用 `"..."` 保留 Railpack 默认运行期依赖，同时在运行期 Debian 容器中附带 `curl`，确保 Coolify 容器内 HTTP Healthcheck 不会因缺少 `curl`/`wget` 而误报 `unhealthy`。
4. **保持零配置 Caddy 稳健性（不提交自定义根 `Caddyfile` / `Staticfile`）**：
   - Railpack 识别 `vite.config.ts` 与 `vite build`（且无 `start` 脚本）后，会自动以 Vite SPA 模式启用内置 Caddy 服务托管 `dist/`，其内置 `try_files` 既可直接返回 92 条预渲染目录的 `index.html`（HTTP 200），又可对未知前端路由回退至 `/index.html`。
   - 若提交自定义根 `Caddyfile`，会将配置硬耦合到 Railpack 内部工作目录布局与端口环境变量，且在 Coolify Static/Nginx 模式下不生效；因此保持零配置模板最稳健。

### 分步切换操作

1. 打开 `Coolify Dashboard -> Application -> General`。
2. 在 **Build Pack** 下拉菜单中，将 `Nixpacks` 改为 **`Railpack`**。
3. 按你当前的部署模式核对构建管线参数（两种模式二选一，保持与现有路由一致即可）：
   - **模式 A：纯 Railpack SPA（推荐，内置 Caddy）**
     - 保持 `Is it a static site?` 关闭（或 `Site type` 保持 Railpack 默认托管）。
     - 若某些旧版 Coolify / Railpack 未自动识别输出目录，可在 `Coolify Dashboard -> Application -> Environment Variables` 增加 `RAILPACK_SPA_OUTPUT_DIR=dist` 显式锁定 SPA 模式。
     - **Ports Exposes**：与 Railpack 容器监听端口一致（默认 `80` 或容器注入的 `PORT`）。
   - **模式 B：Coolify Static / SPA 管线（内置 Nginx）**
     - 将 `Site type` 设为 `SPA`（或开启 `Is it a static site?`）。
     - **Publish Directory** 设为 `/dist`。
     - **Ports Exposes** 保持 `80`。
4. 保持 `Install Command` / `Build Command` 留空（由 `railpack.json` 自动接管 `npm ci` 与 `npm run build`），避免面板覆写与仓库配置漂移。
5. 点击 **Save**，随后执行 **Redeploy**（首次切换建议勾选 **Force Rebuild without Cache**，彻底清理旧 Nixpacks 缓存层）。
6. 观察构建日志：确认使用 Node 22、执行 `npm run build` 并输出 `routesWritten: 92`，Nixpacks 废弃警告消失。

### 无尾斜杠重定向 `http://` scheme 说明

Moklu 已将全部站内链接、`<link rel="canonical">`、`hreflang` 与 `sitemap.xml` 统一为带尾斜杠格式（如 `/en/`、`/zh/`、`/ja/`、`/ko/`），正常访问不会触发目录补斜杠重定向。

若用户手动访问无尾斜杠路径（例如 `/zh`）且观察到源站返回 `Location: http://moklu.app/zh/`（降级为 `http://`）：

- **原因**：位于 HTTPS 反向代理（Traefik / Cloudflare）后的静态服务器以明文 HTTP 监听容器内部端口；Nginx 默认 `absolute_redirect on` 会按内部 HTTP 协议拼出绝对 URL。
- **处理方式**：
  - 使用 **模式 A（Railpack 内置 Caddy）** 时，由 Railpack 内置模板托管静态目录与 `try_files`，无需手工维护 `Caddyfile`。
  - 使用 **模式 B（Coolify Static / Nginx）** 时，可在 `Coolify Dashboard -> Application -> General -> Custom Nginx Configuration` 的 `server { ... }` 块中加入：
    ```nginx
    absolute_redirect off;
    port_in_redirect off;
    ```
    使目录重定向返回相对路径 `Location: /zh/`，浏览器与代理会自动保持 `https://`。

### 切换后验证清单

```bash
# 1. 首页与多语言预渲染路由均直接返回 200
curl -sSI https://moklu.app/
curl -sSI https://moklu.app/zh/
curl -sSI https://moklu.app/en/tools/merge-images/

# 2. 健康检查端点返回 200 且内容为 ok
curl -sSi https://moklu.app/healthz.txt
curl -sSi https://moklu.app/healthz/

# 3. 未知前端路由返回真实 HTTP 404（保留 SPA HTML + X-Robots-Tag: noindex, follow）
curl -sSI https://moklu.app/studio/unknown-check

# 4. 缺失静态资源拦截 Coolify 软 200 回退，返回 404 text/plain + no-store
curl -sSI https://moklu.app/assets/missing.js

# 5. 显式 /en 路径 301 重定向至规范路径
curl -sSI https://moklu.app/en/merge-images
```

---

## 七、在 Coolify 开启 HTTP Healthcheck（消除 No healthcheck 警告）

仓库已在 `public/` 内置两个零依赖、极轻量的静态健康检查端点（构建后自动复制到 `dist/`）：

- `/healthz.txt`：纯文本 `ok\n`（3 字节，`Content-Type: text/plain; charset=utf-8`）
- `/healthz/`（`public/healthz/index.html`）：最小 HTML5 文档（35 字节，`Content-Type: text/html; charset=utf-8`）

两者在 `public/_headers` 中均显式声明 `Cache-Control: no-store`，并由 `scripts/check-headers.mjs` 在 CI 阶段机械校验。

### 分步配置（Coolify Dashboard）

1. 打开 `Coolify Dashboard -> Application -> Healthcheck`。
2. 打开 **Enable Healthcheck** 开关，按以下参数填写：

| 配置项 | 推荐值 | 说明 |
| --- | --- | --- |
| **Method / Check Type** | `HTTP`（`GET`） | 使用容器内 HTTP 探测，开启后 Coolify/Traefik 会自动启用健康就绪门禁与零停机滚动发布 |
| **Scheme** | `http` | 探测走容器内部回环地址，TLS 由外层 Traefik / Cloudflare 终止 |
| **Host** | `localhost` | 容器内回环主机名（保持默认即可） |
| **Port** | 留空（或与容器暴露端口一致，如 `80`） | 留空时 Coolify 默认使用第一个暴露端口；纯 Railpack 模式若自定义了 `PORT` 环境变量，请与之保持一致 |
| **Path** | `/healthz.txt` | 首选（仅 3 字节纯文本，零解析开销）；也可使用 `/healthz/` 或 `/` 作为备选 |
| **Return Code** | `200` | 预期 HTTP 状态码 |
| **Response Text**（可选） | `ok` | 进一步校验响应体内容，防止误把错误页当作健康 |
| **Interval** | `30`（秒） | 探测间隔，15–30 秒均可 |
| **Timeout** | `5`（秒） | 单次探测超时 |
| **Retries** | `3` | 连续失败次数阈值 |
| **Start Period** | `15`（秒） | 容器启动宽限期 |

3. 点击 **Save** 并执行 **Redeploy**。
4. 部署完成后在 `Coolify Dashboard -> Application -> General` 确认状态变为 **Running (healthy)**，且 `No healthcheck` 警告消失。

### 排查与注意事项

- **容器内必须有 `curl` 或 `wget`**：Coolify 的 HTTP Healthcheck 在**应用容器内部**执行。本仓库 `railpack.json` 已通过 `deploy.aptPackages: ["...", "curl"]` 预装 `curl`；若使用自定义镜像或出现误报 `unhealthy`，可在 `Coolify Dashboard -> Application -> Terminal` 中直接验证：
  ```bash
  command -v curl || command -v wget
  curl -fsS http://localhost:80/healthz.txt
  ```
  （若容器监听了自定义 `PORT`，请将 `80` 替换为实际端口。）
- **Cloudflare 边缘缓存排除**：如果线上通过 Cloudflare Cache Rules 缓存静态资源，建议为 `/healthz.txt` 与 `/healthz/*` 配置 **Bypass cache**（与 `public/_headers` 中的 `Cache-Control: no-store` 保持一致），确保外部拨测同样命中实时响应。

---

## 八、安全响应头对日常功能与 Cloudflare 面板开关的边界说明

当前线上边缘（`workers/telemetry` Worker 路由 `moklu.app/*`）与仓库唯一真相源 `public/_headers` 同步下发以下响应头组合：

- `Content-Security-Policy`（含 `script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com` 与受限 `connect-src`）
- `X-Frame-Options: DENY`（与 CSP `frame-ancestors 'none'` 双重对齐）
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`（隔离跨源浏览上下文，同时保留合法弹窗与 OAuth/分享窗口互操作）
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()`
- 按路径分层的 `Cache-Control`、`CDN-Cache-Control`、静态资源缺失内容协商（子资源 `404 text/plain`、浏览器文档导航 4 语种 `404.html` + `404 text/html`）、显式 `/en` `301` 重定向及未知非静态路径 4 语种 `404.html` 真实 HTTP `404` + `X-Robots-Tag: noindex, follow`

### 1. `'wasm-unsafe-eval'` 的真实安全边界

- **只开放 WebAssembly 线性内存沙箱，不放开任意 JS 动态执行**：`'wasm-unsafe-eval'`（CSP Level 3 标准指令）仅允许 `WebAssembly.compile` / `WebAssembly.instantiate` 编译二进制模块（供 `src/tools/heicDecoder.ts` 按需加载 `heic-to/csp` 本地解码 `.heic` / `.heif`），**`eval()`、`new Function()`、字符串 `setTimeout("...")` 以及内联 `<script>` 依然被浏览器 100% 拦截**。
- **叠加出口白名单双重锁死**：即使极端情况下第三方 WASM 解码器遇到畸形图片触发内存越界，WASM 本身没有 DOM / 网络 API 权限，且外层 `connect-src` 严格锁定在 `'self'`、3 个内置 AI 官方域名与 `cloudflareinsights.com`，本地图片像素与证件数据无法外传至未知第三方服务器。

### 2. 日常使用中有感知的 2 个预期安全边界

| 场景 | 表现 | 原因与处理方式 |
| --- | --- | --- |
| **Studio 自带 Key（BYOK）填写第三方 `Custom` 中转域名** | 浏览器在发包前直接拦截，`src/ai/client.ts` 给出明确 CSP 提示 | OpenAI / Google Gemini / OpenRouter 官方直连及 **Zero-Key 免 Key 复制粘贴翻译**均正常可用；若团队确需固定自建代理域名，需同步加入 `public/_headers`、`workers/telemetry/src/headersPolicy.ts` 与 `CSP_CONNECT_ALLOWED_ORIGINS` 并执行 `node scripts/check-headers.mjs` |
| **外部网站通过 `<iframe src="https://moklu.app/...">` 嵌入** | 浏览器拒绝渲染子框架 | `X-Frame-Options: DENY` + `frame-ancestors 'none'` 用于防御点击劫持（防止诱导用户在透明遮罩下处理含敏感信息的截图或证件）；若未来推出官方可嵌入 Widget，应仅为独立子路径（如 `/embed/*`）单独按域名白名单放开 `frame-ancestors` |

> 补充说明：`Permissions-Policy: camera=(), microphone=(), geolocation=()` 仅禁用网页直接调用 `getUserMedia` / `navigator.geolocation` 硬件实时权限，**完全不影响** iOS Safari / Android Chrome 点击上传框时系统原生的「拍照或选择照片」选择器，也不影响本地读取图片二进制 EXIF/GPS 元数据。

### 3. Cloudflare Dashboard 必须保持关闭的 2 个开关

由于 `script-src` 严格不放行 `'unsafe-inline'`，在 Cloudflare 控制台切勿开启以下向 HTML 动态注入内联脚本的功能，否则会触发 CSP 拦截告警：

1. **Speed → Optimization → Content Optimization → Rocket Loader**：保持 **OFF**（Vite 产出的 ES Module 分包已原生异步加载，无需且不兼容 Rocket Loader 内联改写）。
2. **Scrape Shield → Email Address Obfuscation**：保持 **OFF**（若页面出现邮箱文本，Cloudflare 会注入无哈希内联解码脚本并被 CSP 拦截）。
