export const BUYER_SITUATIONS = [
  ['buying_signed', 'I am buying and have signed an offer/contract'],
  ['buying_not_signed', 'I am buying and have NOT signed an offer/contract'],
  ['auction', 'I am attending an auction'],
  ['bought_settled', 'I have bought and settled'],
  ['bought_not_settled', 'I have bought but NOT yet settled'],
] as const

export type BuyerSituation = (typeof BUYER_SITUATIONS)[number][0]

export const BUYER_SITUATION_LABELS = Object.fromEntries(BUYER_SITUATIONS) as Record<
  BuyerSituation,
  string
>

export const ACCESS_CHOICES = [
  ['agent', 'The selling agent'],
  ['customer', 'Me'],
  ['other', 'Someone else'],
] as const

export type AccessChoice = (typeof ACCESS_CHOICES)[number][0]

export const ACCESS_CHOICE_LABELS = Object.fromEntries(ACCESS_CHOICES) as Record<AccessChoice, string>

export const PRICE_GUIDE_BANDS = [
  ['up_to_1_5m', 'Up to $1.5 million'],
  ['over_1_5m', 'Over $1.5 million'],
  ['unknown', 'Not listed / not sure'],
] as const

export const PRICE_GUIDE_LABELS: Record<string, string> = Object.fromEntries(PRICE_GUIDE_BANDS)
