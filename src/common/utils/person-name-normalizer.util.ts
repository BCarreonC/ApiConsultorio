import { normalizeText } from './text-normalizer.util';

const DOCTOR_TITLES = new Set([
  'doctor',
  'doctora',
  'dr',
  'dra',
  'medico',
  'medica',
]);

export function normalizeDoctorName(value: string): string {
  const normalized = normalizeText(value);

  const tokens = normalized
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !DOCTOR_TITLES.has(token));

  return tokens.join(' ');
}
