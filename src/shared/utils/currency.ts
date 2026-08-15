const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}
