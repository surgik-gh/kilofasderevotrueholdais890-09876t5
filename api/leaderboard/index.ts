/**
 * Leaderboard API Route
 * Handles leaderboard queries and student rankings
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { leaderboardService } from '../../src/services/leaderboard.service';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
      
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/leaderboard - Get leaderboard data
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { date, rank, history, top, rankInfo } = req.query;

  try {
    // Get daily leaderboard
    if (date !== undefined) {
      const targetDate = typeof date === 'string' ? date : undefined;
      const leaderboard = await leaderboardService.getDailyLeaderboard(targetDate);
      return res.status(200).json(leaderboard);
    }

    // Get student rank
    if (rank === 'true') {
      const studentRank = await leaderboardService.getStudentRank(userId);
      return res.status(200).json({ rank: studentRank });
    }

    // Get student rank info
    if (rankInfo === 'true') {
      const info = await leaderboardService.getStudentRankInfo(userId);
      return res.status(200).json(info);
    }

    // Get student history
    if (history !== undefined) {
      const days = typeof history === 'string' ? parseInt(history) : 7;
      const studentHistory = await leaderboardService.getStudentHistory(userId, days);
      return res.status(200).json(studentHistory);
    }

    // Get top students
    if (top !== undefined) {
      const limit = typeof top === 'string' ? parseInt(top) : 10;
      const topStudents = await leaderboardService.getTopStudents(limit);
      return res.status(200).json(topStudents);
    }

    // Default: get today's leaderboard
    const leaderboard = await leaderboardService.getDailyLeaderboard();
    return res.status(200).json(leaderboard);
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
