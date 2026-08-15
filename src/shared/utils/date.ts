const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value))
}
