import type { Choice } from '@/ui';

import type { BusinessDrop, CreateDropRequest, UpdateDropRequest } from '../types/business';

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
  /** ISO start time, or null to publish now. */
  startsAt: string | null;
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

  if (values.startsAt) {
    const start = new Date(values.startsAt).getTime();
    if (start < Date.now() + 2 * 60_000) errors.startsAt = 'Başlangıç en az birkaç dakika sonrası olmalı.';
    else if (start > Date.now() + 30 * 24 * 3_600_000) errors.startsAt = 'En fazla 30 gün sonrasına planlanabilir.';
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
  startsAt: values.startsAt,
});

export const dropToFormValues = (drop: BusinessDrop): DropFormValues => ({
  title: drop.title,
  description: drop.description ?? '',
  minimumSpend: drop.minimumSpend != null ? String(drop.minimumSpend) : '',
  capacity: String(drop.capacity),
  // Fixed once live; kept equal so duration validation is a no-op when editing.
  durationMinutes: drop.claimDurationMinutes,
  claimDurationMinutes: drop.claimDurationMinutes,
  startsAt: null,
});

/** Everything of a previous drop, durations included, to publish it again. */
export const dropToTemplateValues = (drop: BusinessDrop): DropFormValues => ({
  ...dropToFormValues(drop),
  durationMinutes: drop.durationMinutes,
  claimDurationMinutes: drop.claimDurationMinutes,
  startsAt: null,
});

/** Most recent drops with distinct titles, newest first: the "fill from previous" shortcuts. */
export const recentTemplates = (drops: BusinessDrop[], limit = 6) => {
  const seen = new Set<string>();

  return [...drops]
    .sort((a, b) => new Date(b.startsAt ?? 0).getTime() - new Date(a.startsAt ?? 0).getTime())
    .filter(drop => {
      const key = drop.title.trim().toLocaleLowerCase('tr-TR');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

const minutesLabel = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60} saat` : minutes > 60 ? `${Math.floor(minutes / 60)} sa ${minutes % 60} dk` : `${minutes} dk`;

/** Keeps a non-standard duration (e.g. 45 dk from an older drop) selectable. */
export const withOption = (options: Choice<number>[], value: number): Choice<number>[] =>
  options.some(option => option.value === value)
    ? options
    : [...options, { label: minutesLabel(value), value }].sort((a, b) => a.value - b.value);

export const toUpdateDropRequest = (values: DropFormValues): UpdateDropRequest => {
  const { title, description, minimumSpend, capacity } = toCreateDropRequest(values);
  return { title, description, minimumSpend, capacity };
};

// Maps FluentValidation property names back onto form fields.
export const apiFieldMap: Record<string, keyof DropFormValues> = {
  Title: 'title',
  Description: 'description',
  MinimumSpend: 'minimumSpend',
  Capacity: 'capacity',
  DurationMinutes: 'durationMinutes',
  StartsAt: 'startsAt',
  ClaimDurationMinutes: 'claimDurationMinutes',
};
