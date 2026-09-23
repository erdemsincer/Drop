import type { Choice } from '@/ui';

import type { CreateDropRequest } from '../types/business';

export const DROP_DURATIONS: Choice<number>[] = [
  { label: '30 dk', value: 30 },
  { label: '1 saat', value: 60 },
  { label: '2 saat', value: 120 },
  { label: '4 saat', value: 240 },
];

export const CLAIM_DURATIONS: Choice<number>[] = [
  { label: '10 dk', value: 10 },
  { label: '15 dk', value: 15 },
  { label: '30 dk', value: 30 },
  { label: '1 saat', value: 60 },
];

export type DropFormValues = {
  title: string;
  description: string;
  minimumSpend: string;
  capacity: string;
  durationMinutes: number;
  claimDurationMinutes: number;
};

export type DropFormErrors = Partial<Record<keyof DropFormValues, string>>;

const parseDecimal = (value: string) => Number(value.trim().replace(',', '.'));

// Mirrors CreateDropRequestValidator; the backend stays the final authority.
export const validateDropForm = (values: DropFormValues): DropFormErrors => {
  const errors: DropFormErrors = {};

  if (!values.title.trim()) errors.title = 'Fırsatı kısaca yaz.';
  else if (values.title.trim().length > 200) errors.title = 'En fazla 200 karakter olabilir.';

  if (values.description.trim().length > 1000) errors.description = 'En fazla 1000 karakter olabilir.';

  if (values.minimumSpend.trim()) {
    const spend = parseDecimal(values.minimumSpend);
    if (!Number.isFinite(spend) || spend < 0) errors.minimumSpend = 'Geçerli bir tutar gir.';
  }

  const capacity = Number(values.capacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
    errors.capacity = '1 ile 1000 arasında bir sayı gir.';
  }

  if (values.claimDurationMinutes > values.durationMinutes) {
    errors.claimDurationMinutes = 'Kullanım süresi Drop süresinden uzun olamaz.';
  }

  return errors;
};

export const toCreateDropRequest = (values: DropFormValues): CreateDropRequest => ({
  title: values.title.trim(),
  description: values.description.trim() || null,
  minimumSpend: values.minimumSpend.trim() ? parseDecimal(values.minimumSpend) : null,
  capacity: Number(values.capacity),
  durationMinutes: values.durationMinutes,
  claimDurationMinutes: values.claimDurationMinutes,
});

// Maps FluentValidation property names back onto form fields.
export const apiFieldMap: Record<string, keyof DropFormValues> = {
  Title: 'title',
  Description: 'description',
  MinimumSpend: 'minimumSpend',
  Capacity: 'capacity',
  DurationMinutes: 'durationMinutes',
  ClaimDurationMinutes: 'claimDurationMinutes',
};
