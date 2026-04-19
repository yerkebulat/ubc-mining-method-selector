'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calculator,
  Clipboard,
  Download,
  FileJson,
  Info,
} from 'lucide-react';
import {
  calculateExtractionRatio,
  calculateFactorOfSafety,
  calculateTributaryAreaStress,
  calculateVerticalStress,
  calculateWidthToHeightRatio,
  classifyWidthToHeightRatio,
  equationCalculators,
} from '@/lib/pillarStrength/calculations';
import { COMMON_EQUATION_INPUTS, DEFAULT_GEOMETRY, DEFAULT_VERTICAL_STRESS } from '@/lib/pillarStrength/constants';
import { pillarStrengthEquations } from '@/lib/pillarStrength/equations';
import {
  buildCsv,
  buildResultText,
  downloadTextFile,
  formatNumber,
  formatPercent,
  getMismatchWarning,
  getRockCategoryLabel,
  getStatusLabel,
} from '@/lib/pillarStrength/helpers';
import type {
  GeometryInput,
  PillarShape,
  RockCategory,
  VerticalStressInput,
} from '@/lib/pillarStrength/types';
import { cn } from '@/lib/utils';

const initialEquationInputs = Object.fromEntries(
  Object.values(COMMON_EQUATION_INPUTS).map((input) => [input.key, input.defaultValue])
) as Record<string, number>;

