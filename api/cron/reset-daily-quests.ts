/**
 * Daily Quests Reset Cron Job
 * Runs daily at midnight
 * Resets daily quests for all users
 * 
 * Vercel Cron Job
 * Schedule: 0 0 * * * (midnight daily)
 * 
 * Requirements: 3.6
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { questService } from '../../src/services/gamification/quest.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting daily quests reset...');
    
    // Reset daily quests
    await questService.resetDailyQuests();
    
    console.log('Daily quests reset complete');
    
    return res.status(200).json({
      success: true,
      message: 'Daily quests reset completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily quests reset failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Daily quests reset failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
