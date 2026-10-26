import type { PriceItem } from '../types'

export type ItemGroup = {
  parent: PriceItem
  children: PriceItem[]
}

/** Group flat items: consecutive `indented` rows belong to the previous root. */
export function groupPriceItems(items: PriceItem[]): ItemGroup[] {
  const groups: ItemGroup[] = []

  for (const item of items) {
    if (item.indented && groups.length > 0) {
      groups[groups.length - 1].children.push(item)
    } else {
      groups.push({ parent: item, children: [] })
    }
  }

  return groups
}

export function flattenGroups(groups: ItemGroup[]): PriceItem[] {
  return groups.flatMap((g) => [
    { ...g.parent, indented: false },
    ...g.children.map((c) => ({ ...c, indented: true })),
  ])
}

/** Index of the last item in the group that owns `id` (parent or child). */
export function groupEndIndex(items: PriceItem[], id: string): number {
  const groups = groupPriceItems(items)
  let offset = 0
  for (const g of groups) {
    const size = 1 + g.children.length
    const ids = [g.parent.id, ...g.children.map((c) => c.id)]
    if (ids.includes(id)) return offset + size - 1
    offset += size
  }
  return items.findIndex((i) => i.id === id)
}
