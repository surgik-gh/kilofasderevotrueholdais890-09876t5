/**
 * Achievements API Route
 * Handles achievement operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { achievementService } from '../../src/services/gamification/achievement.service';
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
    console.error('Achievements API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/achievements - Get achievements
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, achievementId } = req.query;

  try {
    // Get all achievements
    if (action === 'all') {
      const achievements = await achievementService.getAllAchievements();
      return res.status(200).json(achievements);
    }

    // Get user achievements
    if (action === 'user') {
      const userAchievements = await achievementService.getUserAchievements(userId);
      return res.status(200).json(userAchievements);
    }

    // Get favorite achievements
    if (action === 'favorites') {
      const favorites = await achievementService.getFavoriteAchievements(userId);
      return res.status(200).json(favorites);
    }

    // Get achievement progress
    if (action === 'progress' && achievementId && typeof achievementId === 'string') {
      const progress = await achievementService.getAchievementProgress(userId, achievementId);
      return res.status(200).json(progress);
    }

    // Get achievement stats
    if (action === 'stats') {
      const stats = await achievementService.getAchievementStats(userId);
      return res.status(200).json(stats);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}

// POST /api/gamification/achievements - Check or unlock achievements
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Check achievements
    if (action === 'check') {
      const { eventType, value } = req.body;

      if (!eventType || value === undefined) {
        return sendError(res, 400, 'Event type and value are required');
      }

      const unlockedAchievements = await achievementService.checkAchievements(userId, eventType, value);
      return res.status(200).json(unlockedAchievements);
    }

    // Unlock achievement
    if (action === 'unlock') {
      const { achievementId } = req.body;

      if (!achievementId) {
        return sendError(res, 400, 'Achievement ID is required');
      }

      const userAchievement = await achievementService.unlockAchievement(userId, achievementId);
      return res.status(200).json(userAchievement);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'ALREADY_UNLOCKED') {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
}

// PUT /api/gamification/achievements - Update achievement settings
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Set favorite achievement
    if (action === 'favorite') {
      const { achievementId, isFavorite } = req.body;

      if (!achievementId || isFavorite === undefined) {
        return sendError(res, 400, 'Achievement ID and isFavorite are required');
      }

      await achievementService.setFavoriteAchievement(userId, achievementId, isFavorite);
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
