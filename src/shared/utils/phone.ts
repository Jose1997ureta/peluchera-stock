export const PHONE_DIAL_CODE = '+51'
export const PHONE_NUMBER_DIGITS = 9

export function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_NUMBER_DIGITS)
}

export function formatPhoneNumber(digits: string): string {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ')
}

// Deriva el número local (sin código de país) de un teléfono ya persistido,
// sin importar con qué código se haya guardado antes.
export function parsePhoneNumber(telefono: string): string {
  const digits = telefono.replace(/\D/g, '')
  return digits.slice(-PHONE_NUMBER_DIGITS)
}

export function composePhone(numberDigits: string): string {
  return `${PHONE_DIAL_CODE} ${formatPhoneNumber(numberDigits)}`
}
