/** Moklu brand — a lightweight frame and a rising visual highlight. */
export function Logo() {
  return (
    <div className="flex shrink-0 select-none items-center gap-2" aria-label="Moklu Studio">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="moklu-header-mark" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#aee6d2"/><stop offset="1" stopColor="#66b9d0"/>
          </linearGradient>
        </defs>
        <rect x="3" y="5" width="26" height="22" rx="6" stroke="url(#moklu-header-mark)" strokeWidth="3"/>
        <path d="M9 22V14l7 5 7-9v12" stroke="url(#moklu-header-mark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="25.5" cy="7" r="3" fill="#f8d3b6"/>
      </svg>
      <span className="text-sm font-bold tracking-tight text-[#e9f4f5]">Moklu</span>
      <span className="hidden text-[10px] font-medium tracking-wide text-[#7c8f99] min-[1250px]:inline">STUDIO</span>
    </div>
  )
}
