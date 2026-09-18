import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formatea como dd/mm/aaaa en español', () => {
    // UTC para no depender de la zona horaria de la máquina que corre el test.
    expect(formatDate('2026-01-05T12:00:00.000Z')).toBe('05/01/2026')
  })

  it('rellena con cero los días y meses de un solo dígito', () => {
    expect(formatDate('2026-09-01T12:00:00.000Z')).toBe('01/09/2026')
  })
})
