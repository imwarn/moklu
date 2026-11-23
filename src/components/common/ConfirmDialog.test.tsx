/**
 * [INPUT]: depends on vitest, react-dom/server renderToStaticMarkup, StudioLocaleProvider from @/i18n, and ./ConfirmDialog
 * [OUTPUT]: Vitest unit tests verifying ConfirmDialog ModalShell semantics, AA danger styling, disabled state classes, and 4-locale default labels
 * [POS]: automated unit test suite for src/components/common/ConfirmDialog.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StudioLocaleProvider } from '@/i18n'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        open={false}
        title="Delete"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(html).toBe('')
  })

  it('renders via ModalShell with dialog semantics, AA danger background #dc2626, and disabled styling when busy', () => {
    const html = renderToStaticMarkup(
      <StudioLocaleProvider locale="en">
        <ConfirmDialog
          open
          danger
          busy
          title="Delete project"
          message="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </StudioLocaleProvider>,
    )

    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-label="Delete project"')
    expect(html).toContain('data-testid="modal-backdrop"')
    expect(html).toContain('bg-[#dc2626]')
    expect(html).not.toContain('#f87171')
    expect(html).toContain('disabled:opacity-50')
    expect(html).toContain('disabled:cursor-not-allowed')
    expect(html).toContain('Delete…')
    expect(html).toContain('Cancel')
  })

  it('localizes default cancel and confirm labels via useStudioLocale', () => {
    const zhHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="zh">
        <ConfirmDialog
          open
          title="确认操作"
          message="是否继续？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </StudioLocaleProvider>,
    )
    expect(zhHtml).toContain('取消')
    expect(zhHtml).toContain('应用')

    const jaHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="ja">
        <ConfirmDialog
          open
          title="確認"
          message="続行しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </StudioLocaleProvider>,
    )
    expect(jaHtml).toContain('キャンセル')
    expect(jaHtml).toContain('適用')

    const koHtml = renderToStaticMarkup(
      <StudioLocaleProvider locale="ko">
        <ConfirmDialog
          open
          title="확인"
          message="계속하시겠습니까?"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </StudioLocaleProvider>,
    )
    expect(koHtml).toContain('취소')
    expect(koHtml).toContain('적용')
  })
})
