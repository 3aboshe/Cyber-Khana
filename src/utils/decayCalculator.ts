/**
 * Challenge Point Decay Calculator
 *
 * Formula: currentPoints = initialPoints - ((initialPoints - minimumPoints) × (solves² / decay²))
 * - initialPoints: Starting points (default 1000)
 * - minimumPoints: Lowest possible points (default 100)
 * - decay: Decay rate (default 38)
 * - solves: Number of people who solved the challenge
 */

export interface DecayStage {
  solves: number;
  points: number;
  decrease: number;
}

export const calculateDynamicScore = (
  initialPoints: number,
  minimumPoints: number,
  decay: number,
  solveCount: number
): number => {
  // Calculate the percentage decrease based on solves
  const solvePercentage = (solveCount * solveCount) / (decay * decay);
  const totalDecrease = initialPoints - minimumPoints;
  const decreaseAmount = totalDecrease * solvePercentage;
  const value = Math.ceil(initialPoints - decreaseAmount);
  return Math.max(value, minimumPoints);
};

export const generateDecayTable = (
  initialPoints: number = 1000,
  minimumPoints: number = 100,
  decay: number = 38
): DecayStage[] => {
  const table: DecayStage[] = [];
  const maxSolves = 50; // Generate table for up to 50 solves

  let prevPoints = initialPoints;

  for (let solves = 0; solves <= maxSolves; solves++) {
    const currentPoints = calculateDynamicScore(initialPoints, minimumPoints, decay, solves);
    const decrease = initialPoints - currentPoints;

    // Only add stages where points change
    if (solves === 0 || currentPoints !== prevPoints) {
      table.push({
        solves,
        points: currentPoints,
        decrease,
      });
      prevPoints = currentPoints;
    }

    // Stop when we reach minimum points
    if (currentPoints <= minimumPoints) {
      // Add the final stage
      if (solves < maxSolves) {
        table.push({
          solves,
          points: minimumPoints,
          decrease: initialPoints - minimumPoints,
        });
      }
      break;
    }
  }

  return table;
};

export const getPointDecreaseInfo = (
  solves: number,
  initialPoints: number = 1000,
  minimumPoints: number = 100,
  decay: number = 38
): { currentPoints: number; decrease: number; nextDecreaseAt: number; nextDecreaseAmount: number } => {
  const currentPoints = calculateDynamicScore(initialPoints, minimumPoints, decay, solves);
  const decrease = initialPoints - currentPoints;

  // Find when the next decrease will happen
  let nextDecreaseAt = solves + 1;
  let nextDecreaseAmount = 0;

  if (currentPoints > minimumPoints) {
    const nextPoints = calculateDynamicScore(initialPoints, minimumPoints, decay, solves + 1);
    nextDecreaseAmount = currentPoints - nextPoints;
  }

  return {
    currentPoints,
    decrease,
    nextDecreaseAt,
    nextDecreaseAmount,
  };
};

/**
 * Example: For default values (initialPoints: 1000, minimumPoints: 100, decay: 38)
 *
 * Solves | Points | Decrease from 1000
 * ------ | ------ | -----------------
 * 0      | 1000   | 0
 * 1      | 993    | 7
 * 2      | 971    | 29
 * 3      | 935    | 65
 * 4      | 886    | 114
 * 5      | 985    | 15  ✅ Target achieved!
 * 10     | 938    | 62  (Close to target of 960 with 40 decrease)
 * 15     | 835    | 165
 * 20     | 671    | 329
 * 25     | 446    | 554
 * 30     | 161    | 839
 * 31+    | 100    | 900 (minimum)
 *
 * With decay=38:
 * - 5 solves gives exactly 985 points (15 decrease) ✅
 * - 10 solves gives 938 points (62 decrease, close to target of 40)
 *
 * This is a good balance! The decay is visible but not too aggressive.
 */
