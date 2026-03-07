/**
 * Check Streaks Cron Job
 * Runs daily at midnight
 * Checks and resets streaks for users who broke them
 * 
 * Vercel Cron Job
 * Schedule: 0 0 * * * (midnight daily)
 * 
 * Requirements: 12.6
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting streaks check...');
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Find streaks that should be broken (last activity was not yesterday)
    const { data: streaksToBreak, error: fetchError } = await supabase
      .from('streaks')
      .select('*')
      .neq('last_activity_date', yesterdayStr)
      .gt('current_count', 0);

    if (fetchError) {
      throw new Error(`Failed to fetch streaks: ${fetchError.message}`);
    }

    let brokenCount = 0;

    if (streaksToBreak && streaksToBreak.length > 0) {
      // Reset current_count to 0 for broken streaks
      const { error: updateError } = await supabase
        .from('streaks')
        .update({ 
          current_count: 0,
          updated_at: new Date().toISOString()
        })
        .neq('last_activity_date', yesterdayStr)
        .gt('current_count', 0);

      if (updateError) {
        throw new Error(`Failed to reset streaks: ${updateError.message}`);
      }

      brokenCount = streaksToBreak.length;
      console.log(`Reset ${brokenCount} broken streaks`);
    }

    console.log('Streaks check complete');
    
    return res.status(200).json({
      success: true,
      message: 'Streaks check completed',
      streaksBroken: brokenCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Streaks check failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Streaks check failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
