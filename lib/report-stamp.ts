// Server-only. Prints the client's name into an issued report template.
// The app uploads the report without the name and records where it goes
// ("slots", PDF points from the bottom-left corner). The same template gives
// the first client's copy and, after a transfer, the new buyer's copy, so a
// transferred report never contains the first client's name.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { z } from 'zod'

export const nameSlot = z.object({
  kind: z.enum(['header', 'cover_client', 'note']),
  page: z.number().int().min(1).max(2000),
  x: z.number().min(0).max(2000),
  y: z.number().min(0).max(2000),
  w: z.number().positive().max(2000),
  h: z.number().positive().max(200),
  size: z.number().positive().max(72),
  bold: z.boolean().default(false),
  color: z.number().int().min(0).max(0xffffffff).default(0xff000000),
  align: z.enum(['left', 'right']).default('left'),
})

export type NameSlot = z.infer<typeof nameSlot>

export const nameSlots = z.array(nameSlot).max(2000)

// The report fonts (Helvetica) only have Latin-1 characters.
export function pdfSafe(text: string) {
  const map: Record<string, string> = {
    '‘': "'",
    '’': "'",
    '“': '"',
    '”': '"',
    '–': '-',
    '—': '-',
    '…': '...',
    ' ': ' ',
  }
  let out = ''
  for (const char of text.replace(/\s+/g, ' ').trim()) {
    const code = char.codePointAt(0) || 0
    if (map[char]) out += map[char]
    else if (code >= 0x20 && code <= 0xff) out += char
    else out += '?'
  }
  return out
}

export type StampText = {
  clientName: string
  /** One line on the cover, e.g. about a transfer. Optional. */
  note?: string
}

export function slotText(slot: NameSlot, text: StampText) {
  if (slot.kind === 'header') return text.clientName ? `Prepared for ${text.clientName}` : ''
  if (slot.kind === 'cover_client') return text.clientName || '-'
  return text.note || ''
}

/** Returns the report with the name printed into each slot. */
export async function stampReport(template: Uint8Array, slots: NameSlot[], text: StampText) {
  const pdf = await PDFDocument.load(template)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pages = pdf.getPages()
  for (const slot of slots) {
    const page = pages[slot.page - 1]
    let value = pdfSafe(slotText(slot, text))
    if (!page || !value) continue
    const font = slot.bold ? bold : regular
    // Shorten to fit the slot.
    while (value.length > 1 && font.widthOfTextAtSize(value, slot.size) > slot.w) {
      value = value.slice(0, -1)
    }
    const width = font.widthOfTextAtSize(value, slot.size)
    const color = slot.color >>> 0
    page.drawText(value, {
      x: slot.align === 'right' ? slot.x + slot.w - width : slot.x,
      // Baseline: the slot is 1.3 × the font size; leave room for descenders.
      y: slot.y + (slot.h - slot.size) / 2 + slot.size * 0.22,
      size: slot.size,
      font,
      color: rgb(((color >> 16) & 0xff) / 255, ((color >> 8) & 0xff) / 255, (color & 0xff) / 255),
    })
  }
  return pdf.save()
}
