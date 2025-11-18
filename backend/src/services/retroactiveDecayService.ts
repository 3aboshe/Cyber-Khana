import Challenge, { calculateDynamicScore } from '../models/Challenge';
import User from '../models/User';
import Competition from '../models/Competition';

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
    // Check if this is a regular challenge (in Challenge collection)
    let challenge = await Challenge.findById(challengeId);
    let isFromCompetition = false;
    let competitionId: string | null = null;
    let challengeData: any = null;

    // If not found in Challenge collection, check if it's from a competition
    if (!challenge) {
      const competition = await Competition.findOne({
        'challenges._id': challengeId
      });

      if (competition) {
        const compChallenge = competition.challenges.find((c: any) => c._id.toString() === challengeId);
        if (compChallenge) {
          // Create a challenge-like object for decay calculation
          challengeData = {
            title: compChallenge.title,
            initialPoints: compChallenge.initialPoints || 1000,
            minimumPoints: compChallenge.minimumPoints || 100,
            decay: compChallenge.decay || 38,
            solves: compChallenge.solves
          };
          isFromCompetition = true;
          competitionId = (competition as any)._id.toString();
        }
      }
    }

    if (!challenge && !challengeData) {
      throw new Error('Challenge not found in any collection');
    }

    // Calculate what the current points should be
    const challengeObj = challenge || challengeData;
    const initialPoints = challengeObj.initialPoints || challengeObj.points || 1000;
    const minimumPoints = challengeObj.minimumPoints || 100;
    const decay = challengeObj.decay || 38;
    const currentSolveCount = challengeObj.solves;

    const correctPoints = calculateDynamicScore(
      initialPoints,
      minimumPoints,
      decay,
      currentSolveCount
    );

    console.log(`Applying retroactive decay for challenge: ${challengeObj.title}`);
    console.log(`Total solves: ${currentSolveCount}, Correct points: ${correctPoints}`);
    console.log(`From competition: ${isFromCompetition}`);

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

          // Update the appropriate points field
          if (isFromCompetition) {
            // For competition challenges, adjust competitionPoints
            user.competitionPoints += pointsDifference;
          } else {
            // For regular challenges, adjust regular points
            user.points += pointsDifference;
          }

          // Update the points in their solvedChallengesDetails
          details[challengeDetailIndex].points = correctPoints;

          await user.save();
          totalPointsAdjusted += Math.abs(pointsDifference);
          userCount++;
        }
      }
    }

    // For regular challenges, update the challenge's currentPoints field
    if (!isFromCompetition && challenge) {
      challenge.currentPoints = correctPoints;
      await challenge.save();
    }

    console.log(`✓ Retroactive decay applied successfully`);
    console.log(`  Updated ${userCount} users`);
    console.log(`  Total points adjusted: ${totalPointsAdjusted}`);

    return {
      success: true,
      challengeId,
      fromCompetition: isFromCompetition,
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
 * Apply retroactive decay to ALL challenges (both regular and competition)
 * This should be run once to fix all existing challenges
 */
export const applyRetroactiveDecayToAllChallenges = async (universityCode?: string) => {
  try {
    console.log('\n=== Starting Retroactive Decay for All Challenges ===\n');

    const results = [];
    let totalUsersUpdated = 0;
    let totalPointsAdjusted = 0;

    // Process regular challenges
    const query = universityCode ? { universityCode } : {};
    const challenges = await Challenge.find(query);

    console.log(`Found ${challenges.length} regular challenges to process\n`);

    for (const challenge of challenges) {
      try {
        const result = await applyRetroactiveDecay((challenge as any)._id.toString());
        results.push(result);
        totalUsersUpdated += result.usersUpdated;
        totalPointsAdjusted += result.totalPointsAdjusted;

        console.log(`\n--- Regular Challenge: ${challenge.title} (${challenge.universityCode}) ---\n`);
      } catch (error) {
        console.error(`Failed to process challenge ${challenge.title}:`, error);
        results.push({
          success: false,
          challengeId: (challenge as any)._id.toString(),
          fromCompetition: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Process competition challenges
    const Competition = require('../models/Competition').default;
    const compQuery = universityCode ? { universityCode } : {};
    const competitions = await Competition.find(compQuery);

    let totalCompetitionChallenges = 0;
    for (const competition of competitions) {
      for (const compChallenge of competition.challenges) {
        totalCompetitionChallenges++;
        try {
          const result = await applyRetroactiveDecay(compChallenge._id.toString());
          results.push(result);
          totalUsersUpdated += result.usersUpdated;
          totalPointsAdjusted += result.totalPointsAdjusted;

          console.log(`\n--- Competition Challenge: ${compChallenge.title} (${competition.name}) ---\n`);
        } catch (error) {
          console.error(`Failed to process competition challenge ${compChallenge.title}:`, error);
          results.push({
            success: false,
            challengeId: compChallenge._id.toString(),
            fromCompetition: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    console.log('\n=== Retroactive Decay Complete ===\n');
    console.log(`Total challenges processed: ${results.length}`);
    console.log(`  - Regular challenges: ${challenges.length}`);
    console.log(`  - Competition challenges: ${totalCompetitionChallenges}`);
    console.log(`Total users updated: ${totalUsersUpdated}`);
    console.log(`Total points adjusted: ${totalPointsAdjusted}`);

    return {
      totalChallenges: results.length,
      regularChallenges: challenges.length,
      competitionChallenges: totalCompetitionChallenges,
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
