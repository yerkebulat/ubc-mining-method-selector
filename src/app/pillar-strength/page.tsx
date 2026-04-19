import type { Metadata } from 'next';
import { PillarStrengthCalculator } from '@/components/pillarStrength/PillarStrengthCalculator';

export const metadata: Metadata = {
  title: 'Pillar Strength Calculations | UBC Mining Method Selector',
  description:
    'Metric room-and-pillar calculator for tributary-area stress, extraction ratio, empirical pillar strength, and factor of safety.',
};

export default function PillarStrengthPage() {
  return <PillarStrengthCalculator />;
}

