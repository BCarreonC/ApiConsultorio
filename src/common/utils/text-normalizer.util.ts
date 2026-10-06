export function normalizeText(value: string): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim()
    .replace(/\s+/g, ' ');
}
