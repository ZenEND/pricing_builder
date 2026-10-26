import type { DesignTheme, ThemeMeta } from '../types'
import { THEMES } from '../types'
import './ThemeTopBar.css'

type Props = {
  theme: DesignTheme
  onThemeChange: (theme: DesignTheme) => void
}

export function ThemeTopBar({ theme, onThemeChange }: Props) {
  return (
    <div className="theme-top">
      <div className="theme-top__inner">
        <p className="theme-top__label">Дизайн</p>
        <div className="theme-top__scroll" role="listbox" aria-label="Дизайн">
          {THEMES.map((meta: ThemeMeta) => (
            <button
              key={meta.id}
              type="button"
              role="option"
              aria-selected={theme === meta.id}
              className={`theme-chip${theme === meta.id ? ' theme-chip--active' : ''}`}
              onClick={() => onThemeChange(meta.id)}
            >
              <span className={`theme-chip__swatch theme-swatch--${meta.id}`} />
              <span className="theme-chip__label">{meta.short}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
