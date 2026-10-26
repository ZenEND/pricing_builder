import type { MobilePane } from '../types'
import './BottomNav.css'

type Props = {
  pane: MobilePane
  exporting: boolean
  canExport: boolean
  onPaneChange: (pane: MobilePane) => void
  onExport: () => void
}

export function BottomNav({
  pane,
  exporting,
  canExport,
  onPaneChange,
  onExport,
}: Props) {
  return (
    <nav className="bottom-nav" aria-label="Навігація">
      <div className="bottom-nav__inner">
        <div
          className="bottom-nav__tabs"
          role="tablist"
          aria-label="Режим"
          data-tour="nav-tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={pane === 'edit'}
            className={`bottom-nav__tab${pane === 'edit' ? ' bottom-nav__tab--active' : ''}`}
            onClick={() => onPaneChange('edit')}
          >
            Редактор
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pane === 'preview'}
            className={`bottom-nav__tab${pane === 'preview' ? ' bottom-nav__tab--active' : ''}`}
            onClick={() => onPaneChange('preview')}
          >
            Превʼю
          </button>
        </div>

        <button
          type="button"
          className="bottom-nav__export"
          data-tour="export"
          onClick={onExport}
          disabled={exporting || !canExport}
        >
          {exporting ? 'PDF…' : 'PDF'}
        </button>
      </div>
    </nav>
  )
}
