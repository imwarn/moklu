/**
 * [INPUT]: depends on react (Component, type ErrorInfo, type MouseEvent, type ReactNode), buildLocalizedPath and LocaleCode from @/seo, and clearChunkReloadGuard/triggerFreshReload from @/utils/chunkRecovery
 * [OUTPUT]: exports ChunkErrorBoundary component and ChunkErrorBoundaryProps providing localized EN/ZH/JA/KO recovery UI for failed lazy chunks without crashing to a blank screen
 * [POS]: resilient error boundary inside src/components/common; wraps lazy StudioPage in App.tsx, LocalizationView in StudioPage.tsx, and HelpModal in Toolbar.tsx
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Component, type ErrorInfo, type MouseEvent, type ReactNode } from 'react'
import { buildLocalizedPath, type LocaleCode } from '@/seo'
import { clearChunkReloadGuard, triggerFreshReload } from '@/utils/chunkRecovery'

interface RecoveryCopy {
  title: string
  description: string
  reloadLabel: string
  backLabel: string
  dismissLabel: string
}

const RECOVERY_COPY: Record<LocaleCode, RecoveryCopy> = {
  en: {
    title: 'Studio assets updated',
    description: 'A newer version of Moklu Studio was deployed or a module failed to load. Refresh to load the latest version.',
    reloadLabel: 'Refresh Page',
    backLabel: '← Back to Tools',
    dismissLabel: 'Close',
  },
  zh: {
    title: 'Studio 资源已更新',
    description: 'Studio 资源已更新，请点击刷新加载最新版本。',
    reloadLabel: '刷新页面',
    backLabel: '← 返回工具箱',
    dismissLabel: '关闭',
  },
  ja: {
    title: 'Studio アセットが更新されました',
    description: 'Moklu Studio の最新バージョンが公開されました。ページを再読み込みして最新版を読み込んでください。',
    reloadLabel: 'ページを再読み込み',
    backLabel: '← ツール一覧へ戻る',
    dismissLabel: '閉じる',
  },
  ko: {
    title: 'Studio 리소스가 업데이트되었습니다',
    description: 'Moklu Studio 최신 버전이 배포되었습니다. 새로고침하여 최신 버전을 불러와 주세요.',
    reloadLabel: '페이지 새로고침',
    backLabel: '← 도구 목록으로',
    dismissLabel: '닫기',
  },
}

export interface ChunkErrorBoundaryProps {
  locale?: LocaleCode
  homeHref?: string
  onNavigateHome?: () => void
  variant?: 'page' | 'inline'
  onReset?: () => void
  onReload?: () => void
  children: ReactNode
}

interface ChunkErrorBoundaryState {
  hasError: boolean
}

export class ChunkErrorBoundary extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  state: ChunkErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ChunkErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Moklu] Lazy module failed to render', error, info.componentStack)
  }

  private handleReload = (): void => {
    clearChunkReloadGuard()
    if (this.props.onReload) {
      this.props.onReload()
      return
    }
    void triggerFreshReload()
  }

  private handleDismiss = (): void => {
    this.setState({ hasError: false })
    this.props.onReset?.()
  }

  private handleHomeClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (
      this.props.onNavigateHome &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault()
      this.setState({ hasError: false })
      this.props.onNavigateHome()
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    const locale = this.props.locale ?? 'en'
    const copy = RECOVERY_COPY[locale] ?? RECOVERY_COPY.en
    const homeHref = this.props.homeHref ?? buildLocalizedPath(locale, '')

    if (this.props.variant === 'inline') {
      return (
        <div
          role="alert"
          data-testid="chunk-error-boundary-inline"
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-white/15 bg-[#18181f] p-4 text-[#e8e8f0] shadow-2xl"
        >
          <p className="text-sm font-semibold text-white">{copy.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#a0a0b4]">{copy.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-accent-strong px-3 py-1.5 text-xs font-semibold text-accent-fg hover:bg-accent-strong/90"
            >
              {copy.reloadLabel}
            </button>
            <button
              type="button"
              onClick={this.handleDismiss}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#c4c4d4] hover:bg-white/5"
            >
              {copy.dismissLabel}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        role="alert"
        data-testid="chunk-error-boundary"
        className="flex h-screen w-screen items-center justify-center bg-[#0f0f13] px-4 text-[#e8e8f0]"
      >
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 text-center shadow-2xl">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent-soft text-lg text-accent-text">
            ↻
          </div>
          <h1 className="text-base font-semibold text-white">{copy.title}</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#a0a0b4]">{copy.description}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-accent-strong px-4 py-2 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-strong/90"
            >
              {copy.reloadLabel}
            </button>
            <a
              href={homeHref}
              onClick={this.handleHomeClick}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-[#d4d4e2] transition-colors hover:bg-white/5 hover:text-white"
            >
              {copy.backLabel}
            </a>
          </div>
        </div>
      </div>
    )
  }
}
