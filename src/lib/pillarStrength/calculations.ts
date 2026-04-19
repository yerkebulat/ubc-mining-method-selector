import type {
  EquationCalculationContext,
  EquationCalculationResult,
  EquationCalculator,
  ExtractionRatioResult,
  FactorOfSafetyResult,
  GeometryInput,
  LunderPakalnisConfinementResult,
  TributaryStressResult,
  VerticalStressInput,
  VerticalStressResult,
} from './types';

const POSITIVE_TOLERANCE = 0;
const PSI_TO_MPA = 0.006894757293168361;
const METRES_TO_INCHES = 39.37007874015748;

function isPositive(value: number | null | undefined): value is number {
  return Number.isFinite(value) && Number(value) > POSITIVE_TOLERANCE;
}

function isUsableNumber(value: number | null | undefined): value is number {
  return Number.isFinite(value);
}

function invalidResult(warning: string): EquationCalculationResult {
  return { strengthMpa: null, warnings: [warning] };
}

function getInput(
  context: EquationCalculationContext,
  key: string,
  label = key
): number | null {
  const value = context.equationInputs[key];
  if (!isUsableNumber(value)) {
    return null;
  }
  return value;
}

function requirePositiveGeometry(context: EquationCalculationContext): string | null {
  if (!isPositive(context.widthM) || !isPositive(context.heightM)) {
    return 'Pillar width and height must be greater than zero.';
  }
  return null;
}

function requirePositiveInput(
  context: EquationCalculationContext,
  key: string,
  label: string
): number | null {
  const value = getInput(context, key, label);
  if (!isPositive(value)) {
    return null;
  }
  return value;
}

function strengthResult(value: number, warnings: string[] = []): EquationCalculationResult {
  if (!Number.isFinite(value) || value < 0) {
    return {
      strengthMpa: null,
      warnings: ['The selected equation produced an invalid strength. Check inputs.'],
    };
  }

  return { strengthMpa: value, warnings };
}

export function calculateVerticalStress(
  input: VerticalStressInput
): VerticalStressResult {
  const warnings: string[] = [];
  const depthM = input.depthM;

  if (!isPositive(depthM)) {
    return {
      stressMpa: null,
      stressKpa: null,
      formula: input.mode === 'unit-weight' ? 'Pzz = gamma Z' : 'Pzz = rho g Z',
      warnings: ['Depth must be greater than zero.'],
    };
  }

  if (input.mode === 'unit-weight') {
    if (!isPositive(input.unitWeightKnM3)) {
      return {
        stressMpa: null,
        stressKpa: null,
        formula: 'Pzz = gamma Z',
        warnings: ['Unit weight must be greater than zero.'],
      };
    }

    const stressKpa = input.unitWeightKnM3 * depthM;
    return {
      stressMpa: stressKpa / 1000,
      stressKpa,
      formula: 'Pzz = gamma Z',
      warnings,
    };
  }

  if (!isPositive(input.densityKgM3) || !isPositive(input.gravityMS2)) {
    return {
      stressMpa: null,
      stressKpa: null,
      formula: 'Pzz = rho g Z',
      warnings: ['Density and gravity must be greater than zero.'],
    };
  }

  const stressPa = input.densityKgM3 * input.gravityMS2 * depthM;
  return {
    stressMpa: stressPa / 1_000_000,
    stressKpa: stressPa / 1000,
    formula: 'Pzz = rho g Z',
    warnings,
  };
}

export function calculateTributaryAreaStressSquare(
  verticalStressMpa: number | null,
  widthM: number,
  openingM: number
): TributaryStressResult {
  const warnings: string[] = [];

  if (!isPositive(verticalStressMpa)) {
    warnings.push('Vertical stress is unavailable.');
  }
  if (!isPositive(widthM)) {
    warnings.push('Pillar width must be greater than zero.');
  }
  if (!isUsableNumber(openingM) || openingM < 0) {
    warnings.push('Opening width cannot be negative.');
  }

  if (warnings.length > 0) {
    return {
      pillarAreaM2: null,
      tributaryAreaM2: null,
      pillarStressMpa: null,
      formula: 'sigma_p = Pzz ((wo + wp) / wp)^2',
      warnings,
    };
  }

  const pillarAreaM2 = widthM * widthM;
  const tributaryAreaM2 = (widthM + openingM) * (widthM + openingM);
  const pillarStressMpa =
    verticalStressMpa! * Math.pow((openingM + widthM) / widthM, 2);

  return {
    pillarAreaM2,
    tributaryAreaM2,
    pillarStressMpa,
    formula: 'sigma_p = Pzz ((wo + wp) / wp)^2',
    warnings,
  };
}

