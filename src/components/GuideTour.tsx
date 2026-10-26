import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  type TourStep,
} from '../data/tourSteps'
import type { MobilePane } from '../types'
import './GuideTour.css'

type Rect = { top: number; left: number; width: number; height: number }

type TipPos = {
  top: number
  left: number
  width: number
  /** 'sheet-top' | 'sheet-bottom' on mobile; cardinal on desktop */
  placement: 'top' | 'bottom' | 'left' | 'right' | 'sheet-top' | 'sheet-bottom'
}

type Props = {
  open: boolean
  onClose: () => void
  onPaneChange: (pane: MobilePane) => void
}

const PAD = 6
const GAP = 12
const EDGE = 10
const DESKTOP_TIP_W = 300

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 900px)').matches
}

function headerBottom(): number {
  const el = document.querySelector('.theme-top')
  return el ? Math.ceil(el.getBoundingClientRect().bottom) : 0
}

function footerTop(): number {
  const el = document.querySelector('.bottom-nav')
  return el ? Math.floor(el.getBoundingClientRect().top) : window.innerHeight
}

/** Where the target lives relative to sticky chrome. */
function chromeZone(el: Element): 'header' | 'footer' | 'content' {
  if (el.closest('.theme-top')) return 'header'
  if (el.closest('.bottom-nav')) return 'footer'
  return 'content'
}

function prepareTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null
  const el = document.querySelector(step.target)
  if (!(el instanceof HTMLElement)) return null

  if (step.expandDetails) {
    const details =
      el instanceof HTMLDetailsElement ? el : el.closest('details')
    if (details && !details.open) details.open = true
  }

  // Hidden pane → treat as missing (display:none has 0×0 rect and causes fake highlights)
  const r = el.getBoundingClientRect()
  if (r.width < 4 || r.height < 4) return null
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return null
  // Parent with display none
  let p: HTMLElement | null = el.parentElement
  while (p) {
    if (getComputedStyle(p).display === 'none') return null
    p = p.parentElement
  }

  return el
}

/** Real element box clipped only to the viewport — never invent a fake box. */
function spotlightRect(el: HTMLElement): Rect | null {
  const r = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const left = Math.max(4, r.left - PAD)
  const top = Math.max(4, r.top - PAD)
  const right = Math.min(vw - 4, r.right + PAD)
  const bottom = Math.min(vh - 4, r.bottom + PAD)

  const width = right - left
  const height = bottom - top
  if (width < 8 || height < 8) return null

  return { top, left, width, height }
}

function scrollContentTarget(
  el: HTMLElement,
  sheet: 'sheet-top' | 'sheet-bottom',
  tipH: number,
): void {
  const hb = headerBottom()
  const ft = footerTop()
  const bandTop =
    sheet === 'sheet-top' ? hb + tipH + GAP + 4 : hb + 8
  const bandBottom =
    sheet === 'sheet-bottom' ? ft - tipH - GAP - 4 : ft - 8

  if (bandBottom - bandTop < 60) return

  const apply = () => {
    const r = el.getBoundingClientRect()
    // Put the top of the target near the top of the free band
    const ideal = bandTop + 10
    const maxTop = bandBottom - Math.min(r.height, (bandBottom - bandTop) * 0.9)
    const want = Math.min(Math.max(ideal, bandTop), maxTop)
    const delta = r.top - want
    if (Math.abs(delta) > 2) {
      window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
    }
  }

  apply()

  let parent: HTMLElement | null = el.parentElement
  while (parent && parent !== document.body) {
    const st = getComputedStyle(parent)
    if (
      /(auto|scroll)/.test(st.overflowY) &&
      parent.scrollHeight > parent.clientHeight + 4
    ) {
      const er = el.getBoundingClientRect()
      parent.scrollTop += er.top - (bandTop + 10)
      apply()
      break
    }
    parent = parent.parentElement
  }
  apply()
}

function pickMobileSheet(
  zone: 'header' | 'footer' | 'content',
  prefer: TourStep['prefer'],
): 'sheet-top' | 'sheet-bottom' {
  if (zone === 'header') return 'sheet-bottom'
  if (zone === 'footer') return 'sheet-top'
  if (prefer === 'top') return 'sheet-top'
  if (prefer === 'bottom') return 'sheet-bottom'
  return 'sheet-bottom'
}

