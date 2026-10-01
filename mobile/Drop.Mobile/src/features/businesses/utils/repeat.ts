/** How a recurring drop repeats: ISO weekdays (1 = Mon … 7 = Sun) and a local "HH:mm". */
export type Repeat = { days: number[]; time: string };

export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const same = (a: number[], b: number[]) => a.length === b.length && a.every(day => b.includes(day));

export const PRESETS = {
  daily: [1, 2, 3, 4, 5, 6, 7],
  weekdays: [1, 2, 3, 4, 5],
  weekend: [6, 7],
} as const;

/** "Her gün", "Hafta içi", "Hafta sonu" or "Pzt, Çar, Cum". */
export const describeDays = (days: number[]) => {
  if (same(days, [...PRESETS.daily])) return 'Her gün';
  if (same(days, [...PRESETS.weekdays])) return 'Hafta içi her gün';
  if (same(days, [...PRESETS.weekend])) return 'Hafta sonları';
  return [...days].sort().map(day => DAY_SHORT[day - 1]).join(', ');
};
