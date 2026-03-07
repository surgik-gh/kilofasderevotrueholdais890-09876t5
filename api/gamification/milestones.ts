/**
 * Milestones API Route
 * Handles milestone operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { milestoneService } from '../../src/services/gamification/milestone.service';
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
    console.error('Milestones API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/gamification/milestones - Get milestones
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, category, milestoneId } = req.query;

  try {
    // Get all milestones
    if (action === 'all') {
      const milestones = await milestoneService.getAllMilestones();
      return res.status(200).json(milestones);
    }

    // Get user milestones
    if (action === 'user' || !action) {
      const userMilestones = await milestoneService.getUserMilestones(userId);
      return res.status(200).json(userMilestones);
    }

    // Get milestones by category
    if (action === 'category' && category && typeof category === 'string') {
      const milestones = await milestoneService.getMilestonesByCategory(category as any);
      return res.status(200).json(milestones);
    }

    // Get milestone progress
    if (action === 'progress' && milestoneId && typeof milestoneId === 'string') {
      const progress = await milestoneService.getMilestoneProgress(userId, milestoneId);
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

// POST /api/gamification/milestones - Check or achieve milestones
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Check milestones
    if (action === 'check') {
      const { category, value } = req.body;

      if (!category || value === undefined) {
        return sendError(res, 400, 'Category and value are required');
      }

      const achievedMilestones = await milestoneService.checkMilestones(userId, category, value);
      return res.status(200).json(achievedMilestones);
    }

    // Achieve milestone
    if (action === 'achieve') {
      const { milestoneId } = req.body;

      if (!milestoneId) {
        return sendError(res, 400, 'Milestone ID is required');
      }

      const reward = await milestoneService.achieveMilestone(userId, milestoneId);
      return res.status(200).json(reward);
    }

    return sendError(res, 400, 'Invalid action parameter');
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'ALREADY_ACHIEVED') {
      return sendError(res, 409, error.message);
    }
    throw error;
  }
}