export function calculateTributaryAreaStressRectangular(
  verticalStressMpa: number | null,
  widthM: number,
  lengthM: number,
  openingXM: number,
  openingYM: number
): TributaryStressResult {
  const warnings: string[] = [];

  if (!isPositive(verticalStressMpa)) {
    warnings.push('Vertical stress is unavailable.');
  }
  if (!isPositive(widthM) || !isPositive(lengthM)) {
    warnings.push('Pillar width and length must be greater than zero.');
  }
  if (
    !isUsableNumber(openingXM) ||
    !isUsableNumber(openingYM) ||
    openingXM < 0 ||
    openingYM < 0
  ) {
    warnings.push('Opening widths cannot be negative.');
  }

  if (warnings.length > 0) {
    return {
      pillarAreaM2: null,
      tributaryAreaM2: null,
      pillarStressMpa: null,
      formula: 'sigma_p = Pzz ((a + cx)(b + cy)) / (ab)',
      warnings,
    };
  }

  const pillarAreaM2 = widthM * lengthM;
  const tributaryAreaM2 = (widthM + openingXM) * (lengthM + openingYM);
  const pillarStressMpa = verticalStressMpa! * (tributaryAreaM2 / pillarAreaM2);

  return {
    pillarAreaM2,
    tributaryAreaM2,
    pillarStressMpa,
    formula: 'sigma_p = Pzz ((a + cx)(b + cy)) / (ab)',
    warnings,
  };
}

export function calculateTributaryAreaStress(
  geometry: GeometryInput,
  verticalStressMpa: number | null
): TributaryStressResult {
  if (geometry.shape === 'square') {
    return calculateTributaryAreaStressSquare(
      verticalStressMpa,
      geometry.widthM,
      geometry.openingXM
    );
  }

  return calculateTributaryAreaStressRectangular(
    verticalStressMpa,
    geometry.widthM,
    geometry.lengthM,
    geometry.openingXM,
    geometry.openingYM
  );
}

export function calculateExtractionRatio(geometry: GeometryInput): ExtractionRatioResult {
  const warnings: string[] = [];
  const { shape, widthM, lengthM, openingXM, openingYM } = geometry;

  if (!isPositive(widthM) || !isPositive(lengthM)) {
    warnings.push('Pillar width and length must be greater than zero.');
  }
  if (
    !isUsableNumber(openingXM) ||
    !isUsableNumber(openingYM) ||
    openingXM < 0 ||
    openingYM < 0
  ) {
    warnings.push('Opening widths cannot be negative.');
  }

  if (warnings.length > 0) {
    return {
      extractionRatioPercent: null,
      formula:
        shape === 'square'
          ? 'r = [1 - (a / (a + c))^2] x 100'
          : 'r = [((a + cx)(b + cy) - ab) / ((a + cx)(b + cy))] x 100',
      warnings,
    };
  }

  const pillarAreaM2 = widthM * lengthM;
  const totalCellAreaM2 = (widthM + openingXM) * (lengthM + openingYM);
  const extractionRatioPercent =
    ((totalCellAreaM2 - pillarAreaM2) / totalCellAreaM2) * 100;

  if (extractionRatioPercent > 80) {
    warnings.push(
      'Extraction ratio exceeds 80%. Pillar stress can increase very rapidly in this range.'
    );
  } else if (extractionRatioPercent > 75) {
    warnings.push(
      'Extraction ratio exceeds 75%. Treat this as a practical warning point, not a universal safe limit.'
    );
  }

  return {
    extractionRatioPercent,
    formula:
      shape === 'square' && Math.abs(widthM - lengthM) < 1e-9
        ? 'r = [1 - (a / (a + c))^2] x 100'
        : 'r = [((a + cx)(b + cy) - ab) / ((a + cx)(b + cy))] x 100',
    warnings,
  };
}

