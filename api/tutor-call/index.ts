/**
 * Tutor Call API Route
 * Handles tutor call operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.error('Tutor Call API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/tutor-call - Get call history or affordability check
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action, limit } = req.query;

  try {
    // Check affordability
    if (action === 'check-affordability') {
      // Get user balance
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('wisdom_coins, subscription_tier')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return sendError(res, 404, 'User profile not found');
      }

      const COINS_PER_MINUTE = 10;
      const MIN_DURATION = 5;
      const MIN_COST = COINS_PER_MINUTE * MIN_DURATION;

      // Calculate discount based on subscription tier
      const discounts: Record<string, number> = {
        student_freemium: 0,
        student_promium: 0.1,
        student_premium: 0.2,
        student_legend: 0.3,
        teacher_freemium: 0.1,
        teacher_promium: 0.15,
        teacher_premium: 0.25,
        teacher_maxi: 0.3,
      };

      const discount = discounts[profile.subscription_tier] || 0;
      const discountedCost = Math.ceil(MIN_COST * (1 - discount));

      return res.status(200).json({
        canAfford: profile.wisdom_coins >= discountedCost,
        currentBalance: profile.wisdom_coins,
        minCost: MIN_COST,
        discountedCost,
        discount: discount * 100,
      });
    }

    // Get call history
    const historyLimit = limit ? parseInt(limit as string) : 20;

    const { data: history, error: historyError } = await supabase
      .from('tutor_call_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(historyLimit);

    if (historyError) {
      throw historyError;
    }

    return res.status(200).json(history || []);
  } catch (error: any) {
    console.error('GET error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch data');
  }
}

// POST /api/tutor-call - Start a new call
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { subject } = req.body;

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('wisdom_coins, subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return sendError(res, 404, 'User profile not found');
    }

    // Check affordability
    const COINS_PER_MINUTE = 10;
    const MIN_DURATION = 5;
    const MIN_COST = COINS_PER_MINUTE * MIN_DURATION;

    const discounts: Record<string, number> = {
      student_freemium: 0,
      student_promium: 0.1,
      student_premium: 0.2,
      student_legend: 0.3,
      teacher_freemium: 0.1,
      teacher_promium: 0.15,
      teacher_premium: 0.25,
      teacher_maxi: 0.3,
    };

    const discount = discounts[profile.subscription_tier] || 0;
    const discountedCost = Math.ceil(MIN_COST * (1 - discount));

    if (profile.wisdom_coins < discountedCost) {
      return sendError(
        res,
        400,
        `Insufficient balance. Need ${discountedCost} coins, have ${profile.wisdom_coins}`
      );
    }

    // Create call session
    const { data: session, error: sessionError } = await supabase
      .from('tutor_call_sessions')
      .insert({
        user_id: userId,
        subject: subject || null,
        started_at: new Date().toISOString(),
        duration_seconds: 0,
        coins_charged: 0,
        status: 'active',
      })
      .select()
      .single();

    if (sessionError || !session) {
      return sendError(res, 500, 'Failed to create call session');
    }

    return res.status(201).json(session);
  } catch (error: any) {
    console.error('POST error:', error);
    return sendError(res, 500, error.message || 'Failed to start call');
  }
}

// PUT /api/tutor-call - Update/end a call
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { sessionId, action, durationSeconds, coinsCharged } = req.body;

  if (!sessionId) {
    return sendError(res, 400, 'Session ID is required');
  }

  try {
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('tutor_call_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return sendError(res, 404, 'Call session not found');
    }

    if (action === 'end') {
      // End the call
      const { data: updatedSession, error: updateError } = await supabase
        .from('tutor_call_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds || session.duration_seconds,
          coins_charged: coinsCharged || session.coins_charged,
          status: 'completed',
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError || !updatedSession) {
        return sendError(res, 500, 'Failed to end call session');
      }

      return res.status(200).json(updatedSession);
    }

    // Update call progress
    const { data: updatedSession, error: updateError } = await supabase
      .from('tutor_call_sessions')
      .update({
        duration_seconds: durationSeconds || session.duration_seconds,
        coins_charged: coinsCharged || session.coins_charged,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError || !updatedSession) {
      return sendError(res, 500, 'Failed to update call session');
    }

    return res.status(200).json(updatedSession);
  } catch (error: any) {
    console.error('PUT error:', error);
    return sendError(res, 500, error.message || 'Failed to update call');
  }
}
