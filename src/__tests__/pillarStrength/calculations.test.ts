import {
  calculateExtractionRatio,
  calculateFactorOfSafety,
  calculateTributaryAreaStressSquare,
  calculateVerticalStress,
  equationCalculators,
} from '@/lib/pillarStrength/calculations';
import type { GeometryInput } from '@/lib/pillarStrength/types';

describe('pillar strength calculations', () => {
  it('calculates vertical stress from unit weight in MPa', () => {
    const result = calculateVerticalStress({
      mode: 'unit-weight',
      unitWeightKnM3: 27,
      densityKgM3: 2700,
      gravityMS2: 9.81,
      depthM: 500,
    });

    expect(result.stressKpa).toBeCloseTo(13500);
    expect(result.stressMpa).toBeCloseTo(13.5);
  });

  it('calculates vertical stress from density in MPa', () => {
    const result = calculateVerticalStress({
      mode: 'density',
      unitWeightKnM3: 27,
      densityKgM3: 2700,
      gravityMS2: 9.81,
      depthM: 500,
    });

    expect(result.stressMpa).toBeCloseTo(13.2435);
  });

  it('calculates square tributary-area pillar stress', () => {
    const result = calculateTributaryAreaStressSquare(10, 8, 4);

    expect(result.pillarAreaM2).toBeCloseTo(64);
    expect(result.tributaryAreaM2).toBeCloseTo(144);
    expect(result.pillarStressMpa).toBeCloseTo(22.5);
  });

  it('calculates square extraction ratio', () => {
    const geometry: GeometryInput = {
      shape: 'square',
      widthM: 10,
      lengthM: 10,
      heightM: 4,
      openingXM: 5,
      openingYM: 5,
    };

    const result = calculateExtractionRatio(geometry);

    expect(result.extractionRatioPercent).toBeCloseTo(55.5556);
  });

  it('calculates rectangular extraction ratio with separate openings', () => {
    const geometry: GeometryInput = {
      shape: 'rectangular',
      widthM: 10,
      lengthM: 12,
      heightM: 4,
      openingXM: 5,
      openingYM: 6,
    };

    const result = calculateExtractionRatio(geometry);

    expect(result.extractionRatioPercent).toBeCloseTo(55.5556);
  });

  it('calculates factor of safety categories', () => {
    expect(calculateFactorOfSafety(12, 10).label).toBe('low');
    expect(calculateFactorOfSafety(15, 10).label).toBe('moderate');
    expect(calculateFactorOfSafety(20, 10).label).toBe('relatively-high');
    expect(calculateFactorOfSafety(9, 10).label).toBe('critical');
  });

  it('calculates Johnson / Obert-Duvall style strength', () => {
    const result = equationCalculators.linearUcsRatio({
      widthM: 8,
      lengthM: 8,
      heightM: 4,
      widthToHeightRatio: 2,
      equationInputs: { ucsMpa: 100 },
    });

    expect(result.strengthMpa).toBeCloseTo(122.2);
  });

  it('calculates Salamon and Munro style strength', () => {
    const result = equationCalculators.salamonMunro({
      widthM: 8,
      lengthM: 8,
      heightM: 4,
      widthToHeightRatio: 2,
      equationInputs: { strengthConstantMpa: 7.2 },
    });

    expect(result.strengthMpa).toBeCloseTo(
      7.2 * (Math.pow(8, 0.46) / Math.pow(4, 0.66))
    );
  });

  it('calculates Hedley and Grant hard-rock strength', () => {
    const result = equationCalculators.hedleyGrant({
      widthM: 9,
      lengthM: 9,
      heightM: 3,
      widthToHeightRatio: 3,
      equationInputs: {},
    });

    expect(result.strengthMpa).toBeCloseTo(179 * (3 / Math.pow(3, 0.75)));
  });

  it('calculates Lunder and Pakalnis strength', () => {
    const result = equationCalculators.lunderPakalnis({
      widthM: 8,
      lengthM: 8,
      heightM: 4,
      widthToHeightRatio: 2,
      equationInputs: { ucsMpa: 150, kappa: 1 },
    });

    expect(result.strengthMpa).toBeCloseTo(0.44 * 150 * (0.68 + 0.52));
  });
});

