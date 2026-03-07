import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import all gamification handlers
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  // Route based on path
  if (pathname.includes('/achievements')) {
    const { default: achievementsHandler } = await import('./gamification/achievements');
    return achievementsHandler(req, res);
  }
  
  if (pathname.includes('/challenges')) {
    const { default: challengesHandler } = await import('./gamification/challenges');
    return challengesHandler(req, res);
  }
  
  if (pathname.includes('/events')) {
    const { default: eventsHandler } = await import('./gamification/events');
    return eventsHandler(req, res);
  }
  
  if (pathname.includes('/experience')) {
    const { default: experienceHandler } = await import('./gamification/experience');
    return experienceHandler(req, res);
  }
  
  if (pathname.includes('/milestones')) {
    const { default: milestonesHandler } = await import('./gamification/milestones');
    return milestonesHandler(req, res);
  }
  
  if (pathname.includes('/quests')) {
    const { default: questsHandler } = await import('./gamification/quests');
    return questsHandler(req, res);
  }
  
  if (pathname.includes('/streaks')) {
    const { default: streaksHandler } = await import('./gamification/streaks');
    return streaksHandler(req, res);
  }
  
  return res.status(404).json({ error: 'Gamification endpoint not found' });
}