function toInputNumber(value: string): number {
  if (value.trim() === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-mining-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-mining-100 pb-4">
        <h2 className="text-xl font-semibold text-mining-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-mining-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function NumericField({
  id,
  label,
  unit,
  value,
  onChange,
  min,
  step = 0.1,
  helperText,
  disabled,
}: {
  id: string;
  label: string;
  unit?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  helperText?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {unit ? <span className="font-normal text-mining-500"> ({unit})</span> : null}
      </label>
      <input
        id={id}
        type="number"
        className="input"
        value={value}
        min={min}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(toInputNumber(event.target.value))}
      />
      {helperText && <p className="mt-1 text-xs text-mining-500">{helperText}</p>}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
}) {
  const toneClasses = {
    neutral: 'border-mining-200 bg-mining-50 text-mining-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-green-200 bg-green-50 text-green-900',
  };

  return (
    <div className={cn('rounded-lg border p-4', toneClasses[tone])}>
      <p className="text-xs font-medium uppercase text-current/70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-700" />
        <div>
          <p className="font-medium text-yellow-900">Warnings and notes</p>
          <ul className="mt-2 space-y-1 text-sm text-yellow-800">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function getFsTone(label: string): 'neutral' | 'warning' | 'danger' | 'success' {
  if (label === 'critical') return 'danger';
  if (label === 'low') return 'warning';
  if (label === 'moderate') return 'neutral';
  if (label === 'relatively-high') return 'success';
  return 'neutral';
}

function getStatusTone(status: string): string {
  if (status === 'implemented') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'partial') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-mining-50 text-mining-700 border-mining-200';
}

export function PillarStrengthCalculator() {
  const [geometry, setGeometry] = useState<GeometryInput>({
    ...DEFAULT_GEOMETRY,
    shape: DEFAULT_GEOMETRY.shape,
  });
  const [verticalStressInput, setVerticalStressInput] =
    useState<VerticalStressInput>({
      ...DEFAULT_VERTICAL_STRESS,
      mode: DEFAULT_VERTICAL_STRESS.mode,
    });
  const [useSeparateOpenings, setUseSeparateOpenings] = useState(false);
  const [rockWorkflow, setRockWorkflow] = useState<RockCategory>('coal-soft-rock');
  const [selectedEquationId, setSelectedEquationId] = useState('salamon-munro-1967');
  const [equationInputs, setEquationInputs] = useState<Record<string, number>>(
    initialEquationInputs
  );
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const selectedEquation =
    pillarStrengthEquations.find((equation) => equation.id === selectedEquationId) ??
    pillarStrengthEquations[0];

  const widthToHeightRatio = useMemo(
    () => calculateWidthToHeightRatio(geometry.widthM, geometry.heightM),
    [geometry.widthM, geometry.heightM]
  );
  const shapeClass = classifyWidthToHeightRatio(widthToHeightRatio);

  const verticalStress = useMemo(
    () => calculateVerticalStress(verticalStressInput),
    [verticalStressInput]
  );

  const tributaryStress = useMemo(
    () => calculateTributaryAreaStress(geometry, verticalStress.stressMpa),
    [geometry, verticalStress.stressMpa]
  );

  const extractionRatio = useMemo(
    () => calculateExtractionRatio(geometry),
    [geometry]
  );

  const equationResult = useMemo(() => {
    if (selectedEquation.status !== 'implemented' || !selectedEquation.calculatorId) {
      return {
        strengthMpa: null,
        warnings: [
          selectedEquation.statusNote ??
            'This equation is listed from the reference slides but is not fully parameterized yet.',
        ],
      };
    }

    const calculator = equationCalculators[selectedEquation.calculatorId];
    if (!calculator) {
      return {
        strengthMpa: null,
        warnings: ['No calculator is registered for the selected equation.'],
      };
    }

    return calculator({
      widthM: geometry.widthM,
      lengthM: geometry.lengthM,
      heightM: geometry.heightM,
      widthToHeightRatio,
      equationInputs,
    });
  }, [equationInputs, geometry, selectedEquation, widthToHeightRatio]);

  const factorOfSafety = useMemo(
    () =>
      calculateFactorOfSafety(
        equationResult.strengthMpa,
        tributaryStress.pillarStressMpa
      ),
    [equationResult.strengthMpa, tributaryStress.pillarStressMpa]
  );

  const mismatchWarning = getMismatchWarning(
    rockWorkflow,
    selectedEquation.rockCategory
  );

  const allWarnings = [
    ...verticalStress.warnings,
    ...tributaryStress.warnings,
    ...extractionRatio.warnings,
    ...equationResult.warnings,
    ...(mismatchWarning ? [mismatchWarning] : []),
  ];

  const summary = {
    'Pillar shape': geometry.shape,
    'Selected equation': `${selectedEquation.name}${
      selectedEquation.year ? ` (${selectedEquation.year})` : ''
    }`,
    'Equation status': getStatusLabel(selectedEquation.status),
    'Rock workflow': getRockCategoryLabel(rockWorkflow),
    'Pillar width (m)': geometry.widthM,
    'Pillar length (m)': geometry.lengthM,
    'Pillar height (m)': geometry.heightM,
    'Opening X (m)': geometry.openingXM,
    'Opening Y (m)': geometry.openingYM,
    'Depth (m)': verticalStressInput.depthM,
    'Vertical stress (MPa)': formatNumber(verticalStress.stressMpa, 2),
    'Pillar area (m2)': formatNumber(tributaryStress.pillarAreaM2, 2),
    'Tributary area (m2)': formatNumber(tributaryStress.tributaryAreaM2, 2),
    'Pillar stress (MPa)': formatNumber(tributaryStress.pillarStressMpa, 2),
    'Extraction ratio (%)': formatNumber(extractionRatio.extractionRatioPercent, 1),
    'Pillar strength (MPa)': formatNumber(equationResult.strengthMpa, 2),
    'Factor of safety': formatNumber(factorOfSafety.factorOfSafety, 2),
    'Warnings / notes': allWarnings.join(' | ') || 'None',
  };

  const updateGeometry = (key: keyof GeometryInput, value: number | PillarShape) => {
    setGeometry((previous) => {
      const next = { ...previous, [key]: value };

      if (key === 'shape') {
        if (value === 'square') {
          next.lengthM = previous.widthM;
          next.openingYM = previous.openingXM;
        }
        return next;
      }

      if (previous.shape === 'square' && key === 'widthM' && typeof value === 'number') {
        next.lengthM = value;
      }

      if (
        (previous.shape === 'square' || !useSeparateOpenings) &&
        key === 'openingXM' &&
        typeof value === 'number'
      ) {
        next.openingYM = value;
      }

      return next;
    });
  };

  const handleSeparateOpeningsChange = (checked: boolean) => {
    setUseSeparateOpenings(checked);
    if (!checked) {
      setGeometry((previous) => ({ ...previous, openingYM: previous.openingXM }));
    }
  };

  const handleCopyResults = async () => {
    const text = buildResultText(summary);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Results copied to clipboard.');
    } catch {
      setCopyStatus('Clipboard unavailable. Export JSON or CSV instead.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-mining-600 hover:text-mining-900">
          Back to tools
        </Link>
      </div>

      <div className="mb-8 max-w-4xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-mining-200 bg-mining-50 px-3 py-1 text-sm text-mining-700">
          <Calculator className="h-4 w-4" />
          Metric engineering calculator
        </div>
        <h1 className="text-3xl font-bold text-mining-900 md:text-4xl">
          Pillar Strength Calculations
        </h1>
        <p className="mt-3 text-lg text-mining-600">
          Preliminary room-and-pillar assessment for pillar stress, extraction ratio,
          empirical pillar strength, and factor of safety. Empirical equations depend
          on rock type and calibration context, and tributary-area loading is a
          simplified average stress estimate.
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
          <div>
            <p className="font-semibold text-red-900">
              These calculations are simplified empirical and tributary-area estimates
              and should not be used blindly for final design.
            </p>
            <p className="mt-1 text-sm text-red-800">
              Outputs are screening-level only. Final design requires site-specific
              geology, stress analysis, calibration, monitoring data, and professional
              engineering judgment.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Section
            title="Pillar Geometry"
            description="Square and rectangular pillars are active. Rib and irregular pillars are listed as future extensions."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(['square', 'rectangular', 'rib', 'irregular'] as PillarShape[]).map(
                (shape) => {
                  const disabled = shape === 'rib' || shape === 'irregular';
                  return (
                    <label
                      key={shape}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium',
                        geometry.shape === shape
                          ? 'border-mining-600 bg-mining-50 text-mining-900'
                          : 'border-mining-200 text-mining-600',
                        disabled && 'cursor-not-allowed opacity-55'
                      )}
                    >
                      <input
                        type="radio"
                        name="pillar-shape"
                        value={shape}
                        disabled={disabled}
                        checked={geometry.shape === shape}
                        onChange={() => updateGeometry('shape', shape)}
                      />
                      <span className="capitalize">{shape}</span>
                      {disabled && <span className="text-xs">(placeholder)</span>}
                    </label>
                  );
                }
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <NumericField
                id="pillar-width"
                label="Pillar width, W"
                unit="m"
                value={geometry.widthM}
                min={0}
                onChange={(value) => updateGeometry('widthM', value)}
                helperText="wp for square pillars; a or W for rectangular formulas."
              />
              <NumericField
                id="pillar-length"
                label="Pillar length, L"
                unit="m"
                value={geometry.lengthM}
                min={0}
                disabled={geometry.shape === 'square'}
                onChange={(value) => updateGeometry('lengthM', value)}
                helperText={
                  geometry.shape === 'square'
                    ? 'Linked to width for square pillars.'
                    : 'b or L for rectangular formulas.'
                }
              />
              <NumericField
                id="pillar-height"
                label="Pillar height, H"
                unit="m"
                value={geometry.heightM}
                min={0}
                onChange={(value) => updateGeometry('heightM', value)}
                helperText="Mining height used in width-to-height and strength equations."
              />
              <div className="rounded-lg border border-mining-200 bg-mining-50 p-4">
                <p className="text-sm font-medium text-mining-700">Width-to-height ratio</p>
                <p className="mt-1 text-2xl font-semibold text-mining-900">
                  {formatNumber(widthToHeightRatio, 2)}
                </p>
                <p className="mt-1 text-sm capitalize text-mining-600">{shapeClass}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <NumericField
                id="opening-x"
                label="Room/opening width in X, c_x"
                unit="m"
                value={geometry.openingXM}
                min={0}
                onChange={(value) => updateGeometry('openingXM', value)}
                helperText="wo for square tributary-area stress."
              />
              <div>
                <NumericField
                  id="opening-y"
                  label="Room/opening width in Y, c_y"
                  unit="m"
                  value={geometry.openingYM}
                  min={0}
                  disabled={geometry.shape === 'square' || !useSeparateOpenings}
                  onChange={(value) => updateGeometry('openingYM', value)}
                  helperText={
                    geometry.shape === 'square' || !useSeparateOpenings
                      ? 'Using the same opening width in both directions.'
                      : 'Separate spacing for rectangular layouts.'
                  }
                />
                {geometry.shape === 'rectangular' && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-mining-700">
                    <input
                      type="checkbox"
                      checked={useSeparateOpenings}
                      onChange={(event) =>
                        handleSeparateOpeningsChange(event.target.checked)
                      }
                    />
                    Use separate opening widths
                  </label>
                )}
              </div>
            </div>
          </Section>

          <Section
            title="Overburden Stress"
            description="Estimate average geostatic vertical stress using unit weight or density."
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-mining-200 p-3 text-sm font-medium text-mining-700">
                <input
                  type="radio"
                  name="vertical-stress-mode"
                  checked={verticalStressInput.mode === 'unit-weight'}
                  onChange={() =>
                    setVerticalStressInput((previous) => ({
                      ...previous,
                      mode: 'unit-weight',
                    }))
                  }
                />
                Unit weight mode: Pzz = gamma Z
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-mining-200 p-3 text-sm font-medium text-mining-700">
                <input
                  type="radio"
                  name="vertical-stress-mode"
                  checked={verticalStressInput.mode === 'density'}
                  onChange={() =>
                    setVerticalStressInput((previous) => ({
                      ...previous,
                      mode: 'density',
                    }))
                  }
                />
                Density mode: Pzz = rho g Z
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {verticalStressInput.mode === 'unit-weight' ? (
                <NumericField
                  id="unit-weight"
                  label="Unit weight, gamma"
                  unit="kN/m3"
                  value={verticalStressInput.unitWeightKnM3}
                  min={0}
                  onChange={(value) =>
                    setVerticalStressInput((previous) => ({
                      ...previous,
                      unitWeightKnM3: value,
                    }))
                  }
                />
              ) : (
                <>
                  <NumericField
                    id="density"
                    label="Density, rho"
                    unit="kg/m3"
                    value={verticalStressInput.densityKgM3}
                    min={0}
                    step={10}
                    onChange={(value) =>
                      setVerticalStressInput((previous) => ({
                        ...previous,
                        densityKgM3: value,
                      }))
                    }
                  />
                  <NumericField
                    id="gravity"
                    label="Gravity, g"
                    unit="m/s2"
                    value={verticalStressInput.gravityMS2}
                    min={0}
                    step={0.01}
                    onChange={(value) =>
                      setVerticalStressInput((previous) => ({
                        ...previous,
                        gravityMS2: value,
                      }))
                    }
                  />
                </>
              )}
              <NumericField
                id="depth"
                label="Depth, Z"
                unit="m"
                value={verticalStressInput.depthM}
                min={0}
                step={1}
                onChange={(value) =>
                  setVerticalStressInput((previous) => ({
                    ...previous,
                    depthM: value,
                  }))
                }
              />
              <Metric
                label={`Vertical stress (${verticalStress.formula})`}
                value={`${formatNumber(verticalStress.stressMpa, 2)} MPa`}
              />
            </div>
            <p className="mt-3 text-sm text-mining-500">
              This is an average geostatic vertical stress estimate and does not include
              local abutment, topographic, tectonic, or mining-induced stress effects.
            </p>
          </Section>

          <Section
            title="Pillar Stress and Extraction Ratio"
            description="Tributary-area loading assumes each pillar carries the load from its surrounding cell."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Pillar area"
                value={`${formatNumber(tributaryStress.pillarAreaM2, 2)} m2`}
              />
              <Metric
                label="Tributary area"
                value={`${formatNumber(tributaryStress.tributaryAreaM2, 2)} m2`}
              />
              <Metric
                label="Average pillar stress"
                value={`${formatNumber(tributaryStress.pillarStressMpa, 2)} MPa`}
              />
              <Metric
                label="Extraction ratio"
                value={formatPercent(extractionRatio.extractionRatioPercent)}
                tone={
                  (extractionRatio.extractionRatioPercent ?? 0) > 80
                    ? 'danger'
                    : (extractionRatio.extractionRatioPercent ?? 0) > 75
                      ? 'warning'
                      : 'neutral'
                }
              />
            </div>
            <div className="mt-4 space-y-2 text-sm text-mining-600">
              <p>
                Stress formula: <span className="font-medium">{tributaryStress.formula}</span>
              </p>
              <p>
                Extraction formula:{' '}
                <span className="font-medium">{extractionRatio.formula}</span>
              </p>
              <p>
                Stress increases rapidly as extraction ratio rises. A 75% extraction
                ratio is a broad practical reference point, not a universal safe limit.
              </p>
            </div>
          </Section>

          <Section
            title="Pillar Strength Equation"
            description="The catalog is driven by the equations identifiable from the reference slides."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="rock-workflow" className="label">
                  Rock workflow
                </label>
                <select
                  id="rock-workflow"
                  className="select"
                  value={rockWorkflow}
                  onChange={(event) => setRockWorkflow(event.target.value as RockCategory)}
                >
                  <option value="coal-soft-rock">Coal / soft rock</option>
                  <option value="hard-rock">Hard rock</option>
                  <option value="custom">Custom</option>
                </select>
                <p className="mt-1 text-xs text-mining-500">
                  This does not hide equations; it only helps flag context mismatch.
                </p>
              </div>
              <div>
                <label htmlFor="equation" className="label">
                  Equation
                </label>
                <select
                  id="equation"
                  className="select"
                  value={selectedEquationId}
                  onChange={(event) => setSelectedEquationId(event.target.value)}
                >
                  {pillarStrengthEquations.map((equation) => (
                    <option key={equation.id} value={equation.id}>
                      {equation.name}
                      {equation.year ? ` (${equation.year})` : ''} -{' '}
                      {getStatusLabel(equation.status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-mining-200 bg-mining-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-mining-900">
                    {selectedEquation.name}
                    {selectedEquation.year ? ` (${selectedEquation.year})` : ''}
                  </h3>
                  <p className="mt-1 text-sm text-mining-600">
                    {selectedEquation.reference} ·{' '}
                    {getRockCategoryLabel(selectedEquation.rockCategory)} ·{' '}
                    {selectedEquation.applicableRockType}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-lg border px-3 py-1 text-xs font-semibold',
                    getStatusTone(selectedEquation.status)
                  )}
                >
                  {getStatusLabel(selectedEquation.status)}
                </span>
              </div>
              <p className="mt-4 rounded-lg bg-white p-3 font-mono text-sm text-mining-800">
                {selectedEquation.formulaText}
              </p>
              {selectedEquation.status !== 'implemented' && (
                <p className="mt-3 text-sm font-medium text-yellow-800">
                  {selectedEquation.statusNote ??
                    'This equation is listed from the reference slides but is not fully parameterized yet.'}
                </p>
              )}
            </div>

            {selectedEquation.requiredInputs.length > 0 && (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {selectedEquation.requiredInputs.map((input) => (
                  <NumericField
                    key={input.key}
                    id={`equation-${input.key}`}
                    label={input.label}
                    unit={input.unit}
                    value={equationInputs[input.key] ?? input.defaultValue}
                    min={input.min}
                    step={input.step ?? 0.1}
                    helperText={input.helperText}
                    onChange={(value) =>
                      setEquationInputs((previous) => ({
                        ...previous,
                        [input.key]: value,
                      }))
                    }
                  />
                ))}
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-mining-900">Variables</h4>
                <ul className="mt-2 space-y-2 text-sm text-mining-600">
                  {selectedEquation.variableDefinitions.map((variable) => (
                    <li key={`${selectedEquation.id}-${variable.symbol}`}>
                      <span className="font-medium text-mining-800">{variable.symbol}</span>:{' '}
                      {variable.description}
                      {variable.unit ? ` (${variable.unit})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-mining-900">Assumptions</h4>
                <ul className="mt-2 space-y-2 text-sm text-mining-600">
                  {[...selectedEquation.assumptions, ...selectedEquation.limitations].map(
                    (item) => (
                      <li key={`${selectedEquation.id}-${item}`}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Assumptions and Limitations">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-900">
                  Do not use pillar strength equations blindly.
                </p>
                <p className="mt-2 text-sm text-red-800">
                  Choose equations that reflect the rock type, geometry, specimen basis,
                  and calibration context.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-mining-600">
                <li>Tributary-area loading assumes simplified equal load sharing.</li>
                <li>Pillars are assumed loaded approximately parallel to their vertical axis.</li>
                <li>Equal load sharing may not be valid near abutments, faults, or excavated edges.</li>
                <li>Empirical equations are calibration-dependent.</li>
                <li>Geology, joints, scale effects, blasting damage, time effects, and irregular geometry matter.</li>
                <li>Rib and irregular pillars need additional geometry and stress logic.</li>
              </ul>
            </div>
          </Section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <Section title="Live Results Summary">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric
                  label="Pillar strength"
                  value={`${formatNumber(equationResult.strengthMpa, 2)} MPa`}
                  tone={selectedEquation.status === 'implemented' ? 'success' : 'warning'}
                />
                <Metric
                  label="Pillar stress"
                  value={`${formatNumber(tributaryStress.pillarStressMpa, 2)} MPa`}
                />
                <Metric
                  label="Factor of safety"
                  value={formatNumber(factorOfSafety.factorOfSafety, 2)}
                  tone={getFsTone(factorOfSafety.label)}
                />
                <Metric
                  label="Extraction ratio"
                  value={formatPercent(extractionRatio.extractionRatioPercent)}
                  tone={
                    (extractionRatio.extractionRatioPercent ?? 0) > 80
                      ? 'danger'
                      : (extractionRatio.extractionRatioPercent ?? 0) > 75
                        ? 'warning'
                        : 'neutral'
                  }
                />
              </div>

              <div className="mt-4 rounded-lg border border-mining-200 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-mining-500" />
                  <p className="text-sm text-mining-600">{factorOfSafety.guidance}</p>
                </div>
                <p className="mt-3 text-sm text-mining-600">
                  Temporary or crush pillars may use lower FS, medium-term pillars often
                  use intermediate FS, and long-term or barrier pillars generally require
                  higher FS. This is guidance text only, not design approval logic.
                </p>
              </div>

              <WarningList warnings={allWarnings} />
            </Section>

            <Section title="Copy and Export">
              <div className="space-y-3">
                <button
                  type="button"
                  className="btn-primary w-full gap-2"
                  onClick={handleCopyResults}
                >
                  <Clipboard className="h-4 w-4" />
                  Copy Results
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="btn-outline gap-2"
                    onClick={() =>
                      downloadTextFile(
                        'pillar-strength-results.json',
                        JSON.stringify(summary, null, 2),
                        'application/json'
                      )
                    }
                  >
                    <FileJson className="h-4 w-4" />
                    Export JSON
                  </button>
                  <button
                    type="button"
                    className="btn-outline gap-2"
                    onClick={() =>
                      downloadTextFile(
                        'pillar-strength-results.csv',
                        buildCsv(summary),
                        'text/csv'
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </button>
                </div>
                {copyStatus && <p className="text-sm text-mining-600">{copyStatus}</p>}
              </div>
            </Section>

            <Section title="Detailed Summary">
              <dl className="space-y-3 text-sm">
                {Object.entries(summary).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex gap-3 border-b border-mining-100 pb-2 last:border-0 last:pb-0"
                  >
                    <dt className="min-w-0 flex-1 text-mining-500">{key}</dt>
                    <dd className="max-w-[55%] text-right font-medium text-mining-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>
          </div>
        </aside>
      </div>
    </div>
  );
}
