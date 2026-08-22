import { type FormEvent, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { toast } from '@/shared/lib/toast'

export interface OpenCashCutFormProps {
  isPending: boolean
  onSubmit: (initialAmount: number) => void
  idPrefix?: string
}

/** Formulario chico y reutilizable para abrir una caja: monto inicial + botón. Sin selector de moneda (la app opera en una sola moneda). */
export function OpenCashCutForm({ isPending, onSubmit, idPrefix = 'open-caja' }: OpenCashCutFormProps) {
  const [initialAmount, setInitialAmount] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(initialAmount)
    if (!initialAmount || Number.isNaN(amount) || amount < 0) {
      toast.error('Ingresá un monto inicial válido (mínimo 0).')
      return
    }
    onSubmit(amount)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-monto-inicial`}>Monto inicial</Label>
        <Input
          id={`${idPrefix}-monto-inicial`}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={initialAmount}
          onChange={(event) => setInitialAmount(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        Abrir caja
      </Button>
    </form>
  )
}
