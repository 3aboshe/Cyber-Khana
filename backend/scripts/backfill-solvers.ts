import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberkhana';

interface ISolver {
  odId: mongoose.Types.ObjectId;
  username: string;
  fullName?: string;
  solvedAt: Date;
  isFirstBlood: boolean;
}

async function backfillSolvers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      fullName: String,
      solvedChallenges: [String],
      solvedChallengesDetails: [{
        challengeId: String,
        solvedAt: Date,
        points: Number
      }]
    }));

    const Challenge = mongoose.model('Challenge', new mongoose.Schema({
      title: String,
      solvers: [{
        odId: mongoose.Types.ObjectId,
        username: String,
        fullName: String,
        solvedAt: Date,
        isFirstBlood: Boolean
      }],
      solves: Number
    }));

    const Competition = mongoose.model('Competition', new mongoose.Schema({
      name: String,
      challenges: [{
        _id: mongoose.Types.ObjectId,
        title: String,
        solvers: [{
          odId: mongoose.Types.ObjectId,
          username: String,
          fullName: String,
          solvedAt: Date,
          isFirstBlood: Boolean
        }],
        solves: Number
      }]
    }));

    // Get all users with solved challenges
    const users = await User.find({ 
      solvedChallengesDetails: { $exists: true, $ne: [] } 
    });

    console.log(`Found ${users.length} users with solved challenges`);

    // Build a map of challenge ID -> solvers (sorted by time)
    const challengeSolversMap: Map<string, ISolver[]> = new Map();

    for (const user of users) {
      for (const solve of (user as any).solvedChallengesDetails || []) {
        const challengeId = solve.challengeId;
        if (!challengeId) continue;

        const solverEntry: ISolver = {
          odId: user._id as mongoose.Types.ObjectId,
          username: (user as any).username,
          fullName: (user as any).fullName,
          solvedAt: solve.solvedAt,
          isFirstBlood: false // Will be set after sorting
        };

        if (!challengeSolversMap.has(challengeId)) {
          challengeSolversMap.set(challengeId, []);
        }
        challengeSolversMap.get(challengeId)!.push(solverEntry);
      }
    }

    console.log(`Found solves for ${challengeSolversMap.size} unique challenges`);

    // Sort each challenge's solvers by time and mark first blood
    for (const [challengeId, solvers] of challengeSolversMap) {
      solvers.sort((a, b) => new Date(a.solvedAt).getTime() - new Date(b.solvedAt).getTime());
      if (solvers.length > 0) {
        solvers[0].isFirstBlood = true;
      }
    }

    // Update regular challenges
    let updatedChallenges = 0;
    for (const [challengeId, solvers] of challengeSolversMap) {
      const result = await Challenge.updateOne(
        { _id: challengeId },
        { 
          $set: { 
            solvers: solvers,
            solves: solvers.length
          } 
        }
      );
      if (result.modifiedCount > 0) {
        updatedChallenges++;
      }
    }

    console.log(`Updated ${updatedChallenges} regular challenges with solver data`);

    // Update competition challenges
    const competitions = await Competition.find({});
    let updatedCompetitionChallenges = 0;

    for (const competition of competitions) {
      let modified = false;
      for (const challenge of (competition as any).challenges || []) {
        const challengeId = challenge._id.toString();
        const solvers = challengeSolversMap.get(challengeId);
        if (solvers && solvers.length > 0) {
          challenge.solvers = solvers;
          challenge.solves = solvers.length;
          modified = true;
          updatedCompetitionChallenges++;
        }
      }
      if (modified) {
        await competition.save();
      }
    }

    console.log(`Updated ${updatedCompetitionChallenges} competition challenges with solver data`);

    console.log('Backfill complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

backfillSolvers();
