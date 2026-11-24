import { describe, expect, it } from 'vitest'
import { joinNames } from './joinNames'

describe('joinNames', () => {
  it('un solo nombre: tal cual', () => {
    expect(joinNames(['Ana'])).toBe('Ana')
  })

  it('dos nombres: unidos por "y"', () => {
    expect(joinNames(['Ana', 'Bruno'])).toBe('Ana y Bruno')
  })

  it('tres o más: coma entre todos menos el último, "y" antes del último', () => {
    expect(joinNames(['Ana', 'Bruno', 'Cami'])).toBe('Ana, Bruno y Cami')
  })
})
