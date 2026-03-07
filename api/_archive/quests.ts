/**
 * Quests API Route
 * Handles quest operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { questService } from '../../src/services/gamification/quest.service';
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
    console.error('Quests API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/quests - Get quests
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, type, questId } = req.query;

  try {
    // Get active quests
    if (action === 'active' || !action) {
      const questType = type === 'daily' || type === 'weekly' ? type : undefined;
      const quests = await questService.getActiveQuests(userId, questType);
      return res.status(200).json(quests);
    }

    // Get quest progress
    if (action === 'progress' && questId && typeof questId === 'string') {
      const progress = await questService.getUserQuestProgress(userId, questId);
      return res.status(200).json(progress);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}

// POST /api/gamification/quests - Generate or complete quests
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Generate daily quests
    if (action === 'generateDaily') {
      const quests = await questService.generateDailyQuests(userId);
      return res.status(200).json(quests);
    }

    // Generate weekly quests
    if (action === 'generateWeekly') {
      const quests = await questService.generateWeeklyQuests(userId);
      return res.status(200).json(quests);
    }

    // Complete quest
    if (action === 'complete') {
      const { questId } = req.body;

      if (!questId) {
        return sendError(res, 400, 'Quest ID is required');
      }

      const reward = await questService.completeQuest(userId, questId);
      return res.status(200).json(reward);
    }

    // Claim quest reward
    if (action === 'claimReward') {
      const { questId } = req.body;

      if (!questId) {
        return sendError(res, 400, 'Quest ID is required');
      }

      const reward = await questService.completeQuest(userId, questId);
      return res.status(200).json({ success: true, reward });
    }

    // Check quest completion
    if (action === 'check') {
      const { eventType, value } = req.body;

      if (!eventType || value === undefined) {
        return sendError(res, 400, 'Event type and value are required');
      }

      const completedQuests = await questService.checkQuestCompletion(userId, eventType, value);
      return res.status(200).json(completedQuests);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'ALREADY_COMPLETED') {
      return sendError(res, 409, error.message);
    }
    if (error.code === 'REWARD_ALREADY_CLAIMED') {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
}

// PUT /api/gamification/quests - Update quest progress
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Update quest progress
    if (action === 'progress') {
      const { questId, progress } = req.body;

      if (!questId || progress === undefined) {
        return sendError(res, 400, 'Quest ID and progress are required');
      }

      const userQuest = await questService.updateQuestProgress(userId, questId, progress);
      return res.status(200).json(userQuest);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}
