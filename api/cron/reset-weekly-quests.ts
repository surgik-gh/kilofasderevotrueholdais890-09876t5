/**
 * Weekly Quests Reset Cron Job
 * Runs weekly on Monday at midnight
 * Resets weekly quests for all users
 * 
 * Vercel Cron Job
 * Schedule: 0 0 * * 1 (Monday at midnight)
 * 
 * Requirements: 4.6
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
    console.log('Starting weekly quests reset...');
    
    // Reset weekly quests
    await questService.resetWeeklyQuests();
    
    console.log('Weekly quests reset complete');
    
    return res.status(200).json({
      success: true,
      message: 'Weekly quests reset completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weekly quests reset failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Weekly quests reset failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
