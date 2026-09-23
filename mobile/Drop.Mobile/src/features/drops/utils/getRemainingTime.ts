export type RemainingTime = {
  totalSeconds: number;
  label: string;
  isExpired: boolean;
};

export const getRemainingTime = (
  endsAt: string,
  now = new Date(),
): RemainingTime => {
  const end =
    new Date(endsAt).getTime();

  const current =
    now.getTime();

  const difference =
    Math.max(0, end - current);

  const totalSeconds =
    Math.floor(difference / 1000);

  if (totalSeconds <= 0) {
    return {
      totalSeconds: 0,
      label: 'Sona erdi',
      isExpired: true,
    };
  }

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60,
    );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return {
      totalSeconds,
      label: `${hours} sa ${minutes} dk`,
      isExpired: false,
    };
  }

  return {
    totalSeconds,
    label:
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`,
    isExpired: false,
  };
};