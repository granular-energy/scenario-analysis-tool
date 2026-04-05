import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Granular Energy logo SVG as inline data URI for PDF embedding
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110.53 45.5"><defs><style>.cls-1{fill:#2a2929;}</style></defs><g><path class="cls-1" d="m10.18,18.93v11.39c0,1.33-.86,2.18-2.15,2.18H.98v-2.03h6.2c.35,0,.55-.2.55-.58v-2.85h-.2c-.55.76-1.48,1.52-3.16,1.52-2.3,0-4.37-1.95-4.37-4.95s2.07-4.95,4.37-4.95c1.68,0,2.61.74,3.2,1.58h.19v-1.31h2.42Zm-2.42,4.68c0-1.75-1.13-2.85-2.65-2.85s-2.65,1.09-2.65,2.85,1.13,2.85,2.65,2.85,2.65-1.09,2.65-2.85Z"/><path class="cls-1" d="m14.78,20.29h.19c.37-1.03,1.19-1.4,2.42-1.4h1.01v2.07h-1.44c-1.25,0-2.15.66-2.15,2.03v5.62h-2.46v-9.67h2.42v1.36Z"/><path class="cls-1" d="m26.54,28.6v-1.31h-.19c-.58.84-1.52,1.58-3.2,1.58-2.3,0-4.37-1.95-4.37-5.11s2.07-5.11,4.37-5.11c1.68,0,2.61.74,3.2,1.58h.19v-1.31h2.42v9.67h-2.42Zm0-4.84c0-1.91-1.13-3-2.65-3s-2.65,1.09-2.65,3,1.13,3,2.65,3,2.65-1.09,2.65-3Z"/><path class="cls-1" d="m33.56,18.93v1.44h.19c.39-.82,1.21-1.6,2.98-1.6,2.26,0,3.76,1.66,3.76,4.06v5.77h-2.46v-5.66c0-1.46-.74-2.18-2.07-2.18-1.5,0-2.38,1.05-2.38,2.85v4.99h-2.46v-9.67h2.42Z"/><path class="cls-1" d="m49.47,28.6v-1.44h-.19c-.39.82-1.21,1.6-2.98,1.6-2.26,0-3.76-1.66-3.76-4.06v-5.77h2.46v5.65c0,1.46.74,2.18,2.07,2.18,1.5,0,2.38-1.05,2.38-2.85v-4.99h2.46v9.67h-2.42Z"/><path class="cls-1" d="m56.53,28.6h-2.46v-13.65h2.46v13.65Z"/><path class="cls-1" d="m65.89,28.6v-1.31h-.2c-.58.84-1.52,1.58-3.2,1.58-2.3,0-4.37-1.95-4.37-5.11s2.07-5.11,4.37-5.11c1.68,0,2.61.74,3.2,1.58h.2v-1.31h2.42v9.67h-2.42Zm0-4.84c0-1.91-1.13-3-2.65-3s-2.65,1.09-2.65,3,1.13,3,2.65,3,2.65-1.09,2.65-3Z"/><path class="cls-1" d="m72.91,20.29h.19c.37-1.03,1.19-1.4,2.42-1.4h1.01v2.07h-1.44c-1.25,0-2.15.66-2.15,2.03v5.62h-2.46v-9.67h2.42v1.36Z"/><path class="cls-1" d="m20.18,31.65c2.81,0,4.7,1.97,4.7,4.95v.92h-7.04c.1,1.25,1.09,2.24,2.46,2.24s2.05-.76,2.46-1.48l1.97,1.21c-.55.74-1.7,2.38-4.43,2.38-2.96,0-4.97-2.18-4.97-5.19s2.01-5.03,4.86-5.03Zm2.2,4.15c-.14-1.27-.96-2.05-2.22-2.05-1.38,0-2.15.82-2.3,2.05h4.52Z"/><path class="cls-1" d="m28.82,31.93v1.44h.19c.39-.82,1.21-1.6,2.98-1.6,2.26,0,3.76,1.66,3.76,4.06v5.77h-2.46v-5.66c0-1.46-.74-2.18-2.07-2.18-1.5,0-2.38,1.05-2.38,2.85v4.99h-2.46v-9.67h2.42Z"/><path class="cls-1" d="m42.1,31.65c2.81,0,4.7,1.97,4.7,4.95v.92h-7.04c.1,1.25,1.09,2.24,2.46,2.24s2.05-.76,2.46-1.48l1.97,1.21c-.55.74-1.7,2.38-4.43,2.38-2.96,0-4.97-2.18-4.97-5.19s2.01-5.03,4.86-5.03Zm2.2,4.15c-.14-1.27-.96-2.05-2.22-2.05-1.38,0-2.15.82-2.3,2.05h4.52Z"/><path class="cls-1" d="m50.74,33.29h.19c.37-1.03,1.19-1.4,2.42-1.4h1.01v2.07h-1.44c-1.25,0-2.15.66-2.15,2.03v5.62h-2.46v-9.67h2.42v1.36Z"/><path class="cls-1" d="m64.92,31.93v11.39c0,1.33-.86,2.18-2.15,2.18h-7.06v-2.03h6.2c.35,0,.55-.2.55-.58v-2.85h-.2c-.55.76-1.48,1.52-3.16,1.52-2.3,0-4.37-1.95-4.37-4.95s2.07-4.95,4.37-4.95c1.68,0,2.61.74,3.2,1.58h.2v-1.31h2.42Zm-2.42,4.68c0-1.75-1.13-2.85-2.65-2.85s-2.65,1.09-2.65,2.85,1.13,2.85,2.65,2.85,2.65-1.09,2.65-2.85Z"/><path class="cls-1" d="m76.65,31.93l-5.3,13.57h-2.65l1.37-3.28-4.02-10.3h2.65l2.55,6.98h.2l2.55-6.98h2.65Z"/></g><g><path class="cls-1" d="m77.73,3.98c-1.88-3.26-5.78-4.76-9.36-3.59l-25.46,8.27c-.98.32-.75,1.76.28,1.76h38.26l-3.72-6.44Z"/><path class="cls-1" d="m109.62,12.83h-26.79l3.73,6.47c1.8,3.12,5.72,4.28,8.93,2.64l14.53-7.41c.84-.43.54-1.71-.41-1.71Z"/></g></svg>`

function loadLogoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    const encoded = btoa(LOGO_SVG)
    img.src = `data:image/svg+xml;base64,${encoded}`
  })
}

function renderLogoToDataUrl(img: HTMLImageElement, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  const scale = 3
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

export async function exportPdf(
  title: string,
  hourlyScore: number,
  annualScore: number,
  consumptionName: string,
  generationMix: Record<string, number>
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = 0

  // === Teal accent bar ===
  pdf.setFillColor(0, 152, 139) // teal-700
  pdf.rect(0, 0, pageWidth, 3, 'F')
  y = 3

  // === Logo ===
  try {
    const logoImg = await loadLogoImage()
    const logoHeight = 10
    const logoWidth = (110.53 / 45.5) * logoHeight // preserve aspect ratio
    const logoDataUrl = renderLogoToDataUrl(logoImg, logoWidth * 4, logoHeight * 4)
    pdf.addImage(logoDataUrl, 'PNG', margin, y + 5, logoWidth, logoHeight)
    y += 5 + logoHeight + 3
  } catch {
    // Fallback: text-only header if logo fails to load
    y += 8
    pdf.setFontSize(12)
    pdf.setTextColor(42, 41, 41)
    pdf.text('Granular Energy', margin, y)
    y += 5
  }

  // === Tool title ===
  pdf.setFontSize(16)
  pdf.setTextColor(42, 41, 41) // neutral-1000
  pdf.text('Scenario Analysis Tool', margin, y)
  y += 4

  // Optional report title
  if (title.trim()) {
    pdf.setFontSize(11)
    pdf.setTextColor(86, 81, 78) // neutral-800
    pdf.text(title.trim(), margin, y + 4)
    y += 8
  }
  y += 3

  // === Divider ===
  pdf.setDrawColor(0, 152, 139)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 8

  // === Scores section ===
  // Hourly score — large and prominent
  pdf.setFontSize(10)
  pdf.setTextColor(137, 127, 120) // neutral-600
  pdf.text('HOURLY MATCHING SCORE', margin, y)

  pdf.setTextColor(137, 127, 120)
  pdf.text('ANNUAL MATCHING SCORE', margin + 80, y)
  y += 8

  pdf.setFontSize(28)
  pdf.setTextColor(0, 152, 139) // teal-700
  pdf.text(`${Math.round(hourlyScore)}%`, margin, y)

  pdf.setFontSize(20)
  pdf.setTextColor(184, 178, 173) // neutral-500
  pdf.text(`${Math.round(annualScore)}%`, margin + 80, y)
  y += 10

  // === Configuration section ===
  pdf.setDrawColor(227, 224, 221) // neutral-300
  pdf.setLineWidth(0.2)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 6

  pdf.setFontSize(10)
  pdf.setTextColor(137, 127, 120)
  pdf.text('CONFIGURATION', margin, y)
  y += 6

  pdf.setFontSize(10)
  pdf.setTextColor(42, 41, 41)
  pdf.text(`Consumption profile:  ${consumptionName}`, margin, y)
  y += 6

  pdf.text('Generation mix:', margin, y)
  y += 5
  pdf.setFontSize(9)
  pdf.setTextColor(86, 81, 78) // neutral-800
  const activeTechs = Object.entries(generationMix).filter(([, pct]) => pct > 0)
  if (activeTechs.length === 0) {
    pdf.text('  No generation technologies selected', margin, y)
    y += 5
  } else {
    for (const [tech, pct] of activeTechs) {
      // Teal bullet
      pdf.setFillColor(0, 152, 139)
      pdf.circle(margin + 2, y - 1, 0.8, 'F')
      pdf.setTextColor(86, 81, 78)
      pdf.text(`${tech}: ${pct}%`, margin + 6, y)
      y += 4.5
    }
  }
  y += 4

  // === Capture charts ===
  const resultsEl = document.querySelector('.results-section') as HTMLElement | null
  if (resultsEl) {
    const canvas = await html2canvas(resultsEl, {
      scale: 2,
      backgroundColor: '#FBFAF9',
      logging: false,
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = contentWidth
    const imgHeight = (canvas.height / canvas.width) * imgWidth

    // Check if we need a new page
    if (y + imgHeight > pageHeight - 20) {
      pdf.addPage()
      // Accent bar on new page
      pdf.setFillColor(0, 152, 139)
      pdf.rect(0, 0, pageWidth, 1.5, 'F')
      y = 8
    }

    pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
    y += imgHeight + 6
  }

  // === Footer (on every page) ===
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)

    // Footer divider line
    pdf.setDrawColor(0, 152, 139)
    pdf.setLineWidth(0.3)
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)

    // Footer text
    pdf.setFontSize(7.5)
    pdf.setTextColor(137, 127, 120)
    pdf.text(
      'Generated by Granular Energy Scenario Analysis Tool',
      margin,
      pageHeight - 8
    )
    pdf.setTextColor(0, 152, 139)
    pdf.text(
      'www.granular-energy.com',
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    )
  }

  // Save
  const filename = title.trim()
    ? `scenario-analysis-${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
    : 'scenario-analysis.pdf'
  pdf.save(filename)
}
