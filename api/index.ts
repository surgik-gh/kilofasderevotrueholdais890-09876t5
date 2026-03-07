import type { VercelRequest, VercelResponse } from '@vercel/node';

// Consolidated API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  // Route to appropriate handler based on path
  if (pathname.startsWith('/api/chat')) {
    const { default: chatHandler } = await import('./chat/index');
    return chatHandler(req, res);
  }
  
  if (pathname.startsWith('/api/lessons')) {
    const { default: lessonsHandler } = await import('./lessons/index');
    return lessonsHandler(req, res);
  }
  
  if (pathname.startsWith('/api/quizzes')) {
    const { default: quizzesHandler } = await import('./quizzes/index');
    return quizzesHandler(req, res);
  }
  
  if (pathname.startsWith('/api/support')) {
    const { default: supportHandler } = await import('./support/index');
    return supportHandler(req, res);
  }
  
  if (pathname.startsWith('/api/leaderboard')) {
    const { default: leaderboardHandler } = await import('./leaderboard/index');
    return leaderboardHandler(req, res);
  }
  
  // Gamification routes
  if (pathname.startsWith('/api/gamification/achievements')) {
    const { default: achievementsHandler } = await import('./gamification/achievements');
    return achievementsHandler(req, res);
  }
  
  if (pathname.startsWith('/api/gamification/challenges')) {
    const { default: challengesHandler } = await import('./gamification/challenges');
    return challengesHandler(req, res);
  }
  
  if (pathname.startsWith('/api/gamification/events')) {
    const { default: eventsHandler } = await import('./gamification/events');
    return eventsHandler(req, res);
  }
  
  if (pathname.startsWith('/api/gamification/experience')) {
    const { default: experienceHandler } = await import('./gamification/experience');
    return experienceHandler(req, res);
  }
  
  if (pathname.startsWith('/api/gamification/milestones')) {
    const { default: milestonesHandler } = await import('./gamification/milestones');
    return milestonesHandler(req, res);
  }
  
  if (pathname.startsWith('/api/gamification/quests')) {
    const { default: questsHandler } = await import('./gamification/quests');
    return questsHandler(req, res);
  }
  
  if (pathname.startsWith('/api/gamification/streaks')) {
    const { default: streaksHandler } = await import('./gamification/streaks');
    return streaksHandler(req, res);
  }
  
  return res.status(404).json({ error: 'Not found' });
}
