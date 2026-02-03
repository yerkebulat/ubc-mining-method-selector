'use client';

import { useState } from 'react';
import { X, Book, AlertCircle } from 'lucide-react';
import { getConfig, getWeightsTable } from '@/lib/scoring-engine';
import { cn, getScoreColor } from '@/lib/utils';

interface WeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const config = getConfig();

export function WeightsModal({ isOpen, onClose }: WeightsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('geometry');
  const weightsData = getWeightsTable();

  if (!isOpen) return null;

  const categoryFactors = weightsData.factors.filter((f) => {
    const factorConfig = config.factors[f.key];
    return factorConfig?.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-mining-200 bg-mining-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-mining-900">
              Scoring Weights Matrix
            </h2>
            <p className="mt-1 text-sm text-mining-600">
              Read-only view of the scoring weights used in calculations
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-mining-400 hover:bg-mining-100 hover:text-mining-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Source Attribution */}
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Book className="mt-0.5 h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Source Attribution</p>
                <p className="mt-1 text-blue-700">
                  Weights extracted from: {config.source.excel_file} (
                  {config.source.excel_version})
                </p>
                <p className="text-blue-700">
                  Based on: {config.source.reference_paper}
                </p>
                <p className="text-blue-700">
                  Algorithm: {config.source.algorithm_source}
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-6 rounded-lg bg-mining-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-mining-600" />
              <div className="text-sm">
                <p className="font-medium text-mining-900">Score Legend</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                    4-6: Preferred
                  </span>
                  <span className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                    3-4: Probable
                  </span>
                  <span className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-600">
                    1-2: Possible
                  </span>
                  <span className="rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                    0: Unlikely
                  </span>
                  <span className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                    -49: Eliminated
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(config.categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  selectedCategory === key
                    ? 'bg-mining-700 text-white'
                    : 'bg-mining-100 text-mining-700 hover:bg-mining-200'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Weights Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-mining-100">
                  <th className="sticky left-0 z-10 bg-mining-100 px-3 py-2 text-left font-semibold text-mining-900">
                    Method
                  </th>
                  {categoryFactors.map((factor) =>
                    factor.options.map((option) => (
                      <th
                        key={`${factor.key}-${option}`}
                        className="px-2 py-2 text-center font-medium text-mining-700"
                      >
                        <div className="text-xs">{factor.label}</div>
                        <div className="text-xs text-mining-500">{option}</div>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {weightsData.methods.map((method, idx) => (
                  <tr
                    key={method}
                    className={cn(
                      'border-b border-mining-100',
                      idx % 2 === 0 ? 'bg-white' : 'bg-mining-50/50'
                    )}
                  >
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-3 py-2 font-medium text-mining-900">
                      {method}
                    </td>
                    {categoryFactors.map((factor) =>
                      factor.options.map((option) => {
                        const weight =
                          weightsData.weights[method]?.[factor.key]?.[option] ?? 0;
                        return (
                          <td
                            key={`${method}-${factor.key}-${option}`}
                            className="px-2 py-2 text-center"
                          >
                            <span
                              className={cn(
                                'inline-block min-w-[2rem] rounded px-2 py-1 text-xs font-bold',
                                getScoreColor(weight)
                              )}
                            >
                              {weight}
                            </span>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-mining-200 bg-mining-50 px-6 py-4">
          <p className="text-center text-xs text-mining-500">
            These weights are read-only and cannot be modified. They are used to
            calculate mining method suitability scores based on your input
            parameters.
          </p>
        </div>
      </div>
    </div>
  );
}
