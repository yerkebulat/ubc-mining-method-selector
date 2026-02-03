import {
  calculateScores,
  calculateMethodResult,
  getWeight,
  isEliminatingWeight,
  validateInputs,
  getConfig,
} from '@/lib/scoring-engine';
import type { InputValues } from '@/types';

describe('Scoring Engine', () => {
  describe('getWeight', () => {
    it('should return correct weight for Open Pit with Equidimensional shape', () => {
      expect(getWeight('Open Pit', 'shape', 'Equidimensional')).toBe(4);
    });

    it('should return correct weight for Block Caving with V. Narrow thickness', () => {
      expect(getWeight('Block Caving', 'thickness', 'V. Narrow')).toBe(-49);
    });

    it('should return 0 for non-existent method', () => {
      expect(getWeight('Non-existent Method', 'shape', 'Equidimensional')).toBe(0);
    });

    it('should return 0 for non-existent factor', () => {
      expect(getWeight('Open Pit', 'non_existent', 'value')).toBe(0);
    });
  });

  describe('isEliminatingWeight', () => {
    it('should return true for -49', () => {
      expect(isEliminatingWeight(-49)).toBe(true);
    });

    it('should return true for values less than -49', () => {
      expect(isEliminatingWeight(-50)).toBe(true);
    });

    it('should return false for 0', () => {
      expect(isEliminatingWeight(0)).toBe(false);
    });

    it('should return false for positive values', () => {
      expect(isEliminatingWeight(4)).toBe(false);
    });
  });

  describe('validateInputs', () => {
    it('should return valid for complete inputs', () => {
      const inputs: InputValues = {
        shape: 'Equidimensional',
        thickness: 'Thick',
        plunge: 'Steep',
        grade: 'Moderate',
        depth: '100-600m',
        rmr_ore: 'Moderate',
        rss_ore: 'Moderate',
        rmr_hw: 'Moderate',
        rss_hw: 'Moderate',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const result = validateInputs(inputs);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should return invalid for missing inputs', () => {
      const inputs: Partial<InputValues> = {
        shape: 'Equidimensional',
      };
      const result = validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });

    it('should return invalid for invalid option values', () => {
      const inputs: InputValues = {
        shape: 'InvalidShape',
        thickness: 'Thick',
        plunge: 'Steep',
        grade: 'Moderate',
        depth: '100-600m',
        rmr_ore: 'Moderate',
        rss_ore: 'Moderate',
        rmr_hw: 'Moderate',
        rss_hw: 'Moderate',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const result = validateInputs(inputs);
      expect(result.isValid).toBe(false);
      expect(result.errors.shape).toBeDefined();
    });
  });

  describe('calculateMethodResult', () => {
    const testInputs: InputValues = {
      shape: 'Equidimensional',
      thickness: 'V. Thick',
      plunge: 'Steep',
      grade: 'Moderate',
      depth: '100-600m',
      rmr_ore: 'Moderate',
      rss_ore: 'Moderate',
      rmr_hw: 'Moderate',
      rss_hw: 'Moderate',
      rmr_fw: 'Moderate',
      rss_fw: 'Moderate',
    };

    it('should calculate correct total score for Open Pit', () => {
      const result = calculateMethodResult('Open Pit', testInputs);
      // Shape: 4, Thickness: 4, Plunge: 1, Grade: 3, Depth: 0 = 12 (geometry)
      // RMR Ore: 3, RSS Ore: 3 = 6 (ore zone)
      // RMR HW: 4, RSS HW: 4 = 8 (hanging wall)
      // RMR FW: 4, RSS FW: 4 = 8 (footwall)
      // Total: 12 + 6 + 8 + 8 = 34
      expect(result.categoryScores.geometry.score).toBe(12);
      expect(result.categoryScores.ore_zone.score).toBe(6);
      expect(result.categoryScores.hanging_wall.score).toBe(8);
      expect(result.categoryScores.footwall.score).toBe(8);
      expect(result.totalScore).toBe(34);
      expect(result.isEliminated).toBe(false);
    });

    it('should mark Block Caving as eliminated for V. Strong RMR Ore', () => {
      const eliminatingInputs: InputValues = {
        ...testInputs,
        rmr_ore: 'V. Strong',
      };
      const result = calculateMethodResult('Block Caving', eliminatingInputs);
      expect(result.isEliminated).toBe(true);
      expect(result.eliminationReasons.length).toBeGreaterThan(0);
    });

    it('should mark Longwall as eliminated for Equidimensional shape', () => {
      const result = calculateMethodResult('Longwall', testInputs);
      expect(result.isEliminated).toBe(true);
      expect(result.eliminationReasons.some(r => r.includes('Shape'))).toBe(true);
    });
  });

  describe('calculateScores - Golden Test Cases', () => {
    // Test Case 1: Favorable for Open Pit
    it('should rank Open Pit highest for shallow, large deposit', () => {
      const inputs: InputValues = {
        shape: 'Equidimensional',
        thickness: 'V. Thick',
        plunge: 'Flat',
        grade: 'Moderate',
        depth: '<100m',
        rmr_ore: 'Strong',
        rss_ore: 'Strong',
        rmr_hw: 'Strong',
        rss_hw: 'Strong',
        rmr_fw: 'Strong',
        rss_fw: 'Strong',
      };
      const results = calculateScores(inputs);
      expect(results.recommendedMethods[0].method).toBe('Open Pit');
    });

    // Test Case 2: Favorable for Block Caving
    it('should rank Block Caving highly for deep, weak ore deposit', () => {
      const inputs: InputValues = {
        shape: 'Equidimensional',
        thickness: 'V. Thick',
        plunge: 'Steep',
        grade: 'Low',
        depth: '>600m',
        rmr_ore: 'V. Weak',
        rss_ore: 'V. Weak',
        rmr_hw: 'V. Weak',
        rss_hw: 'V. Weak',
        rmr_fw: 'V. Weak',
        rss_fw: 'V. Weak',
      };
      const results = calculateScores(inputs);
      const blockCaving = results.recommendedMethods.find(
        (m) => m.method === 'Block Caving'
      );
      expect(blockCaving).toBeDefined();
      expect(blockCaving?.isEliminated).toBe(false);
    });

    // Test Case 3: Favorable for Sublevel Stoping
    it('should rank Sublevel Stoping highly for strong ore, tabular deposit', () => {
      const inputs: InputValues = {
        shape: 'Platy/Tabular',
        thickness: 'Thick',
        plunge: 'Steep',
        grade: 'Low',
        depth: '100-600m',
        rmr_ore: 'V. Strong',
        rss_ore: 'Strong',
        rmr_hw: 'V. Strong',
        rss_hw: 'Strong',
        rmr_fw: 'Strong',
        rss_fw: 'Strong',
      };
      const results = calculateScores(inputs);
      const sublevelStoping = results.recommendedMethods.find(
        (m) => m.method === 'Sublevel Stoping'
      );
      expect(sublevelStoping).toBeDefined();
      // Should be in top 3
      const rank = results.recommendedMethods.findIndex(
        (m) => m.method === 'Sublevel Stoping'
      );
      expect(rank).toBeLessThan(3);
    });

    // Test Case 4: Favorable for Cut and Fill
    it('should rank Cut and Fill highly for irregular, high-grade deposit', () => {
      const inputs: InputValues = {
        shape: 'Irregular',
        thickness: 'Narrow',
        plunge: 'Steep',
        grade: 'High',
        depth: '>600m',
        rmr_ore: 'Strong',
        rss_ore: 'Strong',
        rmr_hw: 'Weak',
        rss_hw: 'Weak',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const results = calculateScores(inputs);
      const cutAndFill = results.recommendedMethods.find(
        (m) => m.method === 'Cut and Fill'
      );
      expect(cutAndFill).toBeDefined();
      expect(cutAndFill?.isEliminated).toBe(false);
    });

    // Test Case 5: Longwall elimination
    it('should eliminate Longwall for thick deposit', () => {
      const inputs: InputValues = {
        shape: 'Platy/Tabular',
        thickness: 'Thick',
        plunge: 'Flat',
        grade: 'Low',
        depth: '100-600m',
        rmr_ore: 'V. Weak',
        rss_ore: 'V. Weak',
        rmr_hw: 'V. Weak',
        rss_hw: 'V. Weak',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const results = calculateScores(inputs);
      const longwall = results.eliminatedMethods.find(
        (m) => m.method === 'Longwall'
      );
      expect(longwall).toBeDefined();
      expect(longwall?.isEliminated).toBe(true);
    });

    // Test Case 6: Room and Pillar elimination for steep plunge
    it('should eliminate Room and Pillar for steep plunge', () => {
      const inputs: InputValues = {
        shape: 'Platy/Tabular',
        thickness: 'Narrow',
        plunge: 'Steep',
        grade: 'Low',
        depth: '100-600m',
        rmr_ore: 'V. Strong',
        rss_ore: 'Strong',
        rmr_hw: 'V. Strong',
        rss_hw: 'Strong',
        rmr_fw: 'Strong',
        rss_fw: 'Strong',
      };
      const results = calculateScores(inputs);
      const roomAndPillar = results.eliminatedMethods.find(
        (m) => m.method === 'Room and Pillar'
      );
      expect(roomAndPillar).toBeDefined();
      expect(roomAndPillar?.isEliminated).toBe(true);
    });

    // Test Case 7: Multiple eliminations
    it('should eliminate multiple methods for conflicting requirements', () => {
      const inputs: InputValues = {
        shape: 'Irregular',
        thickness: 'V. Thick',
        plunge: 'Steep',
        grade: 'High',
        depth: '>600m',
        rmr_ore: 'V. Weak',
        rss_ore: 'V. Weak',
        rmr_hw: 'V. Weak',
        rss_hw: 'V. Weak',
        rmr_fw: 'V. Weak',
        rss_fw: 'V. Weak',
      };
      const results = calculateScores(inputs);
      expect(results.eliminatedMethods.length).toBeGreaterThan(0);
      // Longwall should be eliminated (irregular shape)
      expect(
        results.eliminatedMethods.some((m) => m.method === 'Longwall')
      ).toBe(true);
    });

    // Test Case 8: Verify score components add up
    it('should have total score equal to sum of category scores', () => {
      const inputs: InputValues = {
        shape: 'Platy/Tabular',
        thickness: 'Intermediate',
        plunge: 'Moderate',
        grade: 'Moderate',
        depth: '100-600m',
        rmr_ore: 'Moderate',
        rss_ore: 'Moderate',
        rmr_hw: 'Moderate',
        rss_hw: 'Moderate',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const results = calculateScores(inputs);

      for (const result of results.results) {
        const expectedTotal =
          result.categoryScores.geometry.score +
          result.categoryScores.ore_zone.score +
          result.categoryScores.hanging_wall.score +
          result.categoryScores.footwall.score;
        expect(result.totalScore).toBe(expectedTotal);
      }
    });

    // Test Case 9: Verify all 10 methods are present
    it('should evaluate all 10 mining methods', () => {
      const inputs: InputValues = {
        shape: 'Equidimensional',
        thickness: 'Thick',
        plunge: 'Moderate',
        grade: 'Moderate',
        depth: '100-600m',
        rmr_ore: 'Moderate',
        rss_ore: 'Moderate',
        rmr_hw: 'Moderate',
        rss_hw: 'Moderate',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const results = calculateScores(inputs);
      expect(results.results.length).toBe(10);
    });

    // Test Case 10: Verify ranking is sorted correctly
    it('should rank methods by total score descending', () => {
      const inputs: InputValues = {
        shape: 'Equidimensional',
        thickness: 'Thick',
        plunge: 'Moderate',
        grade: 'Moderate',
        depth: '100-600m',
        rmr_ore: 'Moderate',
        rss_ore: 'Moderate',
        rmr_hw: 'Moderate',
        rss_hw: 'Moderate',
        rmr_fw: 'Moderate',
        rss_fw: 'Moderate',
      };
      const results = calculateScores(inputs);

      for (let i = 1; i < results.rankedMethods.length; i++) {
        expect(results.rankedMethods[i - 1].totalScore).toBeGreaterThanOrEqual(
          results.rankedMethods[i].totalScore
        );
      }
    });
  });

  describe('getConfig', () => {
    it('should return configuration with all required fields', () => {
      const config = getConfig();
      expect(config.version).toBeDefined();
      expect(config.methods).toBeDefined();
      expect(config.methods.length).toBe(10);
      expect(config.factors).toBeDefined();
      expect(config.weights).toBeDefined();
    });
  });
});
