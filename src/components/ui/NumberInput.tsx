/**
 * [INPUT]: depends on InputHTMLAttributes type from react
 * [OUTPUT]: exports NumberInput component wrapping HTML number inputs to emit both parsed numeric and raw string values via onValueChange
 * [POS]: numeric-input UI primitive in src/components/ui; consumed by properties and modal forms to standardize numeric change callbacks
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import type { InputHTMLAttributes } from 'react'

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onValueChange: (value: number, rawValue: string) => void
}

export function NumberInput({ onValueChange, ...props }: NumberInputProps) {
  return (
    <input
      {...props}
      type="number"
      onChange={(event) => onValueChange(Number(event.target.value), event.target.value)}
    />
  )
}
