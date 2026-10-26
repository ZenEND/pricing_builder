export type PriceItem = {
  id: string
  title: string
  subtitle?: string
  price: string
  indented?: boolean
}

export type DesignTheme =
  | 'marble'
  | 'silk'
  | 'frost'
  | 'newyear'
  | 'linen'
  | 'inkwash'
  | 'botanical'
  | 'copper'
  | 'mauve'

export type ThemeMeta = {
  id: DesignTheme
  name: string
  short: string
  blurb: string
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'marble',
    name: 'Marble Soft',
    short: 'Marble',
    blurb: 'Мармуровий фон — елегантний друк',
  },
  {
    id: 'silk',
    name: 'Champagne Silk',
    short: 'Silk',
    blurb: 'Шовк і шампань — преміум настрій',
  },
  {
    id: 'frost',
    name: 'Winter Frost',
    short: 'Frost',
    blurb: 'Крижане скло та зимове світло',
  },
  {
    id: 'newyear',
    name: 'New Year Glow',
    short: 'Новий рік',
    blurb: 'Святкове сяйво, сніг і золото',
  },
  {
    id: 'linen',
    name: 'Linen Studio',
    short: 'Linen',
    blurb: 'Натуральний льон — теплий і чистий',
  },
  {
    id: 'inkwash',
    name: 'Ink Wash',
    short: 'Ink',
    blurb: 'Чорнильна акварель — драматичний друк',
  },
  {
    id: 'botanical',
    name: 'Botanical Mist',
    short: 'Botanical',
    blurb: 'Шавлія та евкаліпт — свіжий spa',
  },
  {
    id: 'copper',
    name: 'Copper Luxe',
    short: 'Copper',
    blurb: 'Мідь і бронза — ювелірний шик',
  },
  {
    id: 'mauve',
    name: 'Mauve Mist',
    short: 'Mauve',
    blurb: 'Пильна троянда в мʼякому тумані',
  },
]

export type MobilePane = 'edit' | 'preview'
