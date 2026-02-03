export type FactorCategory = 'geometry' | 'ore_zone' | 'hanging_wall' | 'footwall';

export interface FactorConfig {
  label: string;
  options: string[];
  category: FactorCategory;
  tooltip: string;
}

export interface CategoryConfig {
  label: string;
  factors: string[];
}

export interface MethodWeights {
  [factor: string]: {
    [option: string]: number;
  };
}

export interface Config {
  version: string;
  source: {
    excel_file: string;
    excel_version: string;
    reference_paper: string;
    algorithm_source: string;
  };
  elimination_threshold: number;
  methods: string[];
  factors: {
    [key: string]: FactorConfig;
  };
  categories: {
    [key: string]: CategoryConfig;
  };
  weights: {
    [method: string]: MethodWeights;
  };
}

export interface InputValues {
  shape: string;
  thickness: string;
  plunge: string;
  grade: string;
  depth: string;
  rmr_ore: string;
  rss_ore: string;
  rmr_hw: string;
  rss_hw: string;
  rmr_fw: string;
  rss_fw: string;
}

export interface CategoryScore {
  score: number;
  breakdown: {
    [factor: string]: {
      option: string;
      score: number;
    };
  };
}

export interface MethodResult {
  method: string;
  totalScore: number;
  isEliminated: boolean;
  eliminationReasons: string[];
  categoryScores: {
    geometry: CategoryScore;
    ore_zone: CategoryScore;
    hanging_wall: CategoryScore;
    footwall: CategoryScore;
  };
}

export interface ScoringResult {
  results: MethodResult[];
  rankedMethods: MethodResult[];
  recommendedMethods: MethodResult[];
  eliminatedMethods: MethodResult[];
  inputs: InputValues;
  timestamp: string;
}
