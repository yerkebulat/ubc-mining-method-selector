import type { EquationStatus, RockCategory } from './types';

export function formatNumber(
  value: number | null | undefined,
  decimals = 2,
  fallback = 'Unavailable'
): string {
  if (!Number.isFinite(value)) return fallback;
  return Number(value).toFixed(decimals);
}

export function formatPercent(value: number | null | undefined): string {
  if (!Number.isFinite(value)) return 'Unavailable';
  return `${Number(value).toFixed(1)}%`;
}

export function getStatusLabel(status: EquationStatus): string {
  if (status === 'implemented') return 'Implemented';
  if (status === 'partial') return 'Partial';
  return 'Placeholder';
}

export function getRockCategoryLabel(category: RockCategory): string {
  if (category === 'coal-soft-rock') return 'Coal / soft rock';
  if (category === 'hard-rock') return 'Hard rock';
  return 'Custom';
}

export function getMismatchWarning(
  selectedWorkflow: RockCategory,
  equationCategory: RockCategory
): string | null {
  if (selectedWorkflow === 'custom' || equationCategory === 'custom') {
    return null;
  }

  if (selectedWorkflow !== equationCategory) {
    return `The selected equation is categorized as ${getRockCategoryLabel(
      equationCategory
    )}, while the workflow is set to ${getRockCategoryLabel(selectedWorkflow)}.`;
  }

  return null;
}

export function buildResultText(result: Record<string, string | number | null>): string {
  return Object.entries(result)
    .map(([key, value]) => `${key}: ${value ?? 'Unavailable'}`)
    .join('\n');
}

export function buildCsv(result: Record<string, string | number | null>): string {
  const escapeCsv = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  return [
    Object.keys(result).map(escapeCsv).join(','),
    Object.values(result).map(escapeCsv).join(','),
  ].join('\n');
}

export function downloadTextFile(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