export function calculateWidthToHeightRatio(
  widthM: number,
  heightM: number
): number | null {
  if (!isPositive(widthM) || !isPositive(heightM)) {
    return null;
  }
  return widthM / heightM;
}

export function classifyWidthToHeightRatio(
  ratio: number | null
): 'slender' | 'tall' | 'squat' | 'unavailable' {
  if (!isPositive(ratio)) return 'unavailable';
  if (ratio < 1) return 'slender';
  if (ratio < 2) return 'tall';
  return 'squat';
}

export function calculateFactorOfSafety(
  pillarStrengthMpa: number | null,
  pillarStressMpa: number | null
): FactorOfSafetyResult {
  if (!isPositive(pillarStrengthMpa) || !isPositive(pillarStressMpa)) {
    return {
      factorOfSafety: null,
      label: 'unavailable',
      guidance: 'Pillar strength and pillar stress are required before FS can be calculated.',
    };
  }

  const factorOfSafety = pillarStrengthMpa / pillarStressMpa;

  if (factorOfSafety < 1) {
    return {
      factorOfSafety,
      label: 'critical',
      guidance: 'FS is below 1.0. Calculated stress exceeds selected pillar strength.',
    };
  }

  if (factorOfSafety < 1.3) {
    return {
      factorOfSafety,
      label: 'low',
      guidance:
        'FS is low. Temporary or crush pillars may use lower FS only when that behavior is intentional.',
    };
  }

  if (factorOfSafety < 1.6) {
    return {
      factorOfSafety,
      label: 'moderate',
      guidance:
        'FS is moderate. Medium-term pillars are often discussed in this intermediate range.',
    };
  }

  return {
    factorOfSafety,
    label: 'relatively-high',
    guidance:
      'FS is relatively high. Long-term and barrier pillars generally require higher FS, but site-specific design still controls.',
  };
}

export function calculateLunderPakalnisConfinement(
  widthM: number,
  heightM: number
): LunderPakalnisConfinementResult {
  const warnings: string[] = [];
  const formula =
    'Cpav = 0.46[log10(W/H + 0.75)]^(1.4/(W/H)); kappa = tan(acos((1 - Cpav)/(1 + Cpav)))';

  if (!isPositive(widthM) || !isPositive(heightM)) {
    return {
      cpav: null,
      kappa: null,
      warnings: ['Lunder-Pakalnis kappa requires positive pillar width and height.'],
      formula,
    };
  }

  const ratio = widthM / heightM;
  const logTerm = Math.log10(ratio + 0.75);

  if (ratio <= 0.25 || logTerm <= 0) {
    return {
      cpav: null,
      kappa: null,
      warnings: [
        'Lunder-Pakalnis confinement cannot be calculated for this very low W/H ratio because the logarithmic term is not positive.',
      ],
      formula,
    };
  }

  if (ratio < 0.5) {
    warnings.push(
      'Lunder-Pakalnis W/H is very low. Check whether a hard-rock pillar equation is appropriate for this geometry.'
    );
  }

  if (ratio > 3) {
    warnings.push(
      'Lunder-Pakalnis W/H exceeds 3. Treat calculated kappa as extrapolated unless site calibration supports it.'
    );
  }

  const cpav = 0.46 * Math.pow(logTerm, 1.4 / ratio);
  const acosArgument = (1 - cpav) / (1 + cpav);

  if (!Number.isFinite(cpav) || acosArgument < -1 || acosArgument > 1) {
    return {
      cpav: null,
      kappa: null,
      warnings: ['Lunder-Pakalnis confinement calculation produced an invalid value.'],
      formula,
    };
  }

  const kappa = Math.tan(Math.acos(acosArgument));

  return {
    cpav,
    kappa,
    warnings,
    formula,
  };
}

