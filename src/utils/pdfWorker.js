/**
 * PDF.js worker setup
 * Configures pdfjs-dist to use the correct worker
 */

// Dynamic import to keep pdfjs out of main chunk
let pdfjsLib = null

export async function getPDFJS() {
  if (pdfjsLib) return pdfjsLib

  const pdfjs = await import('pdfjs-dist')

  // Configure worker - use CDN worker as fallback for simplicity
  // In production, copy worker to /public/pdf.worker.min.js
  try {
    // Try to use local worker first
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  } catch (e) {
    // Fallback to CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  }

  pdfjsLib = pdfjs
  return pdfjs
}

/**
 * Extract all text from a PDF file
 * @param {File} file - PDF File object
 * @param {Function} onProgress - callback(page, totalPages)
 * @returns {Promise<string>} - full extracted text
 */
export async function extractPDFText(file, onProgress) {
  const pdfjs = await getPDFJS()

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  let pdf
  try {
    pdf = await pdfjs.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise
  } catch (err) {
    if (err.name === 'PasswordException') {
      throw new Error('PASSWORD_PROTECTED')
    }
    throw err
  }

  const totalPages = pdf.numPages
  let fullText = ''

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) onProgress(pageNum, totalPages)

    // Yield to UI every 10 pages
    if (pageNum % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    try {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Concatenate text items with smart line breaks
      let pageText = ''
      let lastY = null
      for (const item of textContent.items) {
        if (item.str === undefined) continue
        const y = item.transform?.[5]
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          pageText += '\n'
        }
        pageText += item.str + ' '
        lastY = y
      }
      fullText += pageText + '\n'
    } catch (pageErr) {
      // Skip failed pages silently
      console.warn(`Failed to extract page ${pageNum}:`, pageErr)
    }
  }

  // Check if we got any text (might be scanned)
  const meaningfulText = fullText.replace(/\s+/g, '').length
  if (meaningfulText < 100) {
    throw new Error('NO_TEXT_LAYER')
  }

  return fullText
}
