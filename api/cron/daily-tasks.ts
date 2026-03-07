import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated daily cron job handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import all daily task handlers
    const { default: dailyEligibility } = await import('./daily-eligibility');
    const { default: resetDailyQuests } = await import('./reset-daily-quests');
    const { default: checkStreaks } = await import('./check-streaks');
    const { default: generateDailyContent } = await import('./generate-daily-content');
    const { default: dailyReset } = await import('./daily-reset');

    // Execute all daily tasks in parallel
    const results = await Promise.allSettled([
      dailyEligibility(req, res),
      resetDailyQuests(req, res),
      checkStreaks(req, res),
      generateDailyContent(req, res),
      dailyReset(req, res)
    ]);

    const failures = results.filter(r => r.status === 'rejected');
    
    if (failures.length > 0) {
      console.error('Some daily tasks failed:', failures);
      return res.status(207).json({ 
        message: 'Some tasks failed',
        failures: failures.length,
        total: results.length
      });
    }

    return res.status(200).json({ 
      message: 'All daily tasks completed successfully',
      tasksRun: results.length
    });
  } catch (error: any) {
    console.error('Daily tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
}
