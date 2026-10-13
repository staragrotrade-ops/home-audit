// Text messages. No imports, so the tests can load this file directly.

// Keeps a text message to the plain GSM characters every phone handles:
// "&" is replaced because some phones cut the message at "&" when it comes
// through an sms: link, and curly quotes, dashes and special spaces would
// switch the message to a format that fits only 70 characters per part.
export function smsSafe(text: string) {
  return text
    .replace(/&/g, 'and')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[   ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// How many standard texts a message uses (160 characters, or 153 each once
// it is split). Long messages still arrive as one message on the phone.
export function smsParts(text: string) {
  const length = text.length
  return length <= 160 ? 1 : Math.ceil(length / 153)
}

// sms: link that opens the phone's messages app with the text filled in.
// "?&body=" works on both iOS and Android.
export function smsHref(phone: string, body: string) {
  const dial = phone.replace(/[^\d+]/g, '')
  return `sms:${dial}?&body=${encodeURIComponent(smsSafe(body))}`
}
