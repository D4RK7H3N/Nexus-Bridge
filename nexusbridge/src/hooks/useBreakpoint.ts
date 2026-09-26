import { useEffect, useState } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function resolve(width: number): Breakpoint {
  if (width >= 1280) return 'desktop'
  if (width >= 768) return 'tablet'
  return 'mobile'
}

/** Single resize hook driving all layout switching in the shell. */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === 'undefined' ? 'desktop' : resolve(window.innerWidth),
  )
  useEffect(() => {
    const onResize = () => setBp(resolve(window.innerWidth))
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return bp
}
