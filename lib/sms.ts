// sms: link that opens the phone's messages app with the text filled in.
// "?&body=" works on both iOS and Android.
export function smsHref(phone: string, body: string) {
  const dial = phone.replace(/[^\d+]/g, '')
  return `sms:${dial}?&body=${encodeURIComponent(body)}`
}
