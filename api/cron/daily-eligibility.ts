/**
 * Daily Login Eligibility Reset Cron Job
 * Runs daily at midnight
 * Resets daily login eligibility for all users
 * 
 * Vercel Cron Job
 * Schedule: 0 0 * * * (midnight daily)
 * 
 * Requirements: 15.5
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
    console.log('Starting daily login eligibility reset...');
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Reset login streaks for users who didn't login yesterday
    // (Users who logged in yesterday will have their streak maintained when they login today)
    const { data: usersToReset, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, last_login_date, daily_login_streak')
      .neq('last_login_date', yesterdayStr)
      .gt('daily_login_streak', 0);

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    let resetCount = 0;

    if (usersToReset && usersToReset.length > 0) {
      // Reset streaks for users who broke their streak
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ daily_login_streak: 0 })
        .neq('last_login_date', yesterdayStr)
        .gt('daily_login_streak', 0);

      if (updateError) {
        throw new Error(`Failed to reset streaks: ${updateError.message}`);
      }

      resetCount = usersToReset.length;
      console.log(`Reset login streaks for ${resetCount} users who didn't login yesterday`);
    }

    console.log('Daily login eligibility reset complete');
    
    return res.status(200).json({
      success: true,
      message: 'Daily login eligibility reset completed',
      streaksReset: resetCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily eligibility reset failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Daily eligibility reset failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
