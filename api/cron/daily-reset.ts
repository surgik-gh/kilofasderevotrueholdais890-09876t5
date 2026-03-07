/**
 * Daily Leaderboard Reset Cron Job
 * Runs daily at 18:00 (6:00 PM)
 * Awards coins to top 3 students and resets leaderboard
 * 
 * Vercel Cron Job
 * Schedule: 0 18 * * * (6:00 PM daily)
 * 
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { leaderboardService } from '../../src/services/leaderboard.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting daily leaderboard reset...');
    
    // Perform daily reset
    const rewardedCount = await leaderboardService.performDailyReset();
    
    console.log(`Daily reset complete: ${rewardedCount} students rewarded`);
    
    return res.status(200).json({
      success: true,
      message: 'Daily leaderboard reset completed',
      rewardedStudents: rewardedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily reset failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Daily reset failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
