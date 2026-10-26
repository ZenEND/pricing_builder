import type { DesignTheme, PriceItem } from '../types'
import './PriceListPreview.css'

type Props = {
  items: PriceItem[]
  theme: DesignTheme
  previewRef: React.RefObject<HTMLDivElement | null>
}

const PHOTO_THEMES: Record<DesignTheme, string> = {
  marble: 'marble.jpg',
  silk: 'silk.jpg',
  frost: 'frost.jpg',
  newyear: 'newyear.jpg',
  linen: 'linen.jpg',
  inkwash: 'inkwash.jpg',
  botanical: 'botanical.jpg',
  copper: 'copper.jpg',
  mauve: 'mauve.jpg',
}

const VEIL_CLASS: Record<DesignTheme, string> = {
  marble: 'pl-decor--veil-light',
  silk: 'pl-decor--veil-warm',
  frost: 'pl-decor--veil-frost',
  newyear: 'pl-decor--veil-ny',
  linen: 'pl-decor--veil-linen',
  inkwash: 'pl-decor--veil-ink',
  botanical: 'pl-decor--veil-botanical',
  copper: 'pl-decor--veil-copper',
  mauve: 'pl-decor--veil-mauve',
}

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\//, '')}`
}

function Row({ item }: { item: PriceItem }) {
  const hasPrice = Boolean(item.price)

  return (
    <li
      className={`pl-row${item.indented ? ' pl-row--indent' : ''}${
        item.subtitle ? ' pl-row--sub' : ''
      }${!hasPrice ? ' pl-row--no-price' : ''}`}
    >
      <div className="pl-row__main">
        <div className="pl-row__copy">
          <span className="pl-row__title">{item.title}</span>
          {item.subtitle ? (
            <span className="pl-row__subtitle">{item.subtitle}</span>
          ) : null}
        </div>
        {hasPrice ? (
          <>
            <span className="pl-row__dots" aria-hidden />
            <span className="pl-row__price">{item.price}</span>
          </>
        ) : null}
      </div>
    </li>
  )
}

function ThemeDecor({ theme }: { theme: DesignTheme }) {
  return (
    <>
      <img
        className="pl-decor pl-decor--photo"
        src={assetUrl(`backgrounds/${PHOTO_THEMES[theme]}`)}
        alt=""
        crossOrigin="anonymous"
      />
      <div className={`pl-decor pl-decor--photo-veil ${VEIL_CLASS[theme]}`} aria-hidden />

      {theme === 'newyear' ? (
        <>
          <div className="pl-decor pl-decor--ny-frame" aria-hidden />
          <div className="pl-decor pl-decor--ny-snow" aria-hidden />
        </>
      ) : null}

      {theme === 'inkwash' ? (
        <div className="pl-decor pl-decor--ink-frame" aria-hidden />
      ) : null}

      {theme === 'copper' ? (
        <div className="pl-decor pl-decor--copper-frame" aria-hidden />
      ) : null}
    </>
  )
}

export function PriceListPreview({ items, theme, previewRef }: Props) {
  return (
    <div className="preview-frame">
      <div className={`preview-sheet theme-${theme}`} ref={previewRef}>
        <ThemeDecor theme={theme} />
        <ul className="pl-list">
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </div>
  )
}
