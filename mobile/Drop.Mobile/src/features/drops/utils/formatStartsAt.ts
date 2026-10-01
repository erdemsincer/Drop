const time = (date: Date) => date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** "12 dk sonra", "Bugün 18:30", "Yarın 09:00", "Cuma 20:00". */
export const formatStartsAt = (iso: string, now = new Date()) => {
  const start = new Date(iso);
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);

  if (minutes <= 0) return 'Başladı';
  if (minutes < 60) return `${minutes} dk sonra`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (dayKey(start) === dayKey(now)) return `Bugün ${time(start)}`;
  if (dayKey(start) === dayKey(tomorrow)) return `Yarın ${time(start)}`;

  const weekday = start.toLocaleDateString('tr-TR', { weekday: 'long' });
  return `${weekday.charAt(0).toLocaleUpperCase('tr-TR')}${weekday.slice(1)} ${time(start)}`;
};
