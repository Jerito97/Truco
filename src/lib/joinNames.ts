// "Ana, Bruno y Cami" en vez de "Ana, Bruno, Cami": así se nombra un equipo
// en toda la app (Historial, imagen para compartir, etc.).
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}
