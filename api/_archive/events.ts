/**
 * Seasonal Events API Route
 * Handles seasonal event operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { seasonalEventService } from '../../src/services/gamification/seasonal-event.service';
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
    console.error('Seasonal Events API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/events - Get seasonal events
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, eventId } = req.query;

  try {
    // Get active event
    if (action === 'active' || !action) {
      const event = await seasonalEventService.getActiveEvent();
      return res.status(200).json(event);
    }

    // Get all events
    if (action === 'all') {
      const events = await seasonalEventService.getAllEvents();
      return res.status(200).json(events);
    }

    // Get user event progress
    if (action === 'progress' && eventId && typeof eventId === 'string') {
      const progress = await seasonalEventService.getUserEventProgress(userId, eventId);
      return res.status(200).json(progress);
    }

    // Get event leaderboard
    if (action === 'leaderboard' && eventId && typeof eventId === 'string') {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const leaderboard = await seasonalEventService.getEventLeaderboard(eventId, limit);
      return res.status(200).json(leaderboard);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}

// POST /api/gamification/events - Add points or claim rewards
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Add seasonal points
    if (action === 'addPoints') {
      const { eventId, points } = req.body;

      if (!eventId || points === undefined) {
        return sendError(res, 400, 'Event ID and points are required');
      }

      await seasonalEventService.addSeasonalPoints(userId, eventId, points);
      return res.status(200).json({ success: true });
    }

    // Claim event rewards
    if (action === 'claimRewards') {
      const { eventId } = req.body;

      if (!eventId) {
        return sendError(res, 400, 'Event ID is required');
      }

      const rewards = await seasonalEventService.claimEventRewards(userId, eventId);
      return res.status(200).json(rewards);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'EVENT_NOT_ACTIVE') {
      return sendError(res, 400, error.message);
    }
    if (error.code === 'REWARDS_ALREADY_CLAIMED') {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
}