function placeMobileTip(
  sheet: 'sheet-top' | 'sheet-bottom',
  tipH: number,
): TipPos {
  const vw = window.innerWidth
  const width = Math.min(vw - EDGE * 2, 440)
  const left = (vw - width) / 2
  const hb = headerBottom()
  const ft = footerTop()

  if (sheet === 'sheet-top') {
    return {
      top: Math.max(EDGE, hb + 6),
      left,
      width,
      placement: 'sheet-top',
    }
  }
  return {
    top: Math.min(ft - tipH - 6, window.innerHeight - tipH - EDGE),
    left,
    width,
    placement: 'sheet-bottom',
  }
}

function placeDesktopTip(
  spot: Rect | null,
  prefer: TourStep['prefer'],
  tipH: number,
): TipPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tipW = Math.min(DESKTOP_TIP_W, vw - EDGE * 2)

  if (!spot) {
    return {
      top: Math.max(EDGE, (vh - tipH) / 2),
      left: Math.max(EDGE, (vw - tipW) / 2),
      width: tipW,
      placement: 'bottom',
    }
  }

  const above = spot.top - EDGE
  const below = vh - (spot.top + spot.height) - EDGE
  const tryOrder: Array<'top' | 'bottom' | 'left' | 'right'> = []
  if (prefer && prefer !== 'auto') tryOrder.push(prefer)
  for (const s of ['bottom', 'top', 'right', 'left'] as const) {
    if (!tryOrder.includes(s)) tryOrder.push(s)
  }

  for (const placement of tryOrder) {
    let top = 0
    let left = spot.left + spot.width / 2 - tipW / 2
    if (placement === 'bottom' && below >= tipH + GAP) {
      top = spot.top + spot.height + GAP
    } else if (placement === 'top' && above >= tipH + GAP) {
      top = spot.top - tipH - GAP
    } else if (
      placement === 'right' &&
      vw - (spot.left + spot.width) >= tipW + GAP
    ) {
      top = spot.top
      left = spot.left + spot.width + GAP
    } else if (placement === 'left' && spot.left >= tipW + GAP) {
      top = spot.top
      left = spot.left - tipW - GAP
    } else {
      continue
    }
    top = Math.min(Math.max(EDGE, top), vh - tipH - EDGE)
    left = Math.min(Math.max(EDGE, left), vw - tipW - EDGE)
    return { top, left, width: tipW, placement }
  }

  return {
    top: EDGE,
    left: Math.max(EDGE, (vw - tipW) / 2),
    width: tipW,
    placement: 'bottom',
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function GuideTour({ open, onClose, onPaneChange }: Props) {
  const [index, setIndex] = useState(0)
  const [mobile, setMobile] = useState(() => isMobileViewport())
  const [spot, setSpot] = useState<Rect | null>(null)
  const [tip, setTip] = useState<TipPos>({
    top: 80,
    left: 16,
    width: 320,
    placement: 'sheet-bottom',
  })
  const tipRef = useRef<HTMLDivElement>(null)
  const genRef = useRef(0)

  const steps = TOUR_STEPS.filter((s) => !(s.mobileOnly && !mobile))
  const step = steps[index] ?? steps[0]

  const finish = useCallback(() => {
    genRef.current += 1
    markTourSeen()
    onClose()
  }, [onClose])

  const goNext = useCallback(() => {
    if (index >= steps.length - 1) {
      finish()
      return
    }
    setIndex((i) => i + 1)
  }, [index, steps.length, finish])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  // Reset highlight immediately on step change — never keep a stale spotlight
  useLayoutEffect(() => {
    if (!open) return
    setSpot(null)
  }, [open, index])

  useEffect(() => {
    if (!open) return
    setIndex(0)
  }, [open])

  useLayoutEffect(() => {
    if (!open || !step) return

    const gen = ++genRef.current
    let cancelled = false

    const run = async () => {
      const isMobile = isMobileViewport()
      setMobile(isMobile)

      // 1) Switch pane first and wait until the target can exist
      if (step.pane && isMobile) {
        onPaneChange(step.pane)
        await new Promise((r) => window.setTimeout(r, 200))
        if (cancelled || gen !== genRef.current) return
      }

      // Measure tip natural height (no maxHeight clamp)
      const tipEl = tipRef.current
      let tipH = 160
      if (tipEl) {
        tipEl.style.maxHeight = 'none'
        tipH = Math.ceil(tipEl.scrollHeight)
      }
      const maxTip = Math.floor(window.innerHeight * 0.4)
      tipH = Math.min(Math.max(tipH, 140), maxTip)

      if (!step.target) {
        if (cancelled || gen !== genRef.current) return
        setSpot(null)
        if (isMobile) {
          setTip(placeMobileTip('sheet-bottom', tipH))
        } else {
          setTip(placeDesktopTip(null, step.prefer, tipH))
        }
        return
      }

      // 2) Wait for target to be visible in the active pane
      let el: HTMLElement | null = null
      for (let i = 0; i < 16; i += 1) {
        if (cancelled || gen !== genRef.current) return
        el = prepareTarget(step)
        if (el) break
        await new Promise((r) => window.setTimeout(r, 50))
      }

      if (!el) {
        // Don't keep a wrong highlight — skip empty
        setSpot(null)
        return
      }

      const zone = chromeZone(el)
      const sheet = pickMobileSheet(zone, step.prefer)

      // 3) Scroll content targets into the free band (header/footer targets stay put)
      if (zone === 'content' && isMobile) {
        scrollContentTarget(el, sheet, tipH)
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        if (cancelled || gen !== genRef.current) return
        if (step.expandDetails) {
          el = prepareTarget(step) ?? el
          scrollContentTarget(el, sheet, tipH)
          await new Promise((r) => window.setTimeout(r, 40))
        }
      }

      if (cancelled || gen !== genRef.current) return

      el = prepareTarget(step)
      if (!el) {
        setSpot(null)
        return
      }

      // 4) Spotlight = the REAL element only
      const nextSpot = spotlightRect(el)
      setSpot(nextSpot)

      if (isMobile) {
        setTip(placeMobileTip(sheet, tipH))
      } else {
        setTip(placeDesktopTip(nextSpot, step.prefer, tipH))
      }

      // Re-measure tip after placement styles apply
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (cancelled || gen !== genRef.current) return
      if (tipRef.current) {
        tipRef.current.style.maxHeight = 'none'
        const h = Math.min(
          Math.max(Math.ceil(tipRef.current.scrollHeight), 140),
          maxTip,
        )
        if (isMobile) {
          setTip(placeMobileTip(sheet, h))
          // Re-scroll once tip height is final
          if (zone === 'content') {
            const latest = prepareTarget(step)
            if (latest) scrollContentTarget(latest, sheet, h)
          }
        }
      }

      // Final spotlight after scroll settle
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (cancelled || gen !== genRef.current) return
      const finalEl = prepareTarget(step)
      setSpot(finalEl ? spotlightRect(finalEl) : null)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [open, index, step, onPaneChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    const onResize = () => setMobile(isMobileViewport())
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open, finish, goNext, goPrev])

  // Keep spotlight glued to the real element while scrolling
  useEffect(() => {
    if (!open || !step?.target) return
    const sync = () => {
      const el = prepareTarget(step)
      setSpot(el ? spotlightRect(el) : null)
    }
    window.addEventListener('scroll', sync, true)
    return () => window.removeEventListener('scroll', sync, true)
  }, [open, step])

  if (!open || !step) return null

  const isSheet =
    tip.placement === 'sheet-top' || tip.placement === 'sheet-bottom'

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {spot ? (
        <>
          <button
            type="button"
            className="tour__catch"
            aria-label="Закрити підказки"
            onClick={finish}
          />
          <div
            className="tour__spotlight"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
            }}
            aria-hidden
          />
        </>
      ) : (
        <button
          type="button"
          className="tour__dim"
          aria-label="Закрити підказки"
          onClick={finish}
        />
      )}

      <div
        ref={tipRef}
        className={`tour__tip tour__tip--${tip.placement}${
          spot ? '' : ' tour__tip--center'
        }${mobile ? ' tour__tip--mobile' : ''}${isSheet ? ' tour__tip--sheet' : ''}`}
        style={{
          top: tip.top,
          left: tip.left,
          width: tip.width,
          maxWidth: `calc(100vw - ${EDGE * 2}px)`,
        }}
      >
        <div className="tour__progress">
          <span>
            {index + 1} / {steps.length}
          </span>
          <button type="button" className="tour__skip" onClick={finish}>
            Пропустити
          </button>
        </div>
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <p className="tour__body">{step.body}</p>
        <div className="tour__actions">
          <button
            type="button"
            className="tour__btn tour__btn--ghost"
            onClick={goPrev}
            disabled={index === 0}
          >
            Назад
          </button>
          <button
            type="button"
            className="tour__btn tour__btn--primary"
            onClick={goNext}
          >
            {index >= steps.length - 1 ? 'Готово' : 'Далі'}
          </button>
        </div>
      </div>
    </div>
  )
}

type HelpBtnProps = {
  onClick: () => void
}

export function HelpButton({ onClick }: HelpBtnProps) {
  return (
    <button
      type="button"
      className="help-btn"
      data-tour="help"
      aria-label="Показати підказки"
      title="Підказки"
      onClick={onClick}
    >
      <span className="help-btn__mark" aria-hidden>
        ?
      </span>
    </button>
  )
}
