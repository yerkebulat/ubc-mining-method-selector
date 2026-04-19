import type { EquationInputDefinition } from './types';

export const DEFAULT_GEOMETRY = {
  shape: 'square',
  widthM: 8,
  lengthM: 8,
  heightM: 4,
  openingXM: 6,
  openingYM: 6,
} as const;

export const DEFAULT_VERTICAL_STRESS = {
  mode: 'unit-weight',
  unitWeightKnM3: 27,
  densityKgM3: 2700,
  gravityMS2: 9.81,
  depthM: 300,
} as const;

export const COMMON_EQUATION_INPUTS: Record<string, EquationInputDefinition> = {
  ucsMpa: {
    key: 'ucsMpa',
    label: 'UCS / intact compressive strength',
    unit: 'MPa',
    defaultValue: 80,
    min: 0,
    step: 1,
    helperText: 'Use the strength value required by the selected empirical equation.',
  },
  strengthConstantMpa: {
    key: 'strengthConstantMpa',
    label: 'Strength constant',
    unit: 'MPa',
    defaultValue: 7.2,
    min: 0,
    step: 0.1,
    helperText:
      'Equation-specific strength constant. Keep the same metric basis as the formula calibration.',
  },
  coefficientK: {
    key: 'coefficientK',
    label: 'Coefficient k',
    unit: 'MPa',
    defaultValue: 10,
    min: 0,
    step: 0.1,
    helperText:
      'Calibrated empirical coefficient. The unit depends on the equation form.',
  },
  specimenDiameterM: {
    key: 'specimenDiameterM',
    label: 'Specimen diameter / size D',
    unit: 'm',
    defaultValue: 0.05,
    min: 0,
    step: 0.01,
    helperText: 'Reference specimen size used to derive k from UCS.',
  },
  alpha: {
    key: 'alpha',
    label: 'Exponent alpha',
    defaultValue: 1,
    step: 0.05,
    helperText: 'Calibration exponent shown in the reference equation.',
  },
  beta: {
    key: 'beta',
    label: 'Exponent beta',
    defaultValue: 1,
    step: 0.05,
    helperText: 'Height exponent for custom empirical forms.',
  },
  coefficientA: {
    key: 'coefficientA',
    label: 'Coefficient a',
    unit: 'MPa.m',
    defaultValue: 1,
    step: 0.1,
    helperText: 'Wardell coefficient for the 1/H term.',
  },
  coefficientB: {
    key: 'coefficientB',
    label: 'Coefficient b',
    unit: 'MPa',
    defaultValue: 1,
    step: 0.1,
    helperText: 'Wardell coefficient for the (W/H)^2 term.',
  },
  sigma3Mpa: {
    key: 'sigma3Mpa',
    label: 'Confining stress sigma3',
    unit: 'MPa',
    defaultValue: 0,
    min: 0,
    step: 0.1,
    helperText: 'Minor principal stress used by confinement-based criteria.',
  },
  frictionAngleDeg: {
    key: 'frictionAngleDeg',
    label: 'Angle beta',
    unit: 'degrees',
    defaultValue: 30,
    step: 1,
    helperText: 'Angle term in the Wilson equation.',
  },
  hoekBrownM: {
    key: 'hoekBrownM',
    label: 'Hoek-Brown m',
    defaultValue: 10,
    min: 0,
    step: 0.1,
  },
  hoekBrownS: {
    key: 'hoekBrownS',
    label: 'Hoek-Brown s',
    defaultValue: 1,
    min: 0,
    step: 0.01,
  },
  kappa: {
    key: 'kappa',
    label: 'Lunder-Pakalnis kappa',
    defaultValue: 1,
    min: 0,
    step: 0.05,
    helperText:
      'Confinement term used by the Lunder and Pakalnis hard-rock equation.',
  },
  customMultiplier: {
    key: 'customMultiplier',
    label: 'Strength multiplier',
    defaultValue: 1,
    min: 0,
    step: 0.05,
  },
};

