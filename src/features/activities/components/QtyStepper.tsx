import {
  NumberField,
  NumberFieldArrows,
  NumberFieldGroup,
  NumberFieldInput,
} from '@/shared/components/ui/number-field'

interface QtyStepperProps {
  id: string
  // Formik guarda las cantidades como string; el NumberField trabaja con number.
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  min: number
  max: number
  invalid?: boolean
  className?: string
}

export function QtyStepper({
  id,
  value,
  onChange,
  onBlur,
  min,
  max,
  invalid,
  className,
}: QtyStepperProps) {
  return (
    <NumberField
      value={value === '' ? null : Number(value)}
      onValueChange={(next) => onChange(next === null ? '' : String(next))}
      min={min}
      max={max}
      step={1}
      className={className}
    >
      <NumberFieldGroup>
        <NumberFieldInput
          id={id}
          onBlur={onBlur}
          aria-invalid={invalid || undefined}
          className="px-1.5 text-right"
        />
        <NumberFieldArrows />
      </NumberFieldGroup>
    </NumberField>
  )
}
