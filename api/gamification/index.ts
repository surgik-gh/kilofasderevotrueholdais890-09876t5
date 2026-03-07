import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated gamification API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  try {
    // Route to appropriate handler based on path
    if (pathname.includes('/achievements')) {
      const { default: achievementsHandler } = await import('./_archive/achievements');
      return achievementsHandler(req, res);
    }
    
    if (pathname.includes('/challenges')) {
      const { default: challengesHandler } = await import('./_archive/challenges');
      return challengesHandler(req, res);
    }
    
    if (pathname.includes('/events')) {
      const { default: eventsHandler } = await import('./_archive/events');
      return eventsHandler(req, res);
    }
    
    if (pathname.includes('/experience')) {
      const { default: experienceHandler } = await import('./_archive/experience');
      return experienceHandler(req, res);
    }
    
    if (pathname.includes('/milestones')) {
      const { default: milestonesHandler } = await import('./_archive/milestones');
      return milestonesHandler(req, res);
    }
    
    if (pathname.includes('/quests')) {
      const { default: questsHandler } = await import('./_archive/quests');
      return questsHandler(req, res);
    }
    
    if (pathname.includes('/streaks')) {
      const { default: streaksHandler } = await import('./_archive/streaks');
      return streaksHandler(req, res);
    }
    
    return res.status(404).json({ error: 'Gamification endpoint not found' });
  } catch (error: any) {
    console.error('Gamification API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
