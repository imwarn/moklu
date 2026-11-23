/**
 * [INPUT]: depends on nanoid, BRAND_DARK and BRAND_LIGHT from @/theme/brand, makeSvgImageDataUrl from @/utils/quickPreview, and WorkspaceImageInput from ./types
 * [OUTPUT]: exports DemoVariant, createDemoScreenshotDataUrl, and createDemoImageInput for instant zero-network demo previews
 * [POS]: deterministic SVG specimen generator for src/workspace; enables 0-second previews across Mockup, Merge, Split, Compress, Resize, and ID Card tools
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { nanoid } from 'nanoid'
import { BRAND_DARK, BRAND_LIGHT } from '@/theme/brand'
import { makeSvgImageDataUrl } from '@/utils/quickPreview'
import type { WorkspaceImageInput } from './types'

export type DemoVariant =
  | 'saas'
  | 'mobile'
  | 'photo-1'
  | 'photo-2'
  | 'photo-3'
  | 'panorama'
  | 'id-front'
  | 'id-back'

export function createDemoScreenshotDataUrl(variant: DemoVariant = 'saas'): string {
  if (variant === 'mobile') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1688" viewBox="0 0 780 1688">
      <defs>
        <linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${BRAND_DARK.surface}"/><stop offset="100%" stop-color="#18181b"/>
        </linearGradient>
        <linearGradient id="mcard" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${BRAND_LIGHT.accentStrong}"/><stop offset="100%" stop-color="${BRAND_LIGHT.accent}"/>
        </linearGradient>
      </defs>
      <rect width="780" height="1688" fill="url(#mbg)"/>
      <rect x="48" y="140" width="684" height="320" rx="36" fill="url(#mcard)"/>
      <text x="92" y="236" fill="#ffffff" font-family="system-ui,sans-serif" font-size="34" font-weight="700">Moklu Analytics</text>
      <text x="92" y="328" fill="#ffffff" font-family="system-ui,sans-serif" font-size="78" font-weight="800">+184%</text>
      <text x="92" y="392" fill="${BRAND_LIGHT.accentSoft}" font-family="system-ui,sans-serif" font-size="28">Local-first exports this week</text>
      <rect x="48" y="504" width="684" height="220" rx="28" fill="${BRAND_DARK.panel}"/>
      <rect x="88" y="556" width="220" height="24" rx="12" fill="#a1a1aa"/>
      <rect x="88" y="608" width="460" height="18" rx="9" fill="#52525b"/>
      <rect x="88" y="654" width="380" height="18" rx="9" fill="#3f3f46"/>
      <rect x="48" y="764" width="324" height="280" rx="28" fill="${BRAND_DARK.panel}"/>
      <rect x="408" y="764" width="324" height="280" rx="28" fill="${BRAND_DARK.panel}"/>
      <circle cx="140" cy="856" r="36" fill="${BRAND_DARK.accent}" opacity="0.9"/>
      <circle cx="500" cy="856" r="36" fill="${BRAND_DARK.success}" opacity="0.9"/>
      <rect x="48" y="1084" width="684" height="440" rx="28" fill="${BRAND_DARK.panel}"/>
      <polyline points="96,1420 210,1340 330,1380 460,1210 580,1250 684,1140" fill="none" stroke="${BRAND_DARK.accentText}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
    return makeSvgImageDataUrl(svg)
  }

  if (variant === 'photo-1' || variant === 'photo-2' || variant === 'photo-3') {
    const palettes = {
      'photo-1': { a: '#18181b', b: '#3f3f46', label: '01 · Hero Capture', stat: '16:10 · Crisp UI' },
      'photo-2': { a: BRAND_LIGHT.accentStrong, b: '#ea580c', label: '02 · Feature Highlight', stat: 'Zero-Upload Engine' },
      'photo-3': { a: '#0f766e', b: '#115e59', label: '03 · Export Ready', stat: 'PNG · WebP · ZIP' },
    }[variant]
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palettes.a}"/><stop offset="100%" stop-color="${palettes.b}"/>
        </linearGradient>
      </defs>
      <rect width="960" height="640" fill="url(#pg)"/>
      <circle cx="780" cy="140" r="180" fill="#ffffff" opacity="0.12"/>
      <rect x="64" y="64" width="832" height="512" rx="28" fill="${BRAND_DARK.surface}" opacity="0.28"/>
      <text x="112" y="250" fill="#ffffff" font-family="system-ui,sans-serif" font-size="52" font-weight="800">${palettes.label}</text>
      <text x="112" y="324" fill="#fafafa" font-family="system-ui,sans-serif" font-size="30" opacity="0.9">${palettes.stat}</text>
      <rect x="112" y="390" width="280" height="52" rx="26" fill="#ffffff" opacity="0.2"/>
      <text x="152" y="425" fill="#ffffff" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Moklu Local Studio</text>
    </svg>`
    return makeSvgImageDataUrl(svg)
  }

  if (variant === 'panorama') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1000" viewBox="0 0 2400 1000">
      <defs>
        <linearGradient id="pan" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stop-color="${BRAND_DARK.surface}"/>
          <stop offset="55%" stop-color="#27272a"/>
          <stop offset="100%" stop-color="${BRAND_LIGHT.accentStrong}"/>
        </linearGradient>
      </defs>
      <rect width="2400" height="1000" fill="url(#pan)"/>
      <circle cx="420" cy="300" r="240" fill="#fafafa" opacity="0.08"/>
      <circle cx="1220" cy="640" r="320" fill="${BRAND_DARK.accent}" opacity="0.2"/>
      <circle cx="1980" cy="340" r="260" fill="${BRAND_DARK.warning}" opacity="0.18"/>
      <path d="M0 780 Q 480 540 960 720 T 1920 660 T 2400 760 L 2400 1000 L 0 1000 Z" fill="${BRAND_DARK.surface}" opacity="0.5"/>
      <text x="140" y="470" fill="#ffffff" font-family="system-ui,sans-serif" font-size="84" font-weight="800">SEAMLESS PANORAMA</text>
      <text x="140" y="560" fill="#e4e4e7" font-family="system-ui,sans-serif" font-size="42">Slide 1 → Slide 2 → Slide 3 · Built for Social Carousels</text>
    </svg>`
    return makeSvgImageDataUrl(svg)
  }

  if (variant === 'id-front' || variant === 'id-back') {
    const isFront = variant === 'id-front'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1011" height="638" viewBox="0 0 1011 638">
      <defs>
        <linearGradient id="idg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fafafa"/><stop offset="100%" stop-color="#f4f4f5"/>
        </linearGradient>
      </defs>
      <rect width="1011" height="638" rx="34" fill="url(#idg)" stroke="#a1a1aa" stroke-width="4"/>
      <rect x="0" y="0" width="1011" height="112" rx="34" fill="#18181b"/>
      <text x="52" y="72" fill="#ffffff" font-family="system-ui,sans-serif" font-size="34" font-weight="700">${isFront ? 'SAMPLE IDENTITY CARD · FRONT' : 'SAMPLE IDENTITY CARD · BACK'}</text>
      ${isFront
        ? `<rect x="56" y="158" width="230" height="300" rx="18" fill="#d4d4d8"/>
           <circle cx="171" cy="264" r="54" fill="#71717a"/>
           <path d="M96 426 Q171 344 246 426" fill="#71717a"/>
           <text x="332" y="218" fill="#18181b" font-family="system-ui,sans-serif" font-size="36" font-weight="700">ALEX SAMPLE</text>
           <text x="332" y="276" fill="#3f3f46" font-family="system-ui,sans-serif" font-size="24">DEMO SPECIMEN · NOT REAL ID</text>
           <rect x="332" y="324" width="540" height="22" rx="11" fill="#a1a1aa" opacity="0.5"/>
           <rect x="332" y="372" width="420" height="22" rx="11" fill="#a1a1aa" opacity="0.4"/>
           <text x="56" y="574" fill="#27272a" font-family="monospace" font-size="30">ID 0000-0000-0000-SAMPLE</text>`
        : `<rect x="56" y="156" width="899" height="86" rx="10" fill="#27272a"/>
           <text x="56" y="314" fill="#18181b" font-family="system-ui,sans-serif" font-size="28" font-weight="600">ISSUING AUTHORITY: DEMO LAB</text>
           <text x="56" y="368" fill="#3f3f46" font-family="system-ui,sans-serif" font-size="24">VALIDITY: 2026.01.01 - 2036.01.01</text>
           <text x="56" y="540" fill="#52525b" font-family="monospace" font-size="26">ID&lt;&lt;SAMPLE&lt;&lt;MOKLU&lt;&lt;LOCAL&lt;&lt;ONLY&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>`}
    </svg>`
    return makeSvgImageDataUrl(svg)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
    <rect width="1440" height="900" fill="${BRAND_LIGHT.surface}"/>
    <rect x="0" y="0" width="248" height="900" fill="${BRAND_DARK.surface}"/>
    <circle cx="52" cy="56" r="16" fill="${BRAND_LIGHT.accent}"/>
    <text x="82" y="64" fill="#ffffff" font-family="system-ui,sans-serif" font-size="22" font-weight="700">Moklu Cloud</text>
    <rect x="28" y="114" width="192" height="44" rx="10" fill="#27272a"/>
    <rect x="28" y="176" width="160" height="16" rx="8" fill="#3f3f46"/>
    <rect x="28" y="216" width="142" height="16" rx="8" fill="#3f3f46"/>
    <rect x="28" y="256" width="174" height="16" rx="8" fill="#3f3f46"/>
    <text x="296" y="76" fill="${BRAND_LIGHT.ink}" font-family="system-ui,sans-serif" font-size="30" font-weight="800">Product Launch Overview</text>
    <rect x="1170" y="42" width="214" height="44" rx="12" fill="${BRAND_LIGHT.accentStrong}"/>
    <text x="1216" y="71" fill="#ffffff" font-family="system-ui,sans-serif" font-size="16" font-weight="600">Export 4K PNG</text>
    <rect x="296" y="116" width="340" height="170" rx="20" fill="${BRAND_LIGHT.panel}" stroke="${BRAND_LIGHT.border}" stroke-width="2"/>
    <rect x="664" y="116" width="340" height="170" rx="20" fill="${BRAND_LIGHT.panel}" stroke="${BRAND_LIGHT.border}" stroke-width="2"/>
    <rect x="1032" y="116" width="352" height="170" rx="20" fill="${BRAND_LIGHT.panel}" stroke="${BRAND_LIGHT.border}" stroke-width="2"/>
    <text x="326" y="162" fill="${BRAND_LIGHT.muted}" font-family="system-ui,sans-serif" font-size="17">Conversion Lift</text>
    <text x="326" y="232" fill="${BRAND_LIGHT.ink}" font-family="system-ui,sans-serif" font-size="48" font-weight="800">+42.8%</text>
    <text x="694" y="162" fill="${BRAND_LIGHT.muted}" font-family="system-ui,sans-serif" font-size="17">Processing Latency</text>
    <text x="694" y="232" fill="${BRAND_LIGHT.accentText}" font-family="system-ui,sans-serif" font-size="48" font-weight="800">12 ms</text>
    <text x="1062" y="162" fill="${BRAND_LIGHT.muted}" font-family="system-ui,sans-serif" font-size="17">Privacy Score</text>
    <text x="1062" y="232" fill="${BRAND_LIGHT.success}" font-family="system-ui,sans-serif" font-size="48" font-weight="800">100%</text>
    <rect x="296" y="316" width="1088" height="532" rx="24" fill="${BRAND_LIGHT.panel}" stroke="${BRAND_LIGHT.border}" stroke-width="2"/>
    <text x="336" y="372" fill="${BRAND_LIGHT.ink}" font-family="system-ui,sans-serif" font-size="22" font-weight="700">Weekly Visual Exports</text>
    <path d="M346 740 L486 640 L626 680 L766 530 L906 565 L1046 460 L1186 490 L1326 400" fill="none" stroke="${BRAND_LIGHT.accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="1326" cy="400" r="12" fill="${BRAND_LIGHT.accentStrong}"/>
  </svg>`
  return makeSvgImageDataUrl(svg)
}

export function createDemoImageInput(variant: DemoVariant, name: string): WorkspaceImageInput {
  const dims: Record<DemoVariant, { w: number; h: number }> = {
    saas: { w: 1440, h: 900 },
    mobile: { w: 780, h: 1688 },
    'photo-1': { w: 960, h: 640 },
    'photo-2': { w: 960, h: 640 },
    'photo-3': { w: 960, h: 640 },
    panorama: { w: 2400, h: 1000 },
    'id-front': { w: 1011, h: 638 },
    'id-back': { w: 1011, h: 638 },
  }
  const dataUrl = createDemoScreenshotDataUrl(variant)
  return {
    id: nanoid(10),
    name,
    width: dims[variant].w,
    height: dims[variant].h,
    dataUrl,
    sizeBytes: dataUrl.length,
    mimeType: 'image/svg+xml',
  }
}
