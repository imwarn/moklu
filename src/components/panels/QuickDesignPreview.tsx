/**
 * [INPUT]: depends on react, getMockupSvg from @/assets/mockups/registry, getPhoneSpec from @/assets/mockups/specs, BrowserChromeOptions from @/types, QUICK_THEMES and quick types from @/utils/quickDesign, and preview geometry helpers from @/utils/quickPreview
 * [OUTPUT]: exports QuickDesignPreview and QuickDesignPreviewProps rendering a live SVG mockup preview with modal (step header + disclaimer) and workspace (clean responsive stage) variants
 * [POS]: shared lightweight mockup preview component in src/components/panels; used by Studio QuickDesignModal and Quick Workspace MockupQuickTool
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useId, useMemo } from 'react'
import { getMockupSvg } from '@/assets/mockups/registry'
import { getPhoneSpec } from '@/assets/mockups/specs'
import type { BrowserChromeOptions } from '@/types'
import { QUICK_THEMES, type QuickMockup, type QuickTheme, type QuickScreenshotFit } from '@/utils/quickDesign'
import { getQuickPreviewGeometry, makeSvgImageDataUrl, screenshotPreserveAspectRatio } from '@/utils/quickPreview'

export interface QuickDesignPreviewProps {
  width: number
  height: number
  theme: QuickTheme
  mockup: QuickMockup
  screenshotSrc?: string
  screenshotFit?: QuickScreenshotFit
  scaleFactor?: number
  browserChrome?: BrowserChromeOptions
  variant?: 'modal' | 'workspace'
}

export function QuickDesignPreview({
  width,
  height,
  theme,
  mockup,
  screenshotSrc,
  screenshotFit = 'cover',
  scaleFactor = 1,
  browserChrome,
  variant = 'modal',
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
  const clampedFactor = Number.isFinite(scaleFactor)
    ? Math.max(0.65, Math.min(1.15, scaleFactor))
    : 1
  const effectiveScale = geometry.scale * clampedFactor
  const effectiveFrameX = clampedFactor === 1
    ? geometry.frameX
    : Math.round((safeWidth - spec.frameWidth * effectiveScale) / 2)
  const effectiveFrameY = clampedFactor === 1
    ? geometry.frameY
    : Math.round((safeHeight - spec.frameHeight * effectiveScale) / 2)

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
  const placeholderFontSize = Math.max(20, Math.min(44, Math.round(Math.min(screen.width, screen.height) * 0.055)))

  const stage = (
    <div
      className={
        variant === 'workspace'
          ? 'flex h-[280px] sm:h-[340px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#111119] p-3'
          : 'flex h-[225px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#111119] p-3'
      }
    >
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
          transform={`translate(${effectiveFrameX} ${effectiveFrameY}) scale(${effectiveScale})`}
          filter={`url(#${shadowId})`}
        >
          <rect x={screen.x} y={screen.y} width={screen.width} height={screen.height}
            rx={screen.radius} fill="#151923" />
          <g clipPath={`url(#${clipId})`}>
            {screenshotSrc ? (
              <image href={screenshotSrc}
                x={screen.x} y={screen.y} width={screen.width} height={screen.height}
                preserveAspectRatio={screenshotPreserveAspectRatio(screenshotFit)} />
            ) : (
              <>
                <rect x={screen.x} y={screen.y} width={screen.width} height={screen.height}
                  fill="#252a39" />
                <text x={screen.x + screen.width / 2} y={screen.y + screen.height / 2}
                  fontFamily="Arial, sans-serif" fontSize={placeholderFontSize}
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
  )

  if (variant === 'workspace') {
    return stage
  }

  return (
    <section aria-label="Quick Design live preview" className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#dedee8]">4. Live preview</span>
        <span className="text-[11px] tabular-nums text-[#9da0b5]">
          {dimsValid ? `${width} × ${height}` : 'Invalid canvas size'}
        </span>
      </div>
      {stage}
      <p className="mt-2 text-[11px] leading-4 text-[#9194a9]">
        Updates as you choose a frame, size or style. This is a lightweight preview; use the editor for pixel-accurate adjustments and export.
      </p>
    </section>
  )
}
