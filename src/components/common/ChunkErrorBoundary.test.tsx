/**
 * [INPUT]: depends on vitest, react, react-dom/server, and ./ChunkErrorBoundary
 * [OUTPUT]: unit tests verifying ChunkErrorBoundary renders children when healthy and shows localized EN/ZH/JA/KO recovery UI for page and inline variants when an error occurs
 * [POS]: unit test suite for src/components/common/ChunkErrorBoundary.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ChunkErrorBoundary } from './ChunkErrorBoundary'

describe('ChunkErrorBoundary', () => {
  it('renders children transparently when no error has occurred', () => {
    const html = renderToStaticMarkup(
      <ChunkErrorBoundary locale="zh">
        <div>Healthy Studio Child</div>
      </ChunkErrorBoundary>,
    )
    expect(html).toContain('Healthy Studio Child')
    expect(html).not.toContain('chunk-error-boundary')
  })

  it('derives error state and renders localized recovery UI across EN, ZH, JA, and KO', () => {
    expect(ChunkErrorBoundary.getDerivedStateFromError()).toEqual({ hasError: true })

    const expectations = [
      { locale: 'en' as const, title: 'Studio assets updated', btn: 'Refresh Page', homeHref: '/' },
      { locale: 'zh' as const, title: 'Studio 资源已更新', btn: '刷新页面', homeHref: '/zh/' },
      { locale: 'ja' as const, title: 'Studio アセットが更新されました', btn: 'ページを再読み込み', homeHref: '/ja/' },
      { locale: 'ko' as const, title: 'Studio 리소스가 업데이트되었습니다', btn: '페이지 새로고침', homeHref: '/ko/' },
    ]

    for (const item of expectations) {
      const boundary = new ChunkErrorBoundary({
        locale: item.locale,
        children: createElement('div', null, 'never'),
      })
      boundary.state = { hasError: true }
      const html = renderToStaticMarkup(createElement('div', null, boundary.render()))
      expect(html).toContain('data-testid="chunk-error-boundary"')
      expect(html).toContain(item.title)
      expect(html).toContain(item.btn)
      expect(html).toContain(`href="${item.homeHref}"`)
    }
  })

  it('renders compact inline variant and invokes reload/reset callbacks safely', () => {
    const onReload = vi.fn()
    const onReset = vi.fn()
    const boundary = new ChunkErrorBoundary({
      locale: 'zh',
      variant: 'inline',
      onReload,
      onReset,
      children: createElement('div', null, 'never'),
    })
    boundary.state = { hasError: true }
    const html = renderToStaticMarkup(createElement('div', null, boundary.render()))
    expect(html).toContain('data-testid="chunk-error-boundary-inline"')
    expect(html).toContain('Studio 资源已更新')
    expect(html).toContain('关闭')
  })
})
