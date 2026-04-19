'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Download,
  FileJson,
  FileText,
  Info,
  Link as LinkIcon,
} from 'lucide-react';
import {
  calculateExtractionRatio,
  calculateFactorOfSafety,
  calculateLunderPakalnisConfinement,
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
  EquationStatus,
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

type EquationCategoryFilter = RockCategory | 'all';
type EquationStatusFilter = EquationStatus | 'all';
type StepId = 'geometry' | 'overburden' | 'stress' | 'strength' | 'results';

const orderedSteps: StepId[] = ['geometry', 'overburden', 'stress', 'strength', 'results'];

function CompactSummary({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: 'neutral' | 'warning' | 'danger' | 'success' }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const toneClasses = {
          neutral: 'border-mining-200 bg-mining-50 text-mining-700',
          warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          danger: 'border-red-200 bg-red-50 text-red-800',
          success: 'border-green-200 bg-green-50 text-green-800',
        };

        return (
          <div
            key={`${item.label}-${item.value}`}
            className={cn('rounded-lg border px-3 py-2', toneClasses[item.tone ?? 'neutral'])}
          >
            <p className="text-xs font-medium uppercase text-current/70">{item.label}</p>
            <p className="mt-0.5 text-sm font-semibold">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function FocusSection({
  step,
  stepNumber,
  title,
  description,
  summary,
  activeStep,
  onActivate,
  onNext,
  children,
}: {
  step: StepId;
  stepNumber: number;
  title: string;
  description: string;
  summary: React.ReactNode;
  activeStep: StepId;
  onActivate: (step: StepId) => void;
  onNext?: () => void;
  children: React.ReactNode;
}) {
  const isActive = activeStep === step;

  return (
    <section
      className={cn(
        'rounded-lg border bg-white shadow-sm transition-colors',
        isActive ? 'border-mining-500' : 'border-mining-200'
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
        aria-expanded={isActive}
        onClick={() => onActivate(step)}
      >
        <span
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-semibold',
            isActive
              ? 'border-mining-700 bg-mining-700 text-white'
              : 'border-mining-200 bg-mining-50 text-mining-700'
          )}
        >
          {stepNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-mining-900">{title}</span>
          <span className="mt-1 block text-sm text-mining-600">{description}</span>
        </span>
        <ChevronDown
          className={cn(
            'mt-1 h-5 w-5 flex-shrink-0 text-mining-500 transition-transform',
            isActive && 'rotate-180'
          )}
        />
      </button>

      {isActive ? (
        <div className="border-t border-mining-100 p-4 sm:p-5">
          {children}
          {onNext && (
            <div className="mt-6 flex justify-end">
              <button type="button" className="btn-primary" onClick={onNext}>
                Continue
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-mining-100 px-4 py-3 sm:px-5">{summary}</div>
      )}
    </section>
  );
}

function AdvancedPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-lg border border-mining-200 bg-white shadow-sm">
      <summary className="cursor-pointer p-4 sm:p-5">
        <span className="block text-lg font-semibold text-mining-900">{title}</span>
        {description && <span className="mt-1 block text-sm text-mining-600">{description}</span>}
      </summary>
      <div className="border-t border-mining-100 p-4 sm:p-5">{children}</div>
    </details>
  );
}

function getEquationApplicabilityWarnings(
  ratio: number | null,
  selectedEquationId: string
): string[] {
  const warnings: string[] = [];

  if (ratio !== null && ratio < 0.5) {
    warnings.push(
      'Width-to-height ratio is below 0.5. Many empirical pillar equations are poorly constrained for very slender pillars.'
    );
  }

  if (ratio !== null && ratio > 5) {
    warnings.push(
      'Width-to-height ratio exceeds 5. Squat-pillar behavior may need a specialized approach and site calibration.'
    );
  }

  if (selectedEquationId.includes('bieniawski') || selectedEquationId.includes('holland')) {
    warnings.push(
      'This selected equation includes specimen-size or calibration assumptions. Confirm that the strength input uses the matching basis.'
    );
  }

  return warnings;
}

function PillarGeometryDiagram({ geometry }: { geometry: GeometryInput }) {
  const cellWidth = Math.max(geometry.widthM + geometry.openingXM, 1);
  const cellLength = Math.max(geometry.lengthM + geometry.openingYM, 1);
  const pillarWidthPct = Math.min(Math.max((geometry.widthM / cellWidth) * 100, 8), 84);
  const pillarLengthPct = Math.min(Math.max((geometry.lengthM / cellLength) * 100, 8), 84);
  const pillarX = (100 - pillarWidthPct) / 2;
  const pillarY = (100 - pillarLengthPct) / 2;

  return (
    <div className="rounded-lg border border-mining-200 bg-mining-50 p-4">
      <p className="mb-3 text-sm font-semibold text-mining-900">Plan-view geometry</p>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Plan-view diagram of tributary cell, pillar, and openings"
        className="h-56 w-full rounded-lg border border-mining-200 bg-white"
      >
        <rect x="8" y="8" width="84" height="84" fill="#ebeef3" stroke="#7c94b2" />
        <rect
          x={8 + pillarX * 0.84}
          y={8 + pillarY * 0.84}
          width={pillarWidthPct * 0.84}
          height={pillarLengthPct * 0.84}
          fill="#ffffff"
          stroke="#344256"
          strokeWidth="1.8"
        />
        <line x1="8" y1="95" x2="92" y2="95" stroke="#485f7f" strokeWidth="0.8" />
        <line x1="95" y1="8" x2="95" y2="92" stroke="#485f7f" strokeWidth="0.8" />
        <text x="50" y="98" textAnchor="middle" fontSize="5" fill="#344256">
          a + c_x
        </text>
        <text
          x="99"
          y="50"
          textAnchor="middle"
          fontSize="5"
          fill="#344256"
          transform="rotate(90 99 50)"
        >
          b + c_y
        </text>
        <text x="50" y="51" textAnchor="middle" fontSize="6" fill="#1f2530">
          pillar
        </text>
      </svg>
      <p className="mt-3 text-xs text-mining-600">
        Shaded area is the tributary cell; the white rectangle is the pillar. Diagram is
        schematic, not to exact drawing scale.
      </p>
    </div>
  );
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
  const [categoryFilter, setCategoryFilter] = useState<EquationCategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<EquationStatusFilter>('all');
  const [useManualKappa, setUseManualKappa] = useState(false);
  const [comparisonEquationIds, setComparisonEquationIds] = useState<string[]>([
    'salamon-munro-1967',
    'hedley-grant-1972',
    'lunder-pakalnis-1997',
  ]);
  const [hasLoadedUrlState, setHasLoadedUrlState] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>('geometry');

  const selectedEquation =
    pillarStrengthEquations.find((equation) => equation.id === selectedEquationId) ??
    pillarStrengthEquations[0];

  const filteredEquations = useMemo(
    () =>
      pillarStrengthEquations.filter((equation) => {
        const categoryMatches =
          categoryFilter === 'all' || equation.rockCategory === categoryFilter;
        const statusMatches = statusFilter === 'all' || equation.status === statusFilter;
        return categoryMatches && statusMatches;
      }),
    [categoryFilter, statusFilter]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const shape = params.get('shape') as PillarShape | null;
    const mode = params.get('vsMode') as VerticalStressInput['mode'] | null;
    const rock = params.get('rock') as RockCategory | null;
    const equationId = params.get('eq');

    setGeometry((previous) => ({
      ...previous,
      shape:
        shape === 'square' || shape === 'rectangular' || shape === 'rib' || shape === 'irregular'
          ? shape
          : previous.shape,
      widthM: Number(params.get('w')) || previous.widthM,
      lengthM: Number(params.get('l')) || previous.lengthM,
      heightM: Number(params.get('h')) || previous.heightM,
      openingXM: Number(params.get('cx')) || previous.openingXM,
      openingYM: Number(params.get('cy')) || previous.openingYM,
    }));

    setVerticalStressInput((previous) => ({
      ...previous,
      mode: mode === 'unit-weight' || mode === 'density' ? mode : previous.mode,
      unitWeightKnM3: Number(params.get('gamma')) || previous.unitWeightKnM3,
      densityKgM3: Number(params.get('rho')) || previous.densityKgM3,
      gravityMS2: Number(params.get('g')) || previous.gravityMS2,
      depthM: Number(params.get('z')) || previous.depthM,
    }));

    if (rock === 'coal-soft-rock' || rock === 'hard-rock' || rock === 'custom') {
      setRockWorkflow(rock);
    }

    if (
      equationId &&
      pillarStrengthEquations.some((equation) => equation.id === equationId)
    ) {
      setSelectedEquationId(equationId);
    }

    const nextInputs = { ...initialEquationInputs };
    Object.keys(initialEquationInputs).forEach((key) => {
      const value = params.get(`i_${key}`);
      if (value !== null && Number.isFinite(Number(value))) {
        nextInputs[key] = Number(value);
      }
    });
    setEquationInputs(nextInputs);
    setUseSeparateOpenings(params.get('sep') === '1');
    setUseManualKappa(params.get('manualKappa') === '1');

    const compare = params.get('compare');
    if (compare) {
      const ids = compare
        .split(',')
        .filter((id) =>
          pillarStrengthEquations.some((equation) => equation.id === id)
        );
      if (ids.length > 0) setComparisonEquationIds(ids);
    }

    setHasLoadedUrlState(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedUrlState || typeof window === 'undefined') return;

    const params = new URLSearchParams();
    params.set('shape', geometry.shape);
    params.set('w', String(geometry.widthM));
    params.set('l', String(geometry.lengthM));
    params.set('h', String(geometry.heightM));
    params.set('cx', String(geometry.openingXM));
    params.set('cy', String(geometry.openingYM));
    params.set('sep', useSeparateOpenings ? '1' : '0');
    params.set('vsMode', verticalStressInput.mode);
    params.set('gamma', String(verticalStressInput.unitWeightKnM3));
    params.set('rho', String(verticalStressInput.densityKgM3));
    params.set('g', String(verticalStressInput.gravityMS2));
    params.set('z', String(verticalStressInput.depthM));
    params.set('rock', rockWorkflow);
    params.set('eq', selectedEquationId);
    params.set('manualKappa', useManualKappa ? '1' : '0');
    if (comparisonEquationIds.length > 0) {
      params.set('compare', comparisonEquationIds.join(','));
    }

    Object.entries(equationInputs).forEach(([key, value]) => {
      if (Number.isFinite(value)) params.set(`i_${key}`, String(value));
    });

    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }, [
    comparisonEquationIds,
    equationInputs,
    geometry,
    hasLoadedUrlState,
    rockWorkflow,
    selectedEquationId,
    useManualKappa,
    useSeparateOpenings,
    verticalStressInput,
  ]);

  useEffect(() => {
    if (filteredEquations.length === 0) return;
    if (!filteredEquations.some((equation) => equation.id === selectedEquationId)) {
      setSelectedEquationId(filteredEquations[0].id);
    }
  }, [filteredEquations, selectedEquationId]);

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

  const lunderConfinement = useMemo(
    () => calculateLunderPakalnisConfinement(geometry.widthM, geometry.heightM),
    [geometry.heightM, geometry.widthM]
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

    const contextInputs = { ...equationInputs };
    if (selectedEquation.id === 'lunder-pakalnis-1997' && !useManualKappa) {
      delete contextInputs.kappa;
    }

    return calculator({
      widthM: geometry.widthM,
      lengthM: geometry.lengthM,
      heightM: geometry.heightM,
      widthToHeightRatio,
      equationInputs: contextInputs,
    });
  }, [
    equationInputs,
    geometry,
    selectedEquation,
    useManualKappa,
    widthToHeightRatio,
  ]);

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
  const applicabilityWarnings = getEquationApplicabilityWarnings(
    widthToHeightRatio,
    selectedEquation.id
  );

  const allWarnings = [
    ...verticalStress.warnings,
    ...tributaryStress.warnings,
    ...extractionRatio.warnings,
    ...equationResult.warnings,
    ...applicabilityWarnings,
    ...(selectedEquation.id === 'lunder-pakalnis-1997' && !useManualKappa
      ? lunderConfinement.warnings
      : []),
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
    ...(selectedEquation.id === 'lunder-pakalnis-1997'
      ? {
          'Lunder-Pakalnis Cpav': formatNumber(lunderConfinement.cpav, 3),
          'Lunder-Pakalnis kappa': formatNumber(
            useManualKappa ? equationInputs.kappa : lunderConfinement.kappa,
            3
          ),
        }
      : {}),
    'Warnings / notes': allWarnings.join(' | ') || 'None',
  };

  const calculateEquationStrength = (
    equationId: string,
    scenarioGeometry: GeometryInput = geometry,
    scenarioEquationInputs: Record<string, number> = equationInputs
  ) => {
    const equation = pillarStrengthEquations.find((item) => item.id === equationId);
    if (!equation || equation.status !== 'implemented' || !equation.calculatorId) {
      return { strengthMpa: null, warnings: [] };
    }

    const calculator = equationCalculators[equation.calculatorId];
    if (!calculator) return { strengthMpa: null, warnings: [] };

    const scenarioInputs = { ...scenarioEquationInputs };
    if (equation.id === 'lunder-pakalnis-1997' && !useManualKappa) {
      delete scenarioInputs.kappa;
    }

    return calculator({
      widthM: scenarioGeometry.widthM,
      lengthM: scenarioGeometry.lengthM,
      heightM: scenarioGeometry.heightM,
      widthToHeightRatio: calculateWidthToHeightRatio(
        scenarioGeometry.widthM,
        scenarioGeometry.heightM
      ),
      equationInputs: scenarioInputs,
    });
  };

  const comparisonRows = useMemo(
    () =>
      comparisonEquationIds
        .map((equationId) => {
          const equation = pillarStrengthEquations.find((item) => item.id === equationId);
          if (!equation) return null;
          const strength = calculateEquationStrength(equation.id);
          const fs = calculateFactorOfSafety(
            strength.strengthMpa,
            tributaryStress.pillarStressMpa
          );
          return { equation, strengthMpa: strength.strengthMpa, fs: fs.factorOfSafety };
        })
        .filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      comparisonEquationIds,
      equationInputs,
      geometry,
      tributaryStress.pillarStressMpa,
      useManualKappa,
    ]
  );

  const sensitivityRows = useMemo(() => {
    const widthFactors = [0.8, 0.9, 1, 1.1, 1.2];
    return widthFactors.map((factor) => {
      const scenarioGeometry = {
        ...geometry,
        widthM: Number((geometry.widthM * factor).toFixed(3)),
        lengthM:
          geometry.shape === 'square'
            ? Number((geometry.widthM * factor).toFixed(3))
            : geometry.lengthM,
      };
      const scenarioStress = calculateTributaryAreaStress(
        scenarioGeometry,
        verticalStress.stressMpa
      );
      const scenarioExtraction = calculateExtractionRatio(scenarioGeometry);
      const scenarioStrength = calculateEquationStrength(
        selectedEquation.id,
        scenarioGeometry
      );
      const scenarioFs = calculateFactorOfSafety(
        scenarioStrength.strengthMpa,
        scenarioStress.pillarStressMpa
      );

      return {
        label: `${Math.round((factor - 1) * 100)}%`,
        widthM: scenarioGeometry.widthM,
        pillarStressMpa: scenarioStress.pillarStressMpa,
        extractionRatioPercent: scenarioExtraction.extractionRatioPercent,
        strengthMpa: scenarioStrength.strengthMpa,
        fs: scenarioFs.factorOfSafety,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    equationInputs,
    geometry,
    selectedEquation.id,
    useManualKappa,
    verticalStress.stressMpa,
  ]);

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

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('Shareable calculator link copied to clipboard.');
    } catch {
      setCopyStatus('Clipboard unavailable. Copy the browser URL manually.');
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { downloadPillarStrengthPDF, generatePillarStrengthPDF } = await import(
        '@/components/pillarStrength/PillarStrengthPDF'
      );
      const blob = await generatePillarStrengthPDF(
        summary,
        allWarnings,
        [
          selectedEquation.formulaText,
          ...selectedEquation.assumptions,
          ...selectedEquation.limitations,
        ]
      );
      const timestamp = new Date().toISOString().split('T')[0];
      downloadPillarStrengthPDF(blob, `pillar-strength-report-${timestamp}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const moveToNextStep = (currentStep: StepId) => {
    const currentIndex = orderedSteps.indexOf(currentStep);
    const nextStep = orderedSteps[currentIndex + 1];
    if (nextStep) setActiveStep(nextStep);
  };

  const extractionTone =
    (extractionRatio.extractionRatioPercent ?? 0) > 80
      ? 'danger'
      : (extractionRatio.extractionRatioPercent ?? 0) > 75
        ? 'warning'
        : 'neutral';

  const strengthTone = selectedEquation.status === 'implemented' ? 'success' : 'warning';

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
          Work through one calculation stage at a time. The live summary stays visible
          while advanced comparisons, exports, and reference notes stay collapsed until
          needed.
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

      <div className="mb-6 rounded-lg border border-mining-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-mining-900">Guided workflow</h2>
            <p className="mt-1 text-sm text-mining-600">
              Open a step, make the decision, then continue. Closed steps keep a short
              summary so the page stays readable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {orderedSteps.map((step, index) => (
              <button
                key={`step-nav-${step}`}
                type="button"
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium',
                  activeStep === step
                    ? 'border-mining-700 bg-mining-700 text-white'
                    : 'border-mining-200 bg-mining-50 text-mining-700'
                )}
                onClick={() => setActiveStep(step)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <main className="space-y-4 lg:col-span-8">
          <FocusSection
            step="geometry"
            stepNumber={1}
            title="Geometry"
            description="Define the pillar and surrounding openings."
            activeStep={activeStep}
            onActivate={setActiveStep}
            onNext={() => moveToNextStep('geometry')}
            summary={
              <CompactSummary
                items={[
                  { label: 'Shape', value: geometry.shape },
                  {
                    label: 'Dimensions',
                    value: `${formatNumber(geometry.widthM, 1)} x ${formatNumber(
                      geometry.lengthM,
                      1
                    )} x ${formatNumber(geometry.heightM, 1)} m`,
                  },
                  { label: 'W/H', value: formatNumber(widthToHeightRatio, 2) },
                  { label: 'Shape class', value: shapeClass },
                ]}
              />
            }
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
              <Metric
                label="Width-to-height ratio"
                value={`${formatNumber(widthToHeightRatio, 2)} (${shapeClass})`}
              />
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

            <div className="mt-5">
              <PillarGeometryDiagram geometry={geometry} />
            </div>
          </FocusSection>

          <FocusSection
            step="overburden"
            stepNumber={2}
            title="Overburden Stress"
            description="Estimate average geostatic vertical stress."
            activeStep={activeStep}
            onActivate={setActiveStep}
            onNext={() => moveToNextStep('overburden')}
            summary={
              <CompactSummary
                items={[
                  { label: 'Mode', value: verticalStressInput.mode },
                  { label: 'Depth', value: `${formatNumber(verticalStressInput.depthM, 0)} m` },
                  {
                    label: 'Vertical stress',
                    value: `${formatNumber(verticalStress.stressMpa, 2)} MPa`,
                  },
                  { label: 'Formula', value: verticalStress.formula },
                ]}
              />
            }
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
          </FocusSection>

          <FocusSection
            step="stress"
            stepNumber={3}
            title="Pillar Stress and Extraction"
            description="Calculate tributary-area stress and recovery."
            activeStep={activeStep}
            onActivate={setActiveStep}
            onNext={() => moveToNextStep('stress')}
            summary={
              <CompactSummary
                items={[
                  {
                    label: 'Pillar stress',
                    value: `${formatNumber(tributaryStress.pillarStressMpa, 2)} MPa`,
                  },
                  {
                    label: 'Extraction',
                    value: formatPercent(extractionRatio.extractionRatioPercent),
                    tone: extractionTone,
                  },
                  {
                    label: 'Pillar area',
                    value: `${formatNumber(tributaryStress.pillarAreaM2, 2)} m2`,
                  },
                  {
                    label: 'Tributary area',
                    value: `${formatNumber(tributaryStress.tributaryAreaM2, 2)} m2`,
                  },
                ]}
              />
            }
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
                tone={extractionTone}
              />
            </div>
            <div className="mt-4 rounded-lg border border-mining-200 bg-mining-50 p-4 text-sm text-mining-600">
              <p>
                Stress formula: <span className="font-medium">{tributaryStress.formula}</span>
              </p>
              <p className="mt-2">
                Extraction formula:{' '}
                <span className="font-medium">{extractionRatio.formula}</span>
              </p>
              <p className="mt-2">
                Stress increases rapidly as extraction ratio rises. A 75% extraction
                ratio is a broad practical reference point, not a universal safe limit.
              </p>
            </div>
          </FocusSection>

          <FocusSection
            step="strength"
            stepNumber={4}
            title="Strength Equation"
            description="Choose the empirical equation and enter only the inputs it needs."
            activeStep={activeStep}
            onActivate={setActiveStep}
            onNext={() => moveToNextStep('strength')}
            summary={
              <CompactSummary
                items={[
                  {
                    label: 'Equation',
                    value: `${selectedEquation.name}${
                      selectedEquation.year ? ` (${selectedEquation.year})` : ''
                    }`,
                  },
                  {
                    label: 'Status',
                    value: getStatusLabel(selectedEquation.status),
                    tone: strengthTone,
                  },
                  {
                    label: 'Strength',
                    value: `${formatNumber(equationResult.strengthMpa, 2)} MPa`,
                    tone: strengthTone,
                  },
                  {
                    label: 'Rock context',
                    value: getRockCategoryLabel(selectedEquation.rockCategory),
                  },
                ]}
              />
            }
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
                  Used for context warnings. You can still choose any equation.
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
                  {filteredEquations.map((equation) => (
                    <option key={equation.id} value={equation.id}>
                      {equation.name}
                      {equation.year ? ` (${equation.year})` : ''} -{' '}
                      {getStatusLabel(equation.status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <details className="mt-4 rounded-lg border border-mining-200 bg-white">
              <summary className="cursor-pointer p-3 text-sm font-medium text-mining-700">
                Filter equation catalog
              </summary>
              <div className="grid gap-4 border-t border-mining-100 p-4 md:grid-cols-2">
                <div>
                  <label htmlFor="category-filter" className="label">
                    Category
                  </label>
                  <select
                    id="category-filter"
                    className="select"
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value as EquationCategoryFilter)
                    }
                  >
                    <option value="all">All categories</option>
                    <option value="coal-soft-rock">Coal / soft rock</option>
                    <option value="hard-rock">Hard rock</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status-filter" className="label">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    className="select"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as EquationStatusFilter)
                    }
                  >
                    <option value="all">All statuses</option>
                    <option value="implemented">Implemented only</option>
                    <option value="partial">Partial only</option>
                    <option value="placeholder">Placeholder only</option>
                  </select>
                </div>
              </div>
            </details>

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

            {selectedEquation.id === 'lunder-pakalnis-1997' && (
              <div className="mt-5 rounded-lg border border-mining-200 bg-mining-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-mining-900">
                      Lunder-Pakalnis confinement term
                    </h4>
                    <p className="mt-1 text-sm text-mining-600">
                      {lunderConfinement.formula}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-mining-700">
                    <input
                      type="checkbox"
                      checked={useManualKappa}
                      onChange={(event) => setUseManualKappa(event.target.checked)}
                    />
                    Manual kappa override
                  </label>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Metric label="Cpav" value={formatNumber(lunderConfinement.cpav, 3)} />
                  <Metric
                    label="Calculated kappa"
                    value={formatNumber(lunderConfinement.kappa, 3)}
                  />
                  {useManualKappa ? (
                    <NumericField
                      id="manual-kappa"
                      label="Manual kappa"
                      value={equationInputs.kappa}
                      min={0}
                      step={0.01}
                      onChange={(value) =>
                        setEquationInputs((previous) => ({
                          ...previous,
                          kappa: value,
                        }))
                      }
                    />
                  ) : (
                    <Metric
                      label="Used kappa"
                      value={formatNumber(lunderConfinement.kappa, 3)}
                      tone="success"
                    />
                  )}
                </div>
              </div>
            )}

            <details className="mt-5 rounded-lg border border-mining-200 bg-white">
              <summary className="cursor-pointer p-3 text-sm font-medium text-mining-700">
                Show variables, assumptions, and limitations
              </summary>
              <div className="grid gap-4 border-t border-mining-100 p-4 md:grid-cols-2">
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
            </details>
          </FocusSection>

          <FocusSection
            step="results"
            stepNumber={5}
            title="Results"
            description="Review the screening result and copy the main output."
            activeStep={activeStep}
            onActivate={setActiveStep}
            summary={
              <CompactSummary
                items={[
                  {
                    label: 'FS',
                    value: formatNumber(factorOfSafety.factorOfSafety, 2),
                    tone: getFsTone(factorOfSafety.label),
                  },
                  {
                    label: 'Strength',
                    value: `${formatNumber(equationResult.strengthMpa, 2)} MPa`,
                    tone: strengthTone,
                  },
                  {
                    label: 'Stress',
                    value: `${formatNumber(tributaryStress.pillarStressMpa, 2)} MPa`,
                  },
                  { label: 'Warnings', value: String(allWarnings.length) },
                ]}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Pillar strength"
                value={`${formatNumber(equationResult.strengthMpa, 2)} MPa`}
                tone={strengthTone}
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
                tone={extractionTone}
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

            <div className="mt-4">
              <WarningList warnings={allWarnings} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="btn-primary gap-2"
                onClick={handleCopyResults}
              >
                <Clipboard className="h-4 w-4" />
                Copy Results
              </button>
              <button
                type="button"
                className="btn-outline gap-2"
                onClick={handleCopyShareLink}
              >
                <LinkIcon className="h-4 w-4" />
                Copy Share Link
              </button>
            </div>
            {copyStatus && <p className="mt-3 text-sm text-mining-600">{copyStatus}</p>}
          </FocusSection>

          <AdvancedPanel
            title="Advanced Analysis"
            description="Equation comparison and width sensitivity are available when needed."
          >
            <div className="rounded-lg border border-mining-200 p-4">
              <h4 className="font-semibold text-mining-900">Compare equations</h4>
              <p className="mt-1 text-sm text-mining-600">
                Select implemented equations to compare with the same geometry,
                overburden, and equation input values.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {pillarStrengthEquations
                  .filter((equation) => equation.status === 'implemented')
                  .map((equation) => (
                    <label
                      key={`compare-${equation.id}`}
                      className="flex items-center gap-2 text-sm text-mining-700"
                    >
                      <input
                        type="checkbox"
                        checked={comparisonEquationIds.includes(equation.id)}
                        onChange={(event) => {
                          setComparisonEquationIds((previous) =>
                            event.target.checked
                              ? previous.includes(equation.id)
                                ? previous
                                : [...previous, equation.id]
                              : previous.filter((id) => id !== equation.id)
                          );
                        }}
                      />
                      {equation.name}
                      {equation.year ? ` (${equation.year})` : ''}
                    </label>
                  ))}
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-mining-200 p-4">
              <h4 className="font-semibold text-mining-900">Equation comparison</h4>
              {comparisonRows.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-mining-200 text-mining-600">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Equation</th>
                        <th className="py-2 pr-3 font-medium">Strength</th>
                        <th className="py-2 pr-3 font-medium">FS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) =>
                        row ? (
                          <tr
                            key={`compare-row-${row.equation.id}`}
                            className="border-b border-mining-100 last:border-0"
                          >
                            <td className="py-2 pr-3 text-mining-700">
                              {row.equation.name}
                            </td>
                            <td className="py-2 pr-3 text-mining-700">
                              {formatNumber(row.strengthMpa, 2)} MPa
                            </td>
                            <td className="py-2 pr-3 text-mining-700">
                              {formatNumber(row.fs, 2)}
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-mining-600">
                  Select implemented equations above to compare them.
                </p>
              )}
            </div>

            <div className="mt-5 rounded-lg border border-mining-200 p-4">
              <h4 className="font-semibold text-mining-900">Width sensitivity</h4>
              <p className="mt-1 text-sm text-mining-600">
                Screens how pillar width changes affect stress, recovery, strength, and
                FS while other inputs stay fixed.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-mining-200 text-mining-600">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Width change</th>
                      <th className="py-2 pr-3 font-medium">Width (m)</th>
                      <th className="py-2 pr-3 font-medium">Stress (MPa)</th>
                      <th className="py-2 pr-3 font-medium">Extraction</th>
                      <th className="py-2 pr-3 font-medium">Strength (MPa)</th>
                      <th className="py-2 pr-3 font-medium">FS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityRows.map((row) => (
                      <tr
                        key={`sensitivity-${row.label}`}
                        className="border-b border-mining-100 last:border-0"
                      >
                        <td className="py-2 pr-3 font-medium text-mining-900">
                          {row.label}
                        </td>
                        <td className="py-2 pr-3 text-mining-700">
                          {formatNumber(row.widthM, 2)}
                        </td>
                        <td className="py-2 pr-3 text-mining-700">
                          {formatNumber(row.pillarStressMpa, 2)}
                        </td>
                        <td className="py-2 pr-3 text-mining-700">
                          {formatPercent(row.extractionRatioPercent)}
                        </td>
                        <td className="py-2 pr-3 text-mining-700">
                          {formatNumber(row.strengthMpa, 2)}
                        </td>
                        <td className="py-2 pr-3 text-mining-700">
                          {formatNumber(row.fs, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AdvancedPanel>

          <AdvancedPanel
            title="Assumptions and Limitations"
            description="Reference notes are kept separate from the main calculation flow."
          >
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
                <li>
                  Equal load sharing may not be valid near abutments, faults, or excavated
                  edges.
                </li>
                <li>Empirical equations are calibration-dependent.</li>
                <li>
                  Geology, joints, scale effects, blasting damage, time effects, and
                  irregular geometry matter.
                </li>
                <li>Rib and irregular pillars need additional geometry and stress logic.</li>
              </ul>
            </div>
          </AdvancedPanel>

          <AdvancedPanel
            title="Full Summary and Exports"
            description="Detailed values and report export tools."
          >
            <div className="grid gap-3 sm:grid-cols-3">
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
              <button
                type="button"
                className="btn-outline gap-2"
                disabled={isExportingPdf}
                onClick={handleExportPdf}
              >
                <FileText className="h-4 w-4" />
                {isExportingPdf ? 'Generating PDF...' : 'Export PDF'}
              </button>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
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
          </AdvancedPanel>
        </main>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <Section title="Live Summary">
              <div className="space-y-3">
                <Metric
                  label="Factor of safety"
                  value={formatNumber(factorOfSafety.factorOfSafety, 2)}
                  tone={getFsTone(factorOfSafety.label)}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Metric
                    label="Strength"
                    value={`${formatNumber(equationResult.strengthMpa, 2)} MPa`}
                    tone={strengthTone}
                  />
                  <Metric
                    label="Stress"
                    value={`${formatNumber(tributaryStress.pillarStressMpa, 2)} MPa`}
                  />
                  <Metric
                    label="Extraction"
                    value={formatPercent(extractionRatio.extractionRatioPercent)}
                    tone={extractionTone}
                  />
                  <Metric
                    label="Vertical stress"
                    value={`${formatNumber(verticalStress.stressMpa, 2)} MPa`}
                  />
                </div>
              </div>
            </Section>

            <Section title="Current Setup">
              <div className="space-y-3 text-sm">
                {orderedSteps.map((step, index) => (
                  <button
                    key={`sidebar-step-${step}`}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border p-2 text-left',
                      activeStep === step
                        ? 'border-mining-600 bg-mining-50 text-mining-900'
                        : 'border-mining-200 text-mining-600'
                    )}
                    onClick={() => setActiveStep(step)}
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-mining-500" />
                    <span className="capitalize">{index + 1}. {step}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm text-mining-600">
                <p>
                  <span className="font-medium text-mining-800">Equation:</span>{' '}
                  {selectedEquation.name}
                </p>
                <p>
                  <span className="font-medium text-mining-800">Status:</span>{' '}
                  {getStatusLabel(selectedEquation.status)}
                </p>
                <p>
                  <span className="font-medium text-mining-800">Warnings:</span>{' '}
                  {allWarnings.length}
                </p>
              </div>
            </Section>

            {allWarnings.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-700" />
                  <div>
                    <p className="font-medium text-yellow-900">Active notes</p>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                      {allWarnings.slice(0, 2).map((warning) => (
                        <li key={`sidebar-${warning}`}>{warning}</li>
                      ))}
                    </ul>
                    {allWarnings.length > 2 && (
                      <p className="mt-2 text-sm text-yellow-800">
                        {allWarnings.length - 2} more notes in Results.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
