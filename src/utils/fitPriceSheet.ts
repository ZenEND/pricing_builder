/** Floor keeps print text readable (~12px+ at typical sheet width). */
const FIT_MIN = 0.78
const FIT_MAX = 1.22

function listIntrinsicHeight(list: HTMLElement): number {
  const kids = Array.from(list.children) as HTMLElement[]
  if (kids.length === 0) return 0

  const styles = getComputedStyle(list)
  const gap = parseFloat(styles.rowGap || styles.gap) || 0
  const sum = kids.reduce((acc, el) => acc + el.getBoundingClientRect().height, 0)
  return sum + gap * Math.max(0, kids.length - 1)
}

function sheetContentHeight(sheet: HTMLElement): number {
  const styles = getComputedStyle(sheet)
  const pad =
    parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
  return Math.max(0, sheet.clientHeight - pad)
}

/** Binary-search --pl-fit so the list fills the sheet without overflowing. */
export function fitPriceSheet(sheet: HTMLElement): number {
  const list = sheet.querySelector<HTMLElement>('.pl-list')
  if (!list) return 1

  const apply = (value: number) => {
    sheet.style.setProperty('--pl-fit', value.toFixed(4))
  }

  let lo = FIT_MIN
  let hi = FIT_MAX
  let best = FIT_MIN

  for (let i = 0; i < 14; i += 1) {
    const mid = (lo + hi) / 2
    apply(mid)
    const available = sheetContentHeight(sheet)
    const needed = listIntrinsicHeight(list)

    if (needed <= available + 0.5) {
      best = mid
      lo = mid
    } else {
      hi = mid
    }
  }

  apply(best)
  return best
}
