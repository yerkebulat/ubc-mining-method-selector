'use client';

import { useState, useEffect } from 'react';
import { InputForm, ResultsDisplay, WeightsModal, generatePDF, downloadPDF } from '@/components';
import { calculateScores, getConfig } from '@/lib/scoring-engine';
import { decodeInputsFromURL, encodeInputsToURL } from '@/lib/utils';
import type { InputValues, ScoringResult } from '@/types';
import { Share2, BookOpen, AlertTriangle } from 'lucide-react';

const config = getConfig();

export default function Home() {
  const [results, setResults] = useState<ScoringResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<InputValues>>({});
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Load inputs from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search) {
        const inputs = decodeInputsFromURL(search);
        setDefaultValues(inputs);
      }
    }
  }, []);

  const handleSubmit = async (data: InputValues) => {
    setIsCalculating(true);
    setShareUrl(null);

    // Simulate a small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    const scoringResults = calculateScores(data);
    setResults(scoringResults);
    setIsCalculating(false);

    // Update URL with inputs for sharing
    const params = encodeInputsToURL(data);
    const newUrl = `${window.location.pathname}?${params}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleExportPDF = async () => {
    if (!results) return;

    try {
      const blob = await generatePDF(results);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadPDF(blob, `mining-method-report-${timestamp}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    setShareUrl(url);
    navigator.clipboard.writeText(url).then(() => {
      // Clipboard write successful
    }).catch(() => {
      // Fallback: show URL for manual copying
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-mining-900 md:text-4xl">
          Mining Method Selection Tool
        </h1>
        <p className="mt-3 text-lg text-mining-600 max-w-2xl mx-auto">
          A numerical approach to selecting underground mining methods based on
          deposit geometry, grade distribution, and rock mechanics characteristics.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="text-sm">
            <p className="font-medium text-green-900">Important Disclaimer</p>
            <p className="mt-1 text-green-700">
              This tool provides preliminary guidance only. Engineering judgment is
              required, and results should be validated through detailed feasibility
              studies. This is not a substitute for professional engineering analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Form */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-mining-900">
                Input Parameters
              </h2>
              <button
                onClick={() => setShowWeights(true)}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                View Weights
              </button>
            </div>
            <InputForm
              onSubmit={handleSubmit}
              defaultValues={defaultValues}
              isCalculating={isCalculating}
            />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7">
          {results ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-mining-900">Results</h2>
                <button
                  onClick={handleShare}
                  className="btn-outline flex items-center gap-2 text-sm"
                >
                  <Share2 className="h-4 w-4" />
                  Share Results
                </button>
              </div>

              {shareUrl && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm text-green-700">
                    Link copied to clipboard! Share this URL:
                  </p>
                  <p className="mt-1 break-all text-xs text-green-600">{shareUrl}</p>
                </div>
              )}

              <ResultsDisplay
                results={results}
                onExportPDF={handleExportPDF}
                onViewWeights={() => setShowWeights(true)}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-mining-200 bg-mining-50/50 p-12">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mining-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-mining-400"
                  >
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-mining-700">
                  No Results Yet
                </h3>
                <p className="mt-2 text-sm text-mining-500">
                  Fill in the input parameters and click &quot;Calculate Scores&quot;
                  to see the ranked mining methods.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="mt-16 border-t border-mining-200 pt-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-mining-900 text-center">
            About This Tool
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 font-semibold text-mining-900">Methodology</h3>
              <p className="text-sm text-mining-600">
                This tool implements the numerical mining method selection approach
                described by Nicholas (1981). It evaluates 10 underground mining
                methods against deposit characteristics including geometry, grade
                distribution, and rock mechanics properties. Each characteristic
                receives a score from -49 (eliminated) to 6 (highly preferred), and
                methods are ranked by total score.
              </p>
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold text-mining-900">Mining Methods</h3>
              <ul className="grid grid-cols-2 gap-1 text-sm text-mining-600">
                {config.methods.map((method) => (
                  <li key={method} className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-mining-400" />
                    {method}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold text-mining-900">References</h3>
              <ul className="space-y-2 text-sm text-mining-600">
                <li>
                  Nicholas, D.E. (1981). &quot;Method Selection – A Numerical
                  Approach.&quot; Design and Operation of Caving and Sublevel Stoping
                  Mines, Ch. 4, pp. 39-53.
                </li>
                <li>
                  Miller-Tait, L., Pakalnis, R. &amp; Poulin, R. (1995). &quot;UBC
                  Mining Method Selection.&quot; 4th Int&apos;l. Symp. on Mine Planning
                  &amp; Equipment Selection, Calgary.
                </li>
              </ul>
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold text-mining-900">Limitations</h3>
              <p className="text-sm text-mining-600">
                This is a preliminary screening tool. Results should be validated
                through detailed feasibility studies considering site-specific
                factors, economic analysis, environmental constraints, and
                operational requirements. The tool does not account for all possible
                mining methods or combinations thereof.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weights Modal */}
      <WeightsModal isOpen={showWeights} onClose={() => setShowWeights(false)} />
    </div>
  );
}
