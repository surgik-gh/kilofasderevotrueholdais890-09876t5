import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated weekly cron job handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Import all weekly task handlers
    const { default: resetWeeklyQuests } = await import('./reset-weekly-quests');
    const { default: generateWeeklyChallenge } = await import('./generate-weekly-challenge');

    // Execute all weekly tasks in parallel
    const results = await Promise.allSettled([
      resetWeeklyQuests(req, res),
      generateWeeklyChallenge(req, res)
    ]);

    const failures = results.filter(r => r.status === 'rejected');
    
    if (failures.length > 0) {
      console.error('Some weekly tasks failed:', failures);
      return res.status(207).json({ 
        message: 'Some tasks failed',
        failures: failures.length,
        total: results.length
      });
    }

    return res.status(200).json({ 
      message: 'All weekly tasks completed successfully',
      tasksRun: results.length
    });
  } catch (error: any) {
    console.error('Weekly tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
}
