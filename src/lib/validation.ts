import { isValidDateKey } from './dates';

export interface Rule {
  label: string;
  required?: boolean;
  max?: number;
  date?: boolean;
  min?: number;
  maxNum?: number;
}

export type Errors = Record<string, string>;

export function validate(values: Record<string, unknown>, rules: Record<string, Rule>): Errors {
  const errors: Errors = {};
  for (const [field, r] of Object.entries(rules)) {
    const v = values[field];
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (empty) {
      if (r.required) errors[field] = `${r.label} es obligatorio.`;
      continue;
    }
    if (typeof v === 'string') {
      if (r.max !== undefined && v.length > r.max) errors[field] = `${r.label}: máximo ${r.max} caracteres.`;
      if (r.date && !isValidDateKey(v)) errors[field] = `${r.label}: fecha no válida.`;
    }
    if (typeof v === 'number') {
      if (Number.isNaN(v)) errors[field] = `${r.label}: número no válido.`;
      else if (r.min !== undefined && v < r.min) errors[field] = `${r.label}: mínimo ${r.min}.`;
      else if (r.maxNum !== undefined && v > r.maxNum) errors[field] = `${r.label}: máximo ${r.maxNum}.`;
    }
  }
  return errors;
}

export const hasErrors = (e: Errors) => Object.keys(e).length > 0;
