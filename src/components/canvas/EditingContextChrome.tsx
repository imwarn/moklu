/**
 * [INPUT]: depends on react (useLayoutEffect, useRef, useState, ReactNode)
 * [OUTPUT]: exports SlidingUnderline and HorizontalScrollAffordance layout helpers
 * [POS]: shared animated tab-strip chrome extracted from EditingContext.tsx inside src/components/canvas
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useLayoutEffect, useRef, useState } from 'react'

/** Sliding active-tab underline measuring layout offsetLeft/offsetWidth. */
export function SlidingUnderline({
  accentClass,
  activeKey,
  enabled = true,
}: {
  accentClass: string
  activeKey: string
  enabled?: boolean
}) {
  const barRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const bar = barRef.current
    const row = bar?.parentElement
    if (!bar || !row) return

    const target = enabled
      ? row.querySelector<HTMLElement>(`[data-tab-key="${CSS.escape(activeKey)}"]`)
      : null

    if (!target) {
      bar.style.opacity = '0'
      return
    }

    const measure = () => {
      bar.style.transform = `translateX(${target.offsetLeft}px)`
      bar.style.width = `${target.offsetWidth}px`
      bar.style.opacity = '1'
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(row)
    observer.observe(target)
    return () => observer.disconnect()
  }, [activeKey, enabled])

  return (
    <span
      ref={barRef}
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 rounded-full opacity-0 transition-[transform,width,opacity] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${accentClass}`}
    />
  )
}

/** Keeps compact tab rows legible when their contents outgrow the editor chrome. */
export function HorizontalScrollAffordance({
  children,
  className = '',
  containerClassName = '',
}: {
  children: React.ReactNode
  className?: string
  containerClassName?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const updateEdges = () => {
      const overflow = element.scrollWidth > element.clientWidth + 1
      setEdges({
        start: overflow && element.scrollLeft > 1,
        end: overflow && element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      })
    }
    const frame = requestAnimationFrame(updateEdges)
    const observer = new ResizeObserver(updateEdges)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    element.addEventListener('scroll', updateEdges, { passive: true })
    element.addEventListener('transitionend', updateEdges)
    window.addEventListener('resize', updateEdges)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      element.removeEventListener('scroll', updateEdges)
      element.removeEventListener('transitionend', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [])

  return (
    <div className={`relative min-w-0 flex-1 ${containerClassName}`}>
      <div ref={scrollRef} className={`h-full min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
        {children}
      </div>
      {edges.start && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-7 bg-gradient-to-r from-[#18181f] via-[#18181f]/90 to-transparent" />}
      {edges.end && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-9 items-center justify-end bg-gradient-to-l from-[#18181f] via-[#18181f]/90 to-transparent pr-1 text-xs text-[#8d8997]">›</span>}
    </div>
  )
}
