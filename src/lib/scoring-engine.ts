import type {
  Config,
  InputValues,
  MethodResult,
  CategoryScore,
  ScoringResult,
  FactorCategory,
} from '@/types';
import configData from '../../data/method-selector-config.json';

const config = configData as Config;

/**
 * Get the weight for a specific method, factor, and option
 */
export function getWeight(
  method: string,
  factor: string,
  option: string
): number {
  const methodWeights = config.weights[method];
  if (!methodWeights) return 0;

  const factorWeights = methodWeights[factor];
  if (!factorWeights) return 0;

  const weight = factorWeights[option];
  return typeof weight === 'number' ? weight : 0;
}

/**
 * Check if a weight value indicates elimination
 */
export function isEliminatingWeight(weight: number): boolean {
  return weight <= config.elimination_threshold;
}

/**
 * Calculate the score for a single category
 */
export function calculateCategoryScore(
  method: string,
  category: FactorCategory,
  inputs: InputValues
): CategoryScore {
  const categoryConfig = config.categories[category];
  const breakdown: CategoryScore['breakdown'] = {};
  let totalScore = 0;

  for (const factor of categoryConfig.factors) {
    const option = inputs[factor as keyof InputValues];
    if (!option) continue;

    const score = getWeight(method, factor, option);
    breakdown[factor] = {
      option,
      score,
    };
    totalScore += score;
  }

  return {
    score: totalScore,
    breakdown,
  };
}

/**
 * Calculate full results for a single method
 */
export function calculateMethodResult(
  method: string,
  inputs: InputValues
): MethodResult {
  const categoryScores = {
    geometry: calculateCategoryScore(method, 'geometry', inputs),
    ore_zone: calculateCategoryScore(method, 'ore_zone', inputs),
    hanging_wall: calculateCategoryScore(method, 'hanging_wall', inputs),
    footwall: calculateCategoryScore(method, 'footwall', inputs),
  };

  // Calculate total score
  const totalScore =
    categoryScores.geometry.score +
    categoryScores.ore_zone.score +
    categoryScores.hanging_wall.score +
    categoryScores.footwall.score;

  // Check for elimination
  const eliminationReasons: string[] = [];
  let isEliminated = false;

  // Check each factor for elimination weights
  for (const [, categoryScore] of Object.entries(categoryScores)) {
    for (const [factor, details] of Object.entries(categoryScore.breakdown)) {
      if (isEliminatingWeight(details.score)) {
        isEliminated = true;
        const factorConfig = config.factors[factor];
        eliminationReasons.push(
          `${factorConfig.label}: ${details.option} (score: ${details.score})`
        );
      }
    }
  }

  return {
    method,
    totalScore,
    isEliminated,
    eliminationReasons,
    categoryScores,
  };
}

/**
 * Main scoring function - calculates results for all methods
 */
export function calculateScores(inputs: InputValues): ScoringResult {
  const results: MethodResult[] = [];

  for (const method of config.methods) {
    const result = calculateMethodResult(method, inputs);
    results.push(result);
  }

  // Sort by total score (highest first)
  const rankedMethods = [...results].sort((a, b) => b.totalScore - a.totalScore);

  // Separate recommended and eliminated methods
  const recommendedMethods = rankedMethods.filter((m) => !m.isEliminated);
  const eliminatedMethods = rankedMethods.filter((m) => m.isEliminated);

  return {
    results,
    rankedMethods,
    recommendedMethods,
    eliminatedMethods,
    inputs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get the configuration
 */
export function getConfig(): Config {
  return config;
}

/**
 * Get all methods
 */
export function getMethods(): string[] {
  return config.methods;
}

/**
 * Get all factors
 */
export function getFactors(): Config['factors'] {
  return config.factors;
}

/**
 * Get all categories
 */
export function getCategories(): Config['categories'] {
  return config.categories;
}

/**
 * Get weights for display
 */
export function getWeightsTable(): {
  methods: string[];
  factors: { key: string; label: string; options: string[] }[];
  weights: { [method: string]: { [factor: string]: { [option: string]: number } } };
} {
  const factors = Object.entries(config.factors).map(([key, factor]) => ({
    key,
    label: factor.label,
    options: factor.options,
  }));

  return {
    methods: config.methods,
    factors,
    weights: config.weights,
  };
}

/**
 * Validate inputs
 */
export function validateInputs(inputs: Partial<InputValues>): {
  isValid: boolean;
  errors: { [key: string]: string };
} {
  const errors: { [key: string]: string } = {};
  const requiredFactors = Object.keys(config.factors);

  for (const factor of requiredFactors) {
    const value = inputs[factor as keyof InputValues];
    if (!value) {
      errors[factor] = `${config.factors[factor].label} is required`;
    } else {
      const validOptions = config.factors[factor].options;
      if (!validOptions.includes(value)) {
        errors[factor] = `Invalid option for ${config.factors[factor].label}`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
