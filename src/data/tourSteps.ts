import type { MobilePane } from '../types'

export type TourStep = {
  id: string
  /** CSS selector or [data-tour="…"] target; omit for centered intro */
  target?: string
  title: string
  body: string
  /** Prefer placing the tip above/below/left/right of the target */
  prefer?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** Switch mobile pane before showing this step */
  pane?: MobilePane
  /** Hide this step on wide screens (desktop) */
  mobileOnly?: boolean
  /** Open a parent <details> around the target (e.g. «Додатково») */
  expandDetails?: boolean
}

export const TOUR_STORAGE_KEY = 'pricing-builder-tour-seen-v1'

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Вітаємо!',
    body: 'Короткий тур: редактор, дизайн і PDF. Пропустіть зараз — «?» відкриє знову.',
    prefer: 'auto',
  },
  {
    id: 'themes',
    target: '[data-tour="themes"]',
    title: 'Оберіть дизайн',
    body: 'Чіпи зверху міняють тему. Превʼю оновлюється одразу.',
    prefer: 'bottom',
    pane: 'preview',
  },
  {
    id: 'editor',
    target: '[data-tour="item-card"]',
    title: 'Редактор послуг',
    body: 'Тут увесь прейскурант. На телефоні — вкладка «Редактор» знизу.',
    prefer: 'bottom',
    pane: 'edit',
  },
  {
    id: 'item',
    target: '[data-tour="item-card"]',
    title: 'Картка послуги',
    body: 'Назва, підзаголовок, ціна. «Підпункт» — для доповнень усередині картки.',
    prefer: 'bottom',
    pane: 'edit',
  },
  {
    id: 'reorder',
    target: '[data-tour="item-move"]',
    title: 'Порядок і видалення',
    body: '↑ ↓ змінюють порядок. × прибирає послугу з підпунктами.',
    prefer: 'bottom',
    pane: 'edit',
  },
  {
    id: 'add',
    target: '[data-tour="add-service"]',
    title: 'Додати послугу',
    body: '«+» під карткою вставляє нову послугу саме після цього пункту.',
    prefer: 'top',
    pane: 'edit',
  },
  {
    id: 'reset',
    target: '[data-tour="reset"]',
    title: 'Скинути список',
    body: 'Повертає початковий прейскурант. Підтверджуйте лише коли потрібно.',
    prefer: 'top',
    pane: 'edit',
    expandDetails: true,
  },
  {
    id: 'nav-tabs',
    target: '[data-tour="nav-tabs"]',
    title: 'Редактор ↔ Превʼю',
    body: 'На телефоні перемикайте вкладки знизу між редагуванням і макетом.',
    prefer: 'top',
    mobileOnly: true,
  },
  {
    id: 'preview',
    target: '[data-tour="preview-sheet"]',
    title: 'Превʼю для друку',
    body: 'Так виглядатиме PDF. Перевірте читабельність перед експортом.',
    prefer: 'top',
    pane: 'preview',
  },
  {
    id: 'export',
    target: '[data-tour="export"]',
    title: 'Завантажити PDF',
    body: 'Файл збережеться з датою DD-MM-YYYY-HH-mm — готовий до друку.',
    prefer: 'top',
    pane: 'preview',
  },
  {
    id: 'help',
    target: '[data-tour="help"]',
    title: 'Допомога поруч',
    body: '«?» знову запускає тур. Готово — можна редагувати!',
    prefer: 'bottom',
  },
]
