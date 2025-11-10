import Challenge, { calculateDynamicScore } from '../models/Challenge';
import User from '../models/User';

/**
 * Service to handle retroactive point decay for challenges
 * When a challenge gets new solves, all previous solvers' points should be recalculated
 */

/**
 * Apply retroactive decay to all solvers of a challenge
 * This ensures all solvers have the correct points based on the current total solve count
 */
export const applyRetroactiveDecay = async (challengeId: string) => {
  try {
    // Get the challenge with current solve count
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Calculate what the current points should be
    const initialPoints = challenge.initialPoints || challenge.points || 1000;
    const minimumPoints = challenge.minimumPoints || 100;
    const decay = challenge.decay || 38;
    const currentSolveCount = challenge.solves;

    const correctPoints = calculateDynamicScore(
      initialPoints,
      minimumPoints,
      decay,
      currentSolveCount
    );

    console.log(`Applying retroactive decay for challenge: ${challenge.title}`);
    console.log(`Total solves: ${currentSolveCount}, Correct points: ${correctPoints}`);

    // Find all users who solved this challenge
    const users = await User.find({
      solvedChallenges: challengeId
    });

    let totalPointsAdjusted = 0;
    let userCount = 0;

    for (const user of users) {
      // Find this challenge in their solvedChallengesDetails
      const details = user.solvedChallengesDetails as Array<{ challengeId: string; solvedAt: Date; points: number }>;
      const challengeDetailIndex = details.findIndex(
        (detail) => detail.challengeId.toString() === challengeId
      );

      if (challengeDetailIndex !== -1) {
        const oldPoints = details[challengeDetailIndex].points;
        const pointsDifference = correctPoints - oldPoints;

        if (pointsDifference !== 0) {
          console.log(`  User: ${user.username} - Old: ${oldPoints}, New: ${correctPoints}, Diff: ${pointsDifference}`);

          // Update the user's points
          user.points += pointsDifference;

          // Update the points in their solvedChallengesDetails
          details[challengeDetailIndex].points = correctPoints;

          await user.save();
          totalPointsAdjusted += Math.abs(pointsDifference);
          userCount++;
        }
      }
    }

    // Update the challenge's currentPoints field
    challenge.currentPoints = correctPoints;
    await challenge.save();

    console.log(`✓ Retroactive decay applied successfully`);
    console.log(`  Updated ${userCount} users`);
    console.log(`  Total points adjusted: ${totalPointsAdjusted}`);

    return {
      success: true,
      challengeId,
      totalSolves: currentSolveCount,
      correctPoints,
      usersUpdated: userCount,
      totalPointsAdjusted
    };

  } catch (error) {
    console.error('Error applying retroactive decay:', error);
    throw error;
  }
};

/**
 * Apply retroactive decay to ALL challenges
 * This should be run once to fix all existing challenges
 */
export const applyRetroactiveDecayToAllChallenges = async (universityCode?: string) => {
  try {
    console.log('\n=== Starting Retroactive Decay for All Challenges ===\n');

    const query = universityCode ? { universityCode } : {};
    const challenges = await Challenge.find(query);

    console.log(`Found ${challenges.length} challenges to process\n`);

    const results = [];
    let totalUsersUpdated = 0;
    let totalPointsAdjusted = 0;

    for (const challenge of challenges) {
      try {
        const result = await applyRetroactiveDecay((challenge as any)._id.toString());
        results.push(result);
        totalUsersUpdated += result.usersUpdated;
        totalPointsAdjusted += result.totalPointsAdjusted;

        console.log(`\n--- Challenge: ${challenge.title} (${challenge.universityCode}) ---\n`);
      } catch (error) {
        console.error(`Failed to process challenge ${challenge.title}:`, error);
        results.push({
          success: false,
          challengeId: (challenge as any)._id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\n=== Retroactive Decay Complete ===\n');
    console.log(`Total challenges processed: ${results.length}`);
    console.log(`Total users updated: ${totalUsersUpdated}`);
    console.log(`Total points adjusted: ${totalPointsAdjusted}`);

    return {
      totalChallenges: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalUsersUpdated,
      totalPointsAdjusted,
      results
    };

  } catch (error) {
    console.error('Error in applyRetroactiveDecayToAllChallenges:', error);
    throw error;
  }
};

/**
 * Check if a challenge needs retroactive decay applied
 * Returns true if the challenge has solvers but currentPoints doesn't match expected points
 */
export const checkIfDecayNeeded = async (challengeId: string) => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) return false;

  const initialPoints = challenge.initialPoints || challenge.points || 1000;
  const minimumPoints = challenge.minimumPoints || 100;
  const decay = challenge.decay || 38;

  const expectedPoints = calculateDynamicScore(
    initialPoints,
    minimumPoints,
    decay,
    challenge.solves
  );

  return expectedPoints !== challenge.currentPoints;
};
