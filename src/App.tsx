import { useCallback, useEffect, useRef, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { Editor } from './components/Editor'
import { PriceListPreview } from './components/PriceListPreview'
import { ThemeTopBar } from './components/ThemeTopBar'
import { defaultItems } from './data/services'
import type { DesignTheme, MobilePane, PriceItem } from './types'
import { THEMES } from './types'
import { exportPriceListPdf } from './utils/exportPdf'
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

export default function App() {
  const [theme, setTheme] = useState<DesignTheme>('marble')
  const [items, setItems] = useState<PriceItem[]>(defaultItems)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobilePane, setMobilePane] = useState<MobilePane>('preview')
  const previewRef = useRef<HTMLDivElement>(null)

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--bottom-nav-space',
      'calc(4.6rem + env(safe-area-inset-bottom))',
    )
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
      const index = prev.findIndex((item) => item.id === afterId)
      if (index < 0) return [...prev, newService()]
      const next = [...prev]
      next.splice(index + 1, 0, newService())
      return next
    })
  }, [])

  const onRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const onMoveItem = useCallback((id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev
      const copy = [...prev]
      ;[copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]]
      return copy
    })
  }, [])

  const onReset = useCallback(() => {
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
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    try {
      await exportPriceListPdf(previewRef.current, `${PDF_BASENAME}-${theme}`)
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

      <ThemeTopBar theme={theme} onThemeChange={onThemeChange} />

      <main className="app__layout">
        <div className="app__editor-pane">
          <Editor
            items={items}
            onItemChange={onItemChange}
            onAddItemAfter={onAddItemAfter}
            onRemoveItem={onRemoveItem}
            onMoveItem={onMoveItem}
            onReset={onReset}
          />
        </div>

        <section className="app__preview-pane">
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
    </div>
  )
}
