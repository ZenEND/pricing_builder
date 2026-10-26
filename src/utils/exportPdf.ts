import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { fitPriceSheet } from './fitPriceSheet'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Returns timestamp like 26-10-2026-21-30 */
export function formatBuildStamp(date = new Date()): string {
  return [
    pad(date.getDate()),
    pad(date.getMonth() + 1),
    date.getFullYear(),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('-')
}

export function buildPdfFileName(baseName: string, date = new Date()): string {
  const safe = (baseName.trim() || 'preyskurant')
    .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return `${safe}-${formatBuildStamp(date)}.pdf`
}

function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(() => step(left - 1))
    }
    step(count)
  })
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))
  if (images.length === 0) return Promise.resolve()

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        }),
    ),
  ).then(() => undefined)
}

function assertSheetVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  if (
    rect.width < 2 ||
    rect.height < 2 ||
    style.display === 'none' ||
    style.visibility === 'hidden'
  ) {
    throw new Error('Preview sheet is not visible for PDF capture')
  }
}

export async function exportPriceListPdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  await waitForImages(element)
  fitPriceSheet(element)
  await waitFrames(2)
  assertSheetVisible(element)

  element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  await waitFrames(1)

  const rect = element.getBoundingClientRect()
  const width = Math.round(rect.width)
  const height = Math.round(rect.height)
  const pixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 1))

  // Snapshot the live preview (same DOM the user sees).
  // Temporarily normalize a few properties that break SVG foreignObject capture.
  const prev = {
    boxShadow: element.style.boxShadow,
    isolation: element.style.isolation,
    overflow: element.style.overflow,
    transform: element.style.transform,
  }
  element.style.boxShadow = 'none'
  element.style.isolation = 'auto'
  element.style.overflow = 'hidden'
  element.style.transform = 'none'

  const list = element.querySelector<HTMLElement>('.pl-list')
  const prevListZ = list?.style.zIndex ?? ''
  if (list) list.style.zIndex = '20'

  let imgData: string
  try {
    // PNG keeps sharp type; html-to-image handles stacking better than html2canvas
    imgData = await toPng(element, {
      pixelRatio,
      cacheBust: false,
      width,
      height,
      canvasWidth: Math.round(width * pixelRatio),
      canvasHeight: Math.round(height * pixelRatio),
      style: {
        boxShadow: 'none',
        transform: 'none',
        isolation: 'auto',
      },
    })
  } finally {
    element.style.boxShadow = prev.boxShadow
    element.style.isolation = prev.isolation
    element.style.overflow = prev.overflow
    element.style.transform = prev.transform
    if (list) list.style.zIndex = prevListZ
  }

  const pdfWidthMm = 210
  const pdfHeightMm = (height / width) * pdfWidthMm

  const pdf = new jsPDF({
    orientation: pdfHeightMm >= pdfWidthMm ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm],
    compress: true,
  })

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST')
  pdf.save(buildPdfFileName(fileName))
}