export const equationCalculators: Record<string, EquationCalculator> = {
  bunting1912: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);

    const strengthPsi = 1000 * (0.7 + 0.3 * (context.widthM / context.heightM));
    return strengthResult(strengthPsi * PSI_TO_MPA, [
      'Bunting (1912) is implemented using the paper table form with the historical 1000 psi coefficient converted to MPa.',
    ]);
  },
  linearUcsRatio: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa) return invalidResult('UCS must be greater than zero.');

    return strengthResult(
      ucsMpa * (0.778 + 0.222 * (context.widthM / context.heightM))
    );
  },
  wangLinearUcsRatio: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa) return invalidResult('UCS must be greater than zero.');

    return strengthResult(
      ucsMpa * (0.78 + 0.22 * (context.widthM / context.heightM))
    );
  },
  coefficientOverSqrtHeight: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const coefficientK = requirePositiveInput(context, 'coefficientK', 'k');
    if (geometryError) return invalidResult(geometryError);
    if (!coefficientK) return invalidResult('Coefficient k must be greater than zero.');

    return strengthResult(coefficientK / Math.sqrt(context.heightM));
  },
  kSqrtWidthHeightRatio: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const coefficientK = requirePositiveInput(context, 'coefficientK', 'k');
    if (geometryError) return invalidResult(geometryError);
    if (!coefficientK) return invalidResult('Coefficient k must be greater than zero.');

    return strengthResult(
      coefficientK * Math.sqrt(context.widthM / context.heightM)
    );
  },
  greenwald1941: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);

    const widthIn = context.widthM * METRES_TO_INCHES;
    const heightIn = context.heightM * METRES_TO_INCHES;
    const strengthPsi =
      2800 * (Math.pow(widthIn, 0.5) / Math.pow(heightIn, 5 / 6));

    return strengthResult(strengthPsi * PSI_TO_MPA, [
      'Greenwald et al. (1941) is implemented in its historical inch/psi form and converted to MPa.',
    ]);
  },
  hollandGaddy: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const specimenDiameterM = requirePositiveInput(
      context,
      'specimenDiameterM',
      'specimen diameter'
    );
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa || !specimenDiameterM) {
      return invalidResult('UCS and specimen diameter must be greater than zero.');
    }

    const k = ucsMpa * Math.sqrt(specimenDiameterM);
    return strengthResult((k * Math.sqrt(context.widthM)) / context.heightM);
  },
  salamonMunro: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const strengthConstantMpa = requirePositiveInput(
      context,
      'strengthConstantMpa',
      'strength constant'
    );
    if (geometryError) return invalidResult(geometryError);
    if (!strengthConstantMpa) {
      return invalidResult('Strength constant must be greater than zero.');
    }

    return strengthResult(
      strengthConstantMpa *
        (Math.pow(context.widthM, 0.46) / Math.pow(context.heightM, 0.66))
    );
  },
  bieniawskiSmall1967: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);

    const widthIn = context.widthM * METRES_TO_INCHES;
    const heightIn = context.heightM * METRES_TO_INCHES;
    const warnings: string[] = [
      'Bieniawski (1967/1969) small-width variant is implemented in its historical inch/psi form and converted to MPa.',
    ];

    if (widthIn >= 60) {
      warnings.push('This variant is intended for pillar width less than 60 inches.');
    }

    const strengthPsi =
      1100 * (Math.pow(widthIn, 0.16) / Math.pow(heightIn, 0.55));
    return strengthResult(strengthPsi * PSI_TO_MPA, warnings);
  },
  bieniawskiLarge1967: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);

    const widthIn = context.widthM * METRES_TO_INCHES;
    const warnings: string[] = [
      'Bieniawski (1967/1969) large-width variant is implemented in its historical psi form and converted to MPa.',
    ];

    if (widthIn <= 60) {
      warnings.push('This variant is intended for pillar width greater than 60 inches.');
    }

    const strengthPsi = 400 + 200 * (context.widthM / context.heightM);
    return strengthResult(strengthPsi * PSI_TO_MPA, warnings);
  },
  modifiedSalamonMunro: (context) => {
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'specimen strength');
    const specimenWidthM = requirePositiveInput(
      context,
      'specimenWidthM',
      'specimen width'
    );
    const specimenHeightM = requirePositiveInput(
      context,
      'specimenHeightM',
      'specimen height'
    );
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa || !specimenWidthM || !specimenHeightM) {
      return invalidResult('Specimen strength, width, and height must be greater than zero.');
    }

    return strengthResult(
      ucsMpa *
        (Math.pow(context.widthM / specimenWidthM, 0.46) /
          Math.pow(context.heightM / specimenHeightM, 0.66)),
      [
        'The paper table shows specimen-scaled Wp/Ws and Hp/Hs terms. This implementation uses the height term as a denominator to preserve the Salamon-Munro height effect.',
      ]
    );
  },
  salamon1982: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const coefficientK = requirePositiveInput(context, 'coefficientK', 'k');
    const referenceRatio = requirePositiveInput(context, 'referenceRatio', 'R0');
    const epsilon = getInput(context, 'epsilon');
    if (geometryError) return invalidResult(geometryError);
    if (!coefficientK || !referenceRatio || epsilon === null) {
      return invalidResult('k, R0, and epsilon are required.');
    }
    if (Math.abs(epsilon) < 1e-9) {
      return invalidResult('Epsilon cannot be zero in the Salamon (1982) equation.');
    }

    const volumeM3 = context.widthM * context.lengthM * context.heightM;
    const ratio = context.widthM / context.heightM;
    const shapeTerm =
      (0.5933 / epsilon) * (Math.pow(ratio / referenceRatio, epsilon) - 1) + 1;

    return strengthResult(
      coefficientK *
        Math.pow(volumeM3, -0.0667) *
        Math.pow(referenceRatio, 0.5933) *
        shapeTerm,
      [
        'Salamon (1982) uses pillar volume V from the entered geometry and R = W/H. Confirm that k, R0, and epsilon match the calibration basis.',
      ]
    );
  },
  wilson: (context) => {
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const sigma3Mpa = getInput(context, 'sigma3Mpa');
    const betaDeg = getInput(context, 'frictionAngleDeg');
    if (!ucsMpa || sigma3Mpa === null || betaDeg === null || sigma3Mpa < 0) {
      return invalidResult('UCS, sigma3, and beta are required.');
    }

    return strengthResult(
      ucsMpa + sigma3Mpa * Math.tan((betaDeg * Math.PI) / 180)
    );
  },
  wardell: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const coefficientA = getInput(context, 'coefficientA');
    const coefficientB = getInput(context, 'coefficientB');
    if (geometryError) return invalidResult(geometryError);
    if (coefficientA === null || coefficientB === null) {
      return invalidResult('Coefficients a and b are required.');
    }

    return strengthResult(
      coefficientA * (1 / context.heightM) +
        coefficientB * Math.pow(context.widthM / context.heightM, 2)
    );
  },
  hardyAgapito1975: (context) => {
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'specimen strength');
    const specimenWidthM = requirePositiveInput(
      context,
      'specimenWidthM',
      'specimen width'
    );
    const specimenHeightM = requirePositiveInput(
      context,
      'specimenHeightM',
      'specimen height'
    );
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa || !specimenWidthM || !specimenHeightM) {
      return invalidResult('Specimen strength, width, and height must be greater than zero.');
    }

    return strengthResult(
      ucsMpa *
        (Math.pow(context.widthM / specimenWidthM, 0.597) /
          Math.pow(context.heightM / specimenHeightM, 0.951)),
      [
        'The paper table shows specimen-scaled Wp/Ws and Hp/Hs terms. This implementation uses the height term as a denominator so strength decreases with increasing pillar height.',
      ]
    );
  },
  bieniawski1981: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const alpha = getInput(context, 'alpha');
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa || alpha === null) {
      return invalidResult('UCS and alpha are required.');
    }

    return strengthResult(
      ucsMpa *
        Math.pow(0.64 + 0.36 * (context.widthM / context.heightM), alpha)
    );
  },
  hustrulidSwanson: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const specimenDiameterM = requirePositiveInput(
      context,
      'specimenDiameterM',
      'specimen diameter'
    );
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa || !specimenDiameterM) {
      return invalidResult('UCS and specimen diameter must be greater than zero.');
    }

    const k = ucsMpa * Math.sqrt(specimenDiameterM);
    return strengthResult(
      (k / Math.pow(context.heightM, 0.5)) *
        Math.pow(context.widthM / context.heightM, 0.5)
    );
  },
  hedleyGrant: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    return strengthResult(
      179 * (Math.pow(context.widthM, 0.5) / Math.pow(context.heightM, 0.75))
    );
  },
  hedleyRoxburghMuppalaneni: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    return strengthResult(
      133 * (Math.pow(context.widthM, 0.5) / Math.pow(context.heightM, 0.75))
    );
  },
  kimmelmannHydeMadgwick: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    return strengthResult(
      65 * (Math.pow(context.widthM, 0.46) / Math.pow(context.heightM, 0.66))
    );
  },
  kraulandSoder: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    return strengthResult(35.4 * (0.778 + 0.222 * (context.widthM / context.heightM)));
  },
  potvinHudymaMiller: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    if (geometryError) return invalidResult(geometryError);
    if (!ucsMpa) return invalidResult('UCS must be greater than zero.');
    return strengthResult(0.42 * ucsMpa * (context.widthM / context.heightM));
  },
  sjoberg: (context) => {
    const geometryError = requirePositiveGeometry(context);
    if (geometryError) return invalidResult(geometryError);
    return strengthResult(74 * (0.778 + 0.222 * (context.widthM / context.heightM)));
  },
  hoekBrown: (context) => {
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const sigma3Mpa = getInput(context, 'sigma3Mpa');
    const m = getInput(context, 'hoekBrownM');
    const s = getInput(context, 'hoekBrownS');
    if (!ucsMpa || sigma3Mpa === null || m === null || s === null || sigma3Mpa < 0) {
      return invalidResult('UCS, sigma3, m, and s are required.');
    }

    const radicand = m * ucsMpa * sigma3Mpa + s * Math.pow(ucsMpa, 2);
    if (radicand < 0) {
      return invalidResult('Hoek-Brown radicand is negative.');
    }

    return strengthResult(sigma3Mpa + Math.sqrt(radicand), [
      'Hoek-Brown is a failure criterion shown in the slide table, not a tributary-area pillar formula.',
    ]);
  },
  martin1993: (context) => {
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const sigma3Mpa = getInput(context, 'sigma3Mpa');
    const martinS = getInput(context, 'martinS');
    if (!ucsMpa || sigma3Mpa === null || sigma3Mpa < 0 || martinS === null || martinS < 0) {
      return invalidResult('UCS, non-negative sigma3, and non-negative Martin s are required.');
    }

    return strengthResult(sigma3Mpa + Math.sqrt(martinS) * ucsMpa, [
      'Martin (1993) is implemented as sigma1 = sigma3 + sqrt(s) sigma_c from the hard-rock table context.',
    ]);
  },
  lunderPakalnis: (context) => {
    const ucsMpa = requirePositiveInput(context, 'ucsMpa', 'UCS');
    const calculated = calculateLunderPakalnisConfinement(
      context.widthM,
      context.heightM
    );
    const kappa = getInput(context, 'kappa') ?? calculated.kappa;
    if (!ucsMpa || kappa === null || kappa < 0) {
      return invalidResult(
        calculated.warnings[0] ?? 'UCS and non-negative kappa are required.'
      );
    }

    return strengthResult(
      0.44 * ucsMpa * (0.68 + 0.52 * kappa),
      calculated.warnings
    );
  },
  customPowerLaw: (context) => {
    const geometryError = requirePositiveGeometry(context);
    const coefficientK = requirePositiveInput(context, 'coefficientK', 'k');
    const alpha = getInput(context, 'alpha');
    const beta = getInput(context, 'beta');
    const customMultiplier = getInput(context, 'customMultiplier') ?? 1;
    if (geometryError) return invalidResult(geometryError);
    if (!coefficientK || alpha === null || beta === null || customMultiplier < 0) {
      return invalidResult('k, alpha, beta, and multiplier are required.');
    }

    return strengthResult(
      customMultiplier *
        coefficientK *
        (Math.pow(context.widthM, alpha) / Math.pow(context.heightM, beta))
    );
  },
};
