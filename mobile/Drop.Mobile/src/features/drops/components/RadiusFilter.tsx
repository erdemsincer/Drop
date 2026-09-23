import { ChoiceChips } from '@/ui';

const RADIUS_OPTIONS = [1, 3, 5, 10].map(value => ({ label: `${value} km`, value }));

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function RadiusFilter({ value, onChange }: Props) {
  return <ChoiceChips options={RADIUS_OPTIONS} value={value} onChange={onChange} />;
}
