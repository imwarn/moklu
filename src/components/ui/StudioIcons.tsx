/**
 * [INPUT]: depends on react (SVGProps) and Layer type from @/types
 * [OUTPUT]: exports zero-dependency monochrome SVG icon components for Studio Toolbar, Insert panel, and Layers tree plus LayerTypeIcon dispatcher
 * [POS]: shared SVG icon set inside src/components/ui replacing emoji glyphs across Studio chrome without adding npm dependencies
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { SVGProps } from 'react'
import type { Layer } from '@/types'

export type StudioIconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

function strokeProps({ size = 14, className, ...rest }: StudioIconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    className: className ? `shrink-0 ${className}` : 'shrink-0',
    ...rest,
  }
}

// ─── Toolbar Icons ────────────────────────────────────────────────────────────

export function ArrowLeftIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

export function ProjectsIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function SparklesIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M12 3 14.3 8.7 20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3Z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
    </svg>
  )
}

export function CanvasSizeIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M4 9h16" />
    </svg>
  )
}

export function ReplaceImageIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

export function TemplatesIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="3" y="3" width="18" height="6" rx="1.5" />
      <rect x="3" y="12" width="8" height="9" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </svg>
  )
}

export function PaletteIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="13.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9Z" />
    </svg>
  )
}

export function UndoIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

export function RedoIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  )
}

export function GroupIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  )
}

export function DownloadIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  )
}

export function LoaderIcon({ className, ...props }: StudioIconProps) {
  return (
    <svg {...strokeProps({ ...props, className: className ? `animate-spin ${className}` : 'animate-spin' })}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  )
}

export function GlobeIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M12 3a14.5 14.5 0 0 0 0 18" />
      <path d="M12 3a14.5 14.5 0 0 1 0 18" />
    </svg>
  )
}

export function SettingsIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.25.4-1.51 1Z" />
    </svg>
  )
}

export function LanguagesIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  )
}

export function HelpCircleIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function GitHubIcon({ size = 14, className, ...rest }: StudioIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
      {...rest}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

export function MoreHorizontalIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ─── Insert Panel & Layer Tree Icons ──────────────────────────────────────────

export function SmartphoneIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <line x1="10.5" y1="5.5" x2="13.5" y2="5.5" />
      <circle cx="12" cy="18.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TypeIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}

export function SquareIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
    </svg>
  )
}

export function SmileIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2" />
      <circle cx="9" cy="9.75" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.75" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChipIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="3" y="7" width="18" height="10" rx="5" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="12" x2="17" y2="12" />
    </svg>
  )
}

export function TagIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.83 8.83a2 2 0 0 0 2.83 0l6.17-6.17a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ImageIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.4" />
      <path d="m21 16-4.5-4.5a1.5 1.5 0 0 0-2.12 0L6 20" />
    </svg>
  )
}

export function LockIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function UnlockIcon(props: StudioIconProps) {
  return (
    <svg {...strokeProps(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.46-2" />
    </svg>
  )
}

export function LayerTypeIcon({
  type,
  size = 13,
  className,
}: {
  type: Layer['type']
  size?: number
  className?: string
}) {
  const props = { size, className }
  switch (type) {
    case 'background':
      return <PaletteIcon {...props} />
    case 'phone':
      return <SmartphoneIcon {...props} />
    case 'text':
      return <TypeIcon {...props} />
    case 'image':
      return <ImageIcon {...props} />
    case 'shape':
      return <SquareIcon {...props} />
    case 'emoji':
      return <SmileIcon {...props} />
    case 'brand':
      return <TagIcon {...props} />
    case 'group':
      return <GroupIcon {...props} />
  }
}
