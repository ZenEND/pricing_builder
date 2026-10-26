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

export async function exportPriceListPdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  // Wait for webfonts so outline text renders crisply in the capture
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#1a0f08',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.96)
  const imgWidth = canvas.width
  const imgHeight = canvas.height

  // A4-width portrait PDF, height follows the sheet aspect ratio
  const pdfWidthMm = 210
  const pdfHeightMm = (imgHeight / imgWidth) * pdfWidthMm

  const pdf = new jsPDF({
    orientation: pdfHeightMm >= pdfWidthMm ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm],
    compress: true,
  })

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'MEDIUM')
  pdf.save(buildPdfFileName(fileName))
}
