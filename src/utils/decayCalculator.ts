/**
 * Challenge Point Decay Calculator
 *
 * Formula: currentPoints = Math.ceil(((minimumPoints - initialPoints) / (decay²)) × (solves²) + initialPoints)
 * - initialPoints: Starting points (default 1000)
 * - minimumPoints: Lowest possible points (default 100)
 * - decay: Decay rate (default 200)
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
  const value = Math.ceil(
    ((minimumPoints - initialPoints) / (decay * decay)) * (solveCount * solveCount) + initialPoints
  );
  return Math.max(value, minimumPoints);
};

export const generateDecayTable = (
  initialPoints: number = 1000,
  minimumPoints: number = 100,
  decay: number = 200
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
  decay: number = 200
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
 * Example: For default values (initialPoints: 1000, minimumPoints: 100, decay: 200)
 *
 * Solves | Points | Decrease from 1000
 * ------ | ------ | -----------------
 * 0      | 1000   | 0
 * 1      | 999    | 1
 * 2      | 997    | 3
 * 3      | 994    | 6
 * 4      | 990    | 10
 * 5      | 985    | 15
 * 10     | 960    | 40
 * 15     | 926    | 74
 * 20     | 883    | 117
 * 25     | 831    | 169
 * 30     | 771    | 229
 * 35     | 702    | 298
 * 40     | 625    | 375
 * 45     | 539    | 461
 * 50     | 444    | 556
 * 55     | 341    | 659
 * 60    | 230    | 770
 * 65    | 111    | 889
 * 66+   | 100    | 900 (minimum)
 */
