import { defaultItems } from '../data/services'
import type { DesignTheme, MobilePane, PriceItem } from '../types'
import { THEMES } from '../types'

const STORAGE_KEY = 'pricing-builder:v1'

export type PersistedState = {
  theme: DesignTheme
  items: PriceItem[]
  mobilePane: MobilePane
}

const THEME_IDS = new Set(THEMES.map((t) => t.id))

function isPriceItem(value: unknown): value is PriceItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.price === 'string' &&
    (item.subtitle === undefined || typeof item.subtitle === 'string') &&
    (item.indented === undefined || typeof item.indented === 'boolean')
  )
}

export function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        theme: 'marble',
        items: defaultItems.map((item) => ({ ...item })),
        mobilePane: 'preview',
      }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const theme =
      typeof parsed.theme === 'string' && THEME_IDS.has(parsed.theme as DesignTheme)
        ? (parsed.theme as DesignTheme)
        : 'marble'

    const items =
      Array.isArray(parsed.items) && parsed.items.every(isPriceItem) && parsed.items.length > 0
        ? parsed.items
        : defaultItems.map((item) => ({ ...item }))

    const mobilePane =
      parsed.mobilePane === 'edit' || parsed.mobilePane === 'preview'
        ? parsed.mobilePane
        : 'preview'

    return { theme, items, mobilePane }
  } catch {
    return {
      theme: 'marble',
      items: defaultItems.map((item) => ({ ...item })),
      mobilePane: 'preview',
    }
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode errors
  }
}
