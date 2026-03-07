/**
 * Streaks API Route
 * Handles streak operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streakService } from '../../src/services/gamification/streak.service';
import { supabase } from '../../src/lib/supabase';

// Helper to get authenticated user
async function getAuthenticatedUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

// Helper to send error response
function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate user
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user.id);
      
      case 'POST':
        return await handlePost(req, res, user.id);
      
      case 'PUT':
        return await handlePut(req, res, user.id);
      
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Streaks API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/streaks - Get streaks
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, type } = req.query;

  try {
    // Get all user streaks
    if (action === 'all' || !action) {
      const streaks = await streakService.getUserStreaks(userId);
      return res.status(200).json(streaks);
    }

    // Get specific streak
    if (action === 'get' && type && typeof type === 'string') {
      const streak = await streakService.getStreak(userId, type as any);
      return res.status(200).json(streak);
    }

    // Get streak reward
    if (action === 'reward' && type) {
      const count = req.query.count ? parseInt(req.query.count as string) : 0;
      const reward = streakService.getStreakReward(type as any, count);
      return res.status(200).json(reward);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}

// POST /api/gamification/streaks - Claim streak reward
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Claim streak reward
    if (action === 'claimReward') {
      const { type } = req.body;

      if (!type) {
        return sendError(res, 400, 'Streak type is required');
      }

      const reward = await streakService.claimStreakReward(userId, type);
      return res.status(200).json(reward);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'NO_REWARD') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
}

// PUT /api/gamification/streaks - Update or break streak
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Update streak
    if (action === 'update') {
      const { type } = req.body;

      if (!type) {
        return sendError(res, 400, 'Streak type is required');
      }

      const streak = await streakService.updateStreak(userId, type);
      return res.status(200).json(streak);
    }

    // Break streak
    if (action === 'break') {
      const { type } = req.body;

      if (!type) {
        return sendError(res, 400, 'Streak type is required');
      }

      await streakService.breakStreak(userId, type);
      return res.status(200).json({ success: true });
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}
