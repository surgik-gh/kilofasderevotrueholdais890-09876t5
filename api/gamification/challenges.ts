/**
 * Challenges API Route
 * Handles challenge operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { challengeService } from '../../src/services/gamification/challenge.service';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
      
      case 'DELETE':
        return await handleDelete(req, res, user.id);
      
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Challenges API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/challenges - Get challenges
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, challengeId } = req.query;

  try {
    // Get specific challenge
    if (action === 'get' && challengeId && typeof challengeId === 'string') {
      const challenge = await challengeService.getChallenge(challengeId);
      return res.status(200).json(challenge);
    }

    // Get user challenges
    if (action === 'user' || !action) {
      const challenges = await challengeService.getUserChallenges(userId);
      return res.status(200).json(challenges);
    }

    // Get challenge leaderboard
    if (action === 'leaderboard' && challengeId && typeof challengeId === 'string') {
      const leaderboard = await challengeService.getChallengeLeaderboard(challengeId);
      return res.status(200).json(leaderboard);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'UNAUTHORIZED') {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
}

// POST /api/gamification/challenges - Create or manage challenges
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Create challenge
    if (action === 'create') {
      const { title, description, challengeType, targetValue, startDate, endDate, rewardCoins, rewardXp } = req.body;

      if (!title || !description || !challengeType || !targetValue || !startDate || !endDate || !rewardCoins || !rewardXp) {
        return sendError(res, 400, 'All challenge fields are required');
      }

      const challenge = await challengeService.createChallenge({
        creator_id: userId,
        title,
        description,
        challenge_type: challengeType,
        target_value: targetValue,
        start_date: startDate,
        end_date: endDate,
        reward_coins: rewardCoins,
        reward_xp: rewardXp,
        status: 'pending',
        winner_id: null,
      });

      return res.status(201).json(challenge);
    }

    // Invite to challenge
    if (action === 'invite') {
      const { challengeId, userIds } = req.body;

      if (!challengeId || !userIds || !Array.isArray(userIds)) {
        return sendError(res, 400, 'Challenge ID and user IDs are required');
      }

      await challengeService.inviteToChallenge(challengeId, userIds);
      return res.status(200).json({ success: true });
    }

    // Accept challenge
    if (action === 'accept') {
      const { challengeId } = req.body;

      if (!challengeId) {
        return sendError(res, 400, 'Challenge ID is required');
      }

      await challengeService.acceptChallenge(challengeId, userId);
      return res.status(200).json({ success: true });
    }

    // Decline challenge
    if (action === 'decline') {
      const { challengeId } = req.body;

      if (!challengeId) {
        return sendError(res, 400, 'Challenge ID is required');
      }

      await challengeService.declineChallenge(challengeId, userId);
      return res.status(200).json({ success: true });
    }

    // Complete challenge
    if (action === 'complete') {
      const { challengeId } = req.body;

      if (!challengeId) {
        return sendError(res, 400, 'Challenge ID is required');
      }

      const result = await challengeService.completeChallenge(challengeId);
      return res.status(200).json(result);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'UNAUTHORIZED') {
      return sendError(res, 403, error.message);
    }
    if (error.code === 'ALREADY_INVITED') {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
}

// PUT /api/gamification/challenges - Update challenge progress
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Update challenge progress
    if (action === 'progress') {
      const { challengeId, progress } = req.body;

      if (!challengeId || progress === undefined) {
        return sendError(res, 400, 'Challenge ID and progress are required');
      }

      await challengeService.updateChallengeProgress(challengeId, userId, progress);
      return res.status(200).json({ success: true });
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'NOT_PARTICIPANT') {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
}

// DELETE /api/gamification/challenges - Cancel challenge
async function handleDelete(req: VercelRequest, res: VercelResponse, userId: string) {
  const { challengeId } = req.query;

  if (!challengeId || typeof challengeId !== 'string') {
    return sendError(res, 400, 'Challenge ID is required');
  }

  try {
    await challengeService.cancelChallenge(challengeId);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'UNAUTHORIZED') {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
}
