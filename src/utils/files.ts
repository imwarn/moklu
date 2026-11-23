/**
 * [INPUT]: depends on browser FileReader and File globals
 * [OUTPUT]: exports fileToDataUrl
 * [POS]: minimal File-to-data-URL reader in src/utils; consumed by screenshotAssets and file upload handlers
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
/** Convert a file (from File System Access API or input) to a data URL string. */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
