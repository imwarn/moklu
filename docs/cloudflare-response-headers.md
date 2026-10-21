# Cloudflare 侧安全响应头配置（Moklu）

> 目标：闭合 v0.12 验收中 OPS-01 / OPS-02 的 FAIL 项。
> 配置本体在 `public/_headers`（唯一真相源），本文说明**为什么这么配**、**怎么上线**、**怎么验证**。

## 一、现状（2026-10-21 实测）

`curl -sSI https://moklu.tech/` 的结果：

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
| `script-src 'self'` | 只用 hashed bundle | `index.html` 无内联 `<script>`；全仓库 `grep 'eval(\|new Function('` 为 0 → **不需要** `'unsafe-inline'` / `'unsafe-eval'` |
| `style-src ... 'unsafe-inline'` | 必须加 | 33 个组件用 React `style={{...}}`（行内 style 属性受 `style-src` 管辖） |
| `style-src ... fonts.googleapis.com` | 必须加 | `src/utils/fonts.ts:186,207` 在**运行时**动态注入 `<link rel=stylesheet href="https://fonts.googleapis.com/...">` |
| `font-src ... fonts.gstatic.com` | 必须加 | 字体文件由 gstatic 提供 |
| `font-src ... data:` | 必须加 | `loadUploadedFont` 从 data URL 注册用户上传字体 |
| `img-src data: blob:` | 必须加 | 截图以 data URL 存储；预览用 `URL.createObjectURL` |
| `worker-src blob:` | 保险 | Konva/打包链路可能起 blob worker |
| `connect-src` 三个 AI 域 | 必须加 | `src/ai/providers.ts` 定义 `api.openai.com` / `openrouter.ai` / `generativelanguage.googleapis.com`，**由浏览器直连** |
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

### 步骤 1：确认源站是否支持 `_headers`

`_headers` 是 **Cloudflare Pages / Netlify** 的约定。当前站点跑在 **Coolify**（自托管），源站大概率是 nginx，**不会自动读这个文件**。

先确认：

```bash
# 如果静态资产由 nginx 提供，可以直接验证
curl -sSI https://moklu.tech/ | grep -i x-content-type-options
```

- **有输出** → 源站已在处理，把 `public/_headers` 部署上去即可。
- **无输出** → 走下面 2a 或 2b。

### 步骤 2a：源站是 nginx（推荐，最稳）

`/etc/nginx/conf.d/moklu.conf`：

```nginx
server {
    listen 80;
    server_name moklu.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name moklu.tech;

    root /var/www/moklu/dist;
    index index.html;

    # ── 安全响应头（对所有响应生效）──
    add_header X-Content-Type-Options    "nosniff" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options           "DENY" always;
    add_header Permissions-Policy        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" always;
    add_header Content-Security-Policy   "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' https://api.openai.com https://openrouter.ai https://generativelanguage.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;

    # HSTS 先在源站加；确认全站 HTTPS 正常后再逐步调大 max-age
    add_header Strict-Transport-Security "max-age=300; includeSubDomains" always;

    # HTML 入口文档绝不缓存
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        # 注意：location 块内的 add_header 会覆盖 server 级 add_header，
        # 所以安全头必须在这里重复一遍，或改用 include 片段。
        include /etc/nginx/snippets/moklu-headers.conf;
    }

    # content-hashed 资源长缓存
    location /assets/ {
        include /etc/nginx/snippets/moklu-headers.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location / {
        include /etc/nginx/snippets/moklu-headers.conf;
        add_header Cache-Control "no-cache" always;
        try_files $uri $uri/ /index.html;
    }
}
```

> **nginx 的经典坑**：`location` 里只要出现 `add_header`，server 级的 `add_header` 就**全部失效**。所以把安全头抽成 `/etc/nginx/snippets/moklu-headers.conf` 在每个 location 里 `include`，这是唯一不踩坑的写法。

### 步骤 2b：用 Cloudflare Transform Rules（不想动源站）

Cloudflare Dashboard → **Rules → Transform Rules → Modify Response Header**：

为 `moklu.tech/*` 添加 5 条 `Set static`：

| Header name | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Content-Security-Policy` | （上面那条完整策略） |

⚠️ **CSP 很长**，Dashboard 单条 value 有长度限制，超长会被截断且不报错 —— 截断的 CSP 会静默放行/拦截错误。**建议 CSP 走源站，其余 4 条走 CF**。

### 步骤 3：关闭 CF 对缓存头的默认覆盖

Cloudflare Dashboard → **Caching → Configuration**：

```
Browser Cache TTL:  Respect Existing Headers   ← 关键
```

默认是「4 hours」，会**覆盖**源站的 `Cache-Control`。不改这一项，nginx 里配的 `immutable` 不会生效。

### 步骤 4：HSTS 分阶段

不要一上来就 `max-age=31536000; preload`。按这个顺序：

1. `max-age=300`，观察 1–2 天，确认所有子域都走 HTTPS
2. `max-age=86400`
3. `max-age=31536000; includeSubDomains`
4. 最后才考虑 `preload`（提交预加载列表后**很难撤回**）

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
MOKLU_DEPLOY_URL=http://localhost:4174 npx playwright test tests/live/csp.spec.mjs \
  --config=tests/live/playwright.config.mjs --project=chromium-desktop

# 回归：确认 CSP 没打坏编辑器
MOKLU_DEPLOY_URL=http://localhost:4174 npx playwright test tests/live/acceptance.spec.mjs \
  --config=tests/live/playwright.config.mjs --project=chromium-desktop
```

### 上线后：一条命令

```bash
scripts/verify-deploy.sh                  # 验证线上
scripts/verify-deploy.sh http://localhost:4174   # 验证本地构建
scripts/verify-deploy.sh --no-browser     # 只查头和构建标识，秒出
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

## 五、还没解决的：线上 SHA 是 `unknown`

`vite.config.ts` 用 `git rev-parse --short HEAD` 注入 `__GIT_HASH__`。线上 Settings 弹窗实测显示 **`v0.1.0` / `unknown`** —— 说明 **Coolify 构建环境里没有 `.git` 目录**，`execSync` 抛错后走了 `catch` 分支。

这导致：**无法从生产确认部署的是哪个 commit**，回滚和验收溯源都缺一环。

修法（任选）：

1. Coolify 构建时保留 `.git`（clone 时不要 `--depth 1` 或设置 `GIT_DEPTH=0`）
2. 构建前注入环境变量，`vite.config.ts` 优先读 `process.env.SOURCE_COMMIT`

推荐 2，并把 SHA 同时写进一个 `/version.json`，方便 `curl` 直接查：

```ts
// vite.config.ts
const gitHash = process.env.SOURCE_COMMIT?.slice(0, 7)
  ?? execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
```

这样 `curl -s https://moklu.tech/version.json` 就能确认线上版本，不用开浏览器点弹窗。
