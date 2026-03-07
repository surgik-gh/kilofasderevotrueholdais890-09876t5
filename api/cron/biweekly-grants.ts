/**
 * Biweekly Token Grants Cron Job
 * Runs every 14 days at midnight
 * Grants tokens to all users based on their subscription tier
 * 
 * Vercel Cron Job
 * Schedule: 0 0 */14 * * (midnight every 14 days)
 * 
 * Requirements: 9.1-9.12, 10.1-10.12
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tokenEconomyService } from '../../src/services/token-economy.service';
import { supabase } from '../../src/lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting biweekly token grants...');
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier, email');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users found for biweekly grants');
      return res.status(200).json({
        success: true,
        message: 'No users to process',
        processedUsers: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Process grants for each user
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const user of users) {
      try {
        await tokenEconomyService.processBiweeklyGrant(user.id);
        successCount++;
        console.log(`Granted biweekly tokens to user ${user.id} (${user.email})`);
      } catch (error) {
        failureCount++;
        const errorMessage = (error as Error).message;
        errors.push({ userId: user.id, error: errorMessage });
        console.error(`Failed to grant tokens to user ${user.id}:`, errorMessage);
      }
    }

    console.log(`Biweekly grants complete: ${successCount} successful, ${failureCount} failed`);
    
    return res.status(200).json({
      success: true,
      message: 'Biweekly token grants completed',
      totalUsers: users.length,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Biweekly grants failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Biweekly grants failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
