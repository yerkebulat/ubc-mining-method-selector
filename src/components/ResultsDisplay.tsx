'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Trophy, Ban } from 'lucide-react';
import type { ScoringResult, MethodResult } from '@/types';
import { cn, getScoreColor, getRankColor } from '@/lib/utils';
import { getConfig } from '@/lib/scoring-engine';

interface ResultsDisplayProps {
  results: ScoringResult;
  onExportPDF: () => void;
  onViewWeights: () => void;
}

const config = getConfig();

function MethodCard({
  result,
  rank,
  expanded,
  onToggle,
}: {
  result: MethodResult;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'card transition-all',
        result.isEliminated && 'opacity-60 bg-red-50/50',
        !result.isEliminated && rank <= 3 && 'ring-2 ring-mining-300'
      )}
    >
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {!result.isEliminated ? (
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                getRankColor(rank)
              )}
            >
              {rank}
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Ban className="h-4 w-4" />
            </span>
          )}
          <div>
            <h3 className="font-semibold text-mining-900">{result.method}</h3>
            {result.isEliminated && (
              <p className="text-xs text-red-600">Eliminated</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-mining-900">{result.totalScore}</p>
            <p className="text-xs text-mining-500">Total Score</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-mining-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-mining-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-mining-100 pt-4 animate-fade-in">
          {result.isEliminated && result.eliminationReasons.length > 0 && (
            <div className="mb-4 rounded-lg bg-red-50 p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Elimination Reasons:</span>
              </div>
              <ul className="mt-2 list-inside list-disc text-sm text-red-600">
                {result.eliminationReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(result.categoryScores).map(([category, categoryScore]) => {
              const categoryConfig = config.categories[category];
              return (
                <div key={category} className="rounded-lg bg-mining-50 p-3">
                  <h4 className="mb-2 text-sm font-medium text-mining-700">
                    {categoryConfig?.label || category}
                  </h4>
                  <p className="mb-2 text-lg font-bold text-mining-900">
                    {categoryScore.score}
                  </p>
                  <div className="space-y-1">
                    {Object.entries(categoryScore.breakdown).map(
                      ([factor, details]) => {
                        const factorConfig = config.factors[factor];
                        return (
                          <div
                            key={factor}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-mining-600 truncate pr-2">
                              {factorConfig?.label || factor}:
                            </span>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 font-medium',
                                getScoreColor(details.score)
                              )}
                            >
                              {details.score}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultsDisplay({
  results,
  onExportPDF,
  onViewWeights,
}: ResultsDisplayProps) {
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());
  const [topN, setTopN] = useState(3);

  const toggleMethod = (method: string) => {
    const newExpanded = new Set(expandedMethods);
    if (newExpanded.has(method)) {
      newExpanded.delete(method);
    } else {
      newExpanded.add(method);
    }
    setExpandedMethods(newExpanded);
  };

  const displayedMethods = showAllMethods
    ? results.rankedMethods
    : results.recommendedMethods.slice(0, topN);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Header */}
      <div className="card bg-gradient-to-br from-mining-700 to-mining-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Results Summary</h2>
            <p className="mt-1 text-mining-200">
              {results.recommendedMethods.length} recommended methods,{' '}
              {results.eliminatedMethods.length} eliminated
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onViewWeights}
              className="btn bg-white/10 text-white hover:bg-white/20"
            >
              View Weights
            </button>
            <button
              onClick={onExportPDF}
              className="btn bg-white text-mining-900 hover:bg-mining-50"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Top Recommended */}
      {results.recommendedMethods.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-mining-900">
                Top Recommended Methods
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-mining-600">Show top:</label>
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="select w-20"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>All</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {displayedMethods.map((result, idx) => (
              <MethodCard
                key={result.method}
                result={result}
                rank={idx + 1}
                expanded={expandedMethods.has(result.method)}
                onToggle={() => toggleMethod(result.method)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toggle to show all methods including eliminated */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAllMethods(!showAllMethods)}
          className="btn-outline"
        >
          {showAllMethods
            ? 'Hide Eliminated Methods'
            : `Show All Methods (${results.eliminatedMethods.length} eliminated)`}
        </button>
      </div>

      {/* Eliminated Methods */}
      {showAllMethods && results.eliminatedMethods.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-mining-900">
              Eliminated Methods
            </h3>
          </div>
          <div className="space-y-3">
            {results.eliminatedMethods.map((result) => (
              <MethodCard
                key={result.method}
                result={result}
                rank={-1}
                expanded={expandedMethods.has(result.method)}
                onToggle={() => toggleMethod(result.method)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Summary */}
      <div className="card">
        <h3 className="mb-4 font-semibold text-mining-900">Input Summary</h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(results.inputs).map(([key, value]) => {
            const factor = config.factors[key];
            return (
              <div key={key} className="flex justify-between rounded bg-mining-50 px-3 py-2">
                <span className="text-mining-600">{factor?.label || key}:</span>
                <span className="font-medium text-mining-900">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
