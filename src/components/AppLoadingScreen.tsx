/**
 * [INPUT]: depends on useEffect and useState from react; depends on Logo from @/components/toolbar/Logo
 * [OUTPUT]: exports AppLoadingScreen component rendering the full-screen Studio startup overlay with fade-out unmounting
 * [POS]: top-level splash overlay in src/components; mounted by StudioPage during initial project hydration and unmounted after EXIT_DURATION_MS
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEffect, useState } from 'react'
import { Logo } from '@/components/toolbar/Logo'

const EXIT_DURATION_MS = 240

interface AppLoadingScreenProps {
  visible: boolean
}

export function AppLoadingScreen({ visible }: AppLoadingScreenProps) {
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (visible) return

    const timeoutId = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [visible])

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Moklu"
      className={`fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#0f0f13] transition-opacity duration-200 ease-out ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 43%, rgba(124,110,246,0.13) 0, rgba(124,110,246,0.035) 24%, transparent 52%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.025)]"
      />

      <div className="relative flex -translate-y-2 flex-col items-center">
        <div className="moklu-loader-enter flex items-center justify-center">
          <div className="origin-center scale-[1.65]"><Logo /></div>
        </div>

        <div className="moklu-loader-enter moklu-loader-enter-delay mt-7 flex w-full flex-col items-center gap-[13px]">
          <div className="moklu-loader-words" aria-hidden="true">
            <span className="moklu-loader-label">loading</span>
            <span className="moklu-loader-window">
              <span className="moklu-loader-word-track">
                <span>assets</span>
                <span>layouts</span>
                <span>slides</span>
                <span>thumbnails</span>
                <span>formats</span>
                <span>locales</span>
                <span>assets</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
