#!/usr/bin/env ts-node

/**
 * Migration Script: Apply Retroactive Decay to All Challenges
 *
 * This script recalculates and updates points for ALL users who solved challenges
 * based on the current total solve count. This ensures that as more people solve
 * a challenge, all previous solvers' points decrease accordingly.
 *
 * Run with: npx ts-node scripts/apply-retroactive-decay.ts
 * Or compile and run: tsc && node dist/scripts/apply-retroactive-decay.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Challenge from '../src/models/Challenge';
import User from '../src/models/User';
import { applyRetroactiveDecayToAllChallenges } from '../src/services/retroactiveDecayService';

async function main() {
  console.log('\n==========================================');
  console.log('Retroactive Decay Migration Script');
  console.log('==========================================\n');

  // Check MongoDB connection
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in .env file');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Show current database info
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}\n`);

    // Get all challenges
    const challenges = await Challenge.find({});
    console.log(`📝 Found ${challenges.length} challenges in the database\n`);

    if (challenges.length === 0) {
      console.log('ℹ️  No challenges found. Nothing to migrate.');
      process.exit(0);
    }

    // Show challenge details before migration
    console.log('Current Challenge State:');
    console.log('─'.repeat(80));
    challenges.forEach((challenge) => {
      const initialPoints = challenge.initialPoints || challenge.points || 1000;
      const minimumPoints = challenge.minimumPoints || 100;
      const decay = challenge.decay || 38;

      console.log(`\nChallenge: ${challenge.title}`);
      console.log(`  University: ${challenge.universityCode}`);
      console.log(`  Solves: ${challenge.solves}`);
      console.log(`  Initial Points: ${initialPoints}`);
      console.log(`  Minimum Points: ${minimumPoints}`);
      console.log(`  Decay: ${decay}`);
      console.log(`  Current Points (before): ${challenge.currentPoints}`);

      // Calculate what the points should be
      const solvePercentage = (challenge.solves * challenge.solves) / (decay * decay);
      const totalDecrease = initialPoints - minimumPoints;
      const decreaseAmount = totalDecrease * solvePercentage;
      const expectedPoints = Math.max(Math.ceil(initialPoints - decreaseAmount), minimumPoints);

      console.log(`  Current Points (expected): ${expectedPoints}`);

      if (challenge.currentPoints !== expectedPoints) {
        console.log(`  ⚠️  MISMATCH! Needs update.`);
      } else {
        console.log(`  ✅ Up to date.`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n🚀 Starting retroactive decay migration...\n');

    // Apply retroactive decay to all challenges
    const result = await applyRetroactiveDecayToAllChallenges();

    console.log('\n' + '═'.repeat(80));
    console.log('Migration Complete!');
    console.log('═'.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Challenges: ${result.totalChallenges}`);
    console.log(`   Successful: ${result.successful}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Users Updated: ${result.totalUsersUpdated}`);
    console.log(`   Total Points Adjusted: ${result.totalPointsAdjusted}`);

    if (result.failed > 0) {
      console.log('\n⚠️  Some challenges failed to process:');
      result.results
        .filter((r: any) => !r.success)
        .forEach((r: any) => {
          console.log(`   - ${r.challengeId}: ${r.error}`);
        });
    }

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Disconnected from MongoDB\n');
  }
}

// Run the migration
main()
  .then(() => {
    console.log('Script finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
