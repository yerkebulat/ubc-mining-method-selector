export type PillarShape = 'square' | 'rectangular' | 'rib' | 'irregular';

export type RockCategory = 'coal-soft-rock' | 'hard-rock' | 'custom';

export type EquationStatus = 'implemented' | 'partial' | 'placeholder';

export type VerticalStressMode = 'unit-weight' | 'density';

export interface VerticalStressInput {
  mode: VerticalStressMode;
  unitWeightKnM3: number;
  densityKgM3: number;
  gravityMS2: number;
  depthM: number;
}

export interface VerticalStressResult {
  stressMpa: number | null;
  stressKpa: number | null;
  formula: string;
  warnings: string[];
}

export interface GeometryInput {
  shape: PillarShape;
  widthM: number;
  lengthM: number;
  heightM: number;
  openingXM: number;
  openingYM: number;
}

export interface TributaryStressResult {
  pillarAreaM2: number | null;
  tributaryAreaM2: number | null;
  pillarStressMpa: number | null;
  formula: string;
  warnings: string[];
}

export interface ExtractionRatioResult {
  extractionRatioPercent: number | null;
  formula: string;
  warnings: string[];
}

export interface EquationInputDefinition {
  key: string;
  label: string;
  unit?: string;
  defaultValue: number;
  min?: number;
  step?: number;
  helperText?: string;
}

export interface EquationVariableDefinition {
  symbol: string;
  description: string;
  unit?: string;
}

export interface PillarStrengthEquation {
  id: string;
  name: string;
  year?: string;
  reference: string;
  rockCategory: RockCategory;
  applicableRockType: string;
  formulaText: string;
  requiredInputs: EquationInputDefinition[];
  variableDefinitions: EquationVariableDefinition[];
  assumptions: string[];
  limitations: string[];
  status: EquationStatus;
  statusNote?: string;
  sourceNotes: string[];
  calculatorId?: string;
}

export interface EquationCalculationContext {
  widthM: number;
  lengthM: number;
  heightM: number;
  widthToHeightRatio: number | null;
  equationInputs: Record<string, number>;
}

export interface EquationCalculationResult {
  strengthMpa: number | null;
  warnings: string[];
}

export type EquationCalculator = (
  context: EquationCalculationContext
) => EquationCalculationResult;

export interface FactorOfSafetyResult {
  factorOfSafety: number | null;
  label: 'critical' | 'low' | 'moderate' | 'relatively-high' | 'unavailable';
  guidance: string;
}

