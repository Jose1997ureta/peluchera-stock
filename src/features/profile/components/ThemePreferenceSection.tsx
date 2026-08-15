import { RadioGroup, RadioGroupItem } from '@/shared/components/motion/radio'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useTheme, type ThemePreference } from '@/shared/context/ThemeContext'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
]

export function ThemePreferenceSection() {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Tema de la aplicación</p>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemePreference)}
          orientation="horizontal"
        >
          {THEME_OPTIONS.map((option) => (
            <RadioGroupItem key={option.value} value={option.value} label={option.label} />
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
