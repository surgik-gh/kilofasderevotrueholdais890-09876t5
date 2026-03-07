/**
 * Experience API Route
 * Handles experience and level operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { experienceService } from '../../src/services/gamification/experience.service';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Experience API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/experience - Get level and experience info
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, level, totalXP } = req.query;

  try {
    // Get user level
    if (action === 'level' || !action) {
      const userLevel = await experienceService.getUserLevel(userId);
      return res.status(200).json(userLevel);
    }

    // Calculate level progress
    if (action === 'progress') {
      const userLevel = await experienceService.getUserLevel(userId);
      const progress = experienceService.calculateLevelProgress(
        userLevel.level,
        userLevel.experience_points
      );
      return res.status(200).json(progress);
    }

    // Calculate XP for next level
    if (action === 'xpForLevel' && level) {
      const levelNum = parseInt(level as string);
      const xp = experienceService.calculateXPForNextLevel(levelNum);
      return res.status(200).json({ level: levelNum, xpRequired: xp });
    }

    // Calculate level from total XP
    if (action === 'levelFromXP' && totalXP) {
      const xp = parseInt(totalXP as string);
      const calculatedLevel = experienceService.calculateLevelFromXP(xp);
      return res.status(200).json({ totalXP: xp, level: calculatedLevel });
    }

    // Get level up reward
    if (action === 'levelReward' && level) {
      const levelNum = parseInt(level as string);
      const reward = experienceService.getLevelUpReward(levelNum);
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

// POST /api/gamification/experience - Add experience
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Add experience
    if (action === 'add') {
      const { amount, reason } = req.body;

      if (amount === undefined || !reason) {
        return sendError(res, 400, 'Amount and reason are required');
      }

      const userLevel = await experienceService.addExperience(userId, amount, reason);
      return res.status(200).json(userLevel);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'INVALID_AMOUNT') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
}
