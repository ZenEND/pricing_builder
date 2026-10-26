import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { BottomNav } from './components/BottomNav'
import { Editor } from './components/Editor'
import { GuideTour, hasSeenTour } from './components/GuideTour'
import { PriceListPreview } from './components/PriceListPreview'
import { ThemeTopBar } from './components/ThemeTopBar'
import { defaultItems } from './data/services'
import type { DesignTheme, MobilePane, PriceItem } from './types'
import { THEMES } from './types'
import { exportPriceListPdf } from './utils/exportPdf'
import {
  flattenGroups,
  groupEndIndex,
  groupPriceItems,
} from './utils/itemGroups'
import { loadPersistedState, savePersistedState } from './utils/storage'
import './App.css'

const PDF_BASENAME = 'preyskurant'

function createId(): string {
  return crypto.randomUUID()
}

function newService(): PriceItem {
  return {
    id: createId(),
    title: 'Нова послуга',
    price: '0грн',
  }
}

function newSubService(): PriceItem {
  return {
    id: createId(),
    title: 'Підпункт',
    price: '+0грн',
    indented: true,
  }
}

export default function App() {
  const initial = loadPersistedState()
  const [theme, setTheme] = useState<DesignTheme>(initial.theme)
  const [items, setItems] = useState<PriceItem[]>(initial.items)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobilePane, setMobilePane] = useState<MobilePane>(initial.mobilePane)
  const [tourOpen, setTourOpen] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const paneScrollRef = useRef({ edit: 0, preview: 0 })
  const prevPaneRef = useRef<MobilePane>(mobilePane)

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--bottom-nav-space',
      'calc(4.6rem + env(safe-area-inset-bottom))',
    )
  }, [])

  useEffect(() => {
    savePersistedState({ theme, items, mobilePane })
  }, [theme, items, mobilePane])

  // Mobile: both panes scroll the page; keep each tab's scroll when switching
  useLayoutEffect(() => {
    const prev = prevPaneRef.current
    if (prev === mobilePane) return

    const isMobile = window.matchMedia('(max-width: 900px)').matches
    if (!isMobile) {
      prevPaneRef.current = mobilePane
      return
    }

    // Don't fight the guide tour's own scroll-into-view
    if (tourOpen) {
      prevPaneRef.current = mobilePane
      return
    }

    paneScrollRef.current[prev] = window.scrollY
    prevPaneRef.current = mobilePane

    const y = paneScrollRef.current[mobilePane] ?? 0
    window.scrollTo(0, y)
    requestAnimationFrame(() => {
      window.scrollTo(0, y)
    })
  }, [mobilePane, tourOpen])

  useEffect(() => {
    if (!hasSeenTour()) {
      const t = window.setTimeout(() => setTourOpen(true), 450)
      return () => window.clearTimeout(t)
    }
  }, [])

  const onItemChange = useCallback((id: string, patch: Partial<PriceItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }, [])

  const onAddItemAfter = useCallback((afterId: string | null) => {
    setItems((prev) => {
      if (afterId === null || prev.length === 0) {
        return [...prev, newService()]
      }
      const end = groupEndIndex(prev, afterId)
      if (end < 0) return [...prev, newService()]
      const next = [...prev]
      next.splice(end + 1, 0, newService())
      return next
    })
  }, [])

  const onAddChild = useCallback((parentId: string) => {
    setItems((prev) => {
      const end = groupEndIndex(prev, parentId)
      if (end < 0) return prev
      const next = [...prev]
      next.splice(end + 1, 0, newSubService())
      return next
    })
  }, [])

  const onRemoveItem = useCallback((id: string) => {
    setItems((prev) => {
      const groups = groupPriceItems(prev)
      const group = groups.find(
        (g) => g.parent.id === id || g.children.some((c) => c.id === id),
      )
      if (!group) return prev.filter((item) => item.id !== id)

      // Removing a parent also removes its sub-items
      if (group.parent.id === id) {
        const removeIds = new Set([
          group.parent.id,
          ...group.children.map((c) => c.id),
        ])
        return prev.filter((item) => !removeIds.has(item.id))
      }

      return prev.filter((item) => item.id !== id)
    })
  }, [])

  const onMoveItem = useCallback((id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const groups = groupPriceItems(prev)
      const gIndex = groups.findIndex(
        (g) => g.parent.id === id || g.children.some((c) => c.id === id),
      )
      if (gIndex < 0) return prev

      const group = groups[gIndex]
      const isParent = group.parent.id === id

      if (isParent) {
        const swapWith = gIndex + direction
        if (swapWith < 0 || swapWith >= groups.length) return prev
        const next = [...groups]
        ;[next[gIndex], next[swapWith]] = [next[swapWith], next[gIndex]]
        return flattenGroups(next)
      }

      const childIndex = group.children.findIndex((c) => c.id === id)
      const swapChild = childIndex + direction
      if (swapChild < 0 || swapChild >= group.children.length) return prev
      const children = [...group.children]
      ;[children[childIndex], children[swapChild]] = [
        children[swapChild],
        children[childIndex],
      ]
      const next = [...groups]
      next[gIndex] = { ...group, children }
      return flattenGroups(next)
    })
  }, [])

  const onReset = useCallback(() => {
    const ok = window.confirm(
      'Скинути список до початкових цін? Поточні зміни буде втрачено.',
    )
    if (!ok) return
    setItems(defaultItems.map((item) => ({ ...item })))
    setError(null)
  }, [])

  const onThemeChange = useCallback((next: DesignTheme) => {
    setTheme(next)
    setMobilePane('preview')
  }, [])

  const onExport = useCallback(async () => {
    if (!previewRef.current) return
    setMobilePane('preview')
    setExporting(true)
    setError(null)
    // Wait for React to show the preview pane + layout/fonts before capture
    await new Promise<void>((r) => {
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    })
    await new Promise((r) => setTimeout(r, 80))
    const sheet = previewRef.current
    if (!sheet) {
      setExporting(false)
      setError('Превʼю ще не готове. Спробуйте ще раз.')
      return
    }
    try {
      await exportPriceListPdf(sheet, `${PDF_BASENAME}-${theme}`)
    } catch (err) {
      console.error(err)
      setError('Не вдалося створити PDF. Спробуйте ще раз.')
    } finally {
      setExporting(false)
    }
  }, [theme])

  return (
    <div className={`app app--pane-${mobilePane}`}>
      <div className="app__glow" aria-hidden />

      <ThemeTopBar
        theme={theme}
        onThemeChange={onThemeChange}
        onHelp={() => setTourOpen(true)}
      />

      <main className="app__layout">
        <div className="app__editor-pane">
          <Editor
            items={items}
            onItemChange={onItemChange}
            onAddItemAfter={onAddItemAfter}
            onAddChild={onAddChild}
            onRemoveItem={onRemoveItem}
            onMoveItem={onMoveItem}
            onReset={onReset}
          />
        </div>

        <section className="app__preview-pane" data-tour="preview">
          <div className="app__preview-head">
            <h2>{activeTheme.name}</h2>
            <p>{activeTheme.blurb}</p>
          </div>
          <div className="app__preview-scroll">
            <PriceListPreview
              items={items}
              theme={theme}
              previewRef={previewRef}
            />
          </div>
          {error ? <p className="app__error">{error}</p> : null}
        </section>
      </main>

      <BottomNav
        pane={mobilePane}
        exporting={exporting}
        canExport={items.length > 0}
        onPaneChange={setMobilePane}
        onExport={onExport}
      />

      <GuideTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onPaneChange={setMobilePane}
      />
    </div>
  )
}
