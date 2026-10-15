import { useId, useMemo } from 'react'
import { getMockupSvg } from '@/assets/mockups/registry'
import { getPhoneSpec } from '@/assets/mockups/specs'
import type { BrowserChromeOptions } from '@/types'
import { QUICK_THEMES, type QuickMockup, type QuickTheme } from '@/utils/quickDesign'
import { getQuickPreviewGeometry, makeSvgImageDataUrl } from '@/utils/quickPreview'

interface QuickDesignPreviewProps {
  width: number
  height: number
  theme: QuickTheme
  mockup: QuickMockup
  screenshotSrc?: string
  browserChrome?: BrowserChromeOptions
}

export function QuickDesignPreview({
  width, height, theme, mockup, screenshotSrc, browserChrome,
}: QuickDesignPreviewProps) {
  const uid = useId().replace(/:/g, '')
  const bgId = `moklu-quick-bg-${uid}`
  const glowId = `moklu-quick-glow-${uid}`
  const shadowId = `moklu-quick-shadow-${uid}`
  const clipId = `moklu-quick-screen-${uid}`
  const palette = QUICK_THEMES[theme]
  const dimsValid = Number.isInteger(width) && Number.isInteger(height) &&
    width >= 240 && height >= 240 && width <= 4096 && height <= 4096 &&
    width * height <= 16_777_216
  const safeWidth = dimsValid ? width : 1600
  const safeHeight = dimsValid ? height : 900
  const geometry = getQuickPreviewGeometry(mockup, safeWidth, safeHeight)
  const spec = getPhoneSpec(mockup)
  const svgImageSrc = useMemo(
    () => makeSvgImageDataUrl(getMockupSvg(mockup, browserChrome)),
    [mockup, browserChrome],
  )
  const screen = {
    x: spec.screen.x,
    y: spec.screen.y,
    width: spec.screen.width,
    height: spec.screen.height,
    radius: spec.screen.cornerRadius,
  }
  const isBrowser = mockup.startsWith('browser-')

  return (
    <section aria-label="Quick Design live preview" className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#dedee8]">4. Live preview</span>
        <span className="text-[11px] tabular-nums text-[#9da0b5]">
          {dimsValid ? `${width} × ${height}` : 'Invalid canvas size'}
        </span>
      </div>
      <div className="flex h-[225px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#111119] p-3">
        <svg
          role="img"
          aria-label={`Preview of ${mockup} on a ${safeWidth} by ${safeHeight} canvas`}
          viewBox={`0 0 ${safeWidth} ${safeHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette.top} />
              <stop offset="100%" stopColor={palette.bottom} />
            </linearGradient>
            <radialGradient id={glowId}>
              <stop offset="0%" stopColor={palette.glow} stopOpacity="0.55" />
              <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
            </radialGradient>
            <filter id={shadowId} x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow dx="0" dy="17" stdDeviation="22" floodColor="#131526" floodOpacity={theme === 'midnight' ? '0.5' : '0.23'} />
            </filter>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <rect x={screen.x} y={screen.y} width={screen.width} height={screen.height} rx={screen.radius} />
            </clipPath>
          </defs>
          <rect width={safeWidth} height={safeHeight} fill={`url(#${bgId})`} />
          <ellipse cx={safeWidth * 0.6} cy={safeHeight * 0.38}
            rx={safeWidth * 0.46} ry={safeHeight * 0.48} fill={`url(#${glowId})`} />
          <g
            transform={`translate(${geometry.frameX} ${geometry.frameY}) scale(${geometry.scale})`}
            filter={`url(#${shadowId})`}
          >
            <rect x={screen.x} y={screen.y} width={screen.width} height={screen.height}
              rx={screen.radius} fill="#151923" />
            <g clipPath={`url(#${clipId})`}>
              {screenshotSrc ? (
                <image href={screenshotSrc}
                  x={screen.x} y={screen.y} width={screen.width} height={screen.height}
                  preserveAspectRatio="xMidYMid slice" />
              ) : (
                <>
                  <rect x={screen.x} y={screen.y} width={screen.width} height={screen.height}
                    fill="#252a39" />
                  <text x={screen.x + screen.width / 2} y={screen.y + screen.height / 2}
                    fontFamily="Arial, sans-serif" fontSize={isBrowser ? 28 : 22}
                    textAnchor="middle" fill="#a7b0c7">
                    Add screenshot
                  </text>
                </>
              )}
            </g>
            <image href={svgImageSrc} x={0} y={0} width={spec.frameWidth} height={spec.frameHeight} />
          </g>
        </svg>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-[#9194a9]">
        Updates as you choose a frame, size or style. This is a lightweight preview; use the editor for pixel-accurate adjustments and export.
      </p>
    </section>
  )
}
