/**
 * Quizzes API Route
 * Handles quiz CRUD operations and quiz attempts
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { quizService } from '../../src/services/quiz.service';
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
    console.error('Quizzes API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/quizzes - Get quiz or quiz attempts
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id, lessonId, attempts } = req.query;

  try {
    // Get quiz by ID
    if (id && typeof id === 'string') {
      const quiz = await quizService.getQuiz(id);
      return res.status(200).json(quiz);
    }

    // Get quiz by lesson ID
    if (lessonId && typeof lessonId === 'string') {
      const quiz = await quizService.getQuizByLessonId(lessonId);
      return res.status(200).json(quiz);
    }

    // Get quiz attempts
    if (attempts && typeof attempts === 'string') {
      const quizAttempts = await quizService.getQuizAttempts(attempts, userId);
      return res.status(200).json(quizAttempts);
    }

    return sendError(res, 400, 'Quiz ID, lesson ID, or attempts parameter is required');
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

// POST /api/quizzes - Create quiz or submit attempt
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Submit quiz attempt
    if (action === 'attempt') {
      const { quizId, answers } = req.body;

      if (!quizId || !answers || !Array.isArray(answers)) {
        return sendError(res, 400, 'Quiz ID and answers are required');
      }

      const attempt = await quizService.submitQuizAttempt({
        quizId,
        studentId: userId,
        answers,
      });

      return res.status(201).json(attempt);
    }

    // Check if can create quiz
    if (action === 'canCreate') {
      const { lessonId } = req.body;

      if (!lessonId) {
        return sendError(res, 400, 'Lesson ID is required');
      }

      const canCreate = await quizService.canCreateQuiz(lessonId);
      return res.status(200).json({ canCreate });
    }

    // Check if can attempt quiz
    if (action === 'canAttempt') {
      const { quizId } = req.body;

      if (!quizId) {
        return sendError(res, 400, 'Quiz ID is required');
      }

      const canAttempt = await quizService.canAttemptQuiz(quizId, userId);
      return res.status(200).json({ canAttempt });
    }

    // Create new quiz
    const { lessonId, title, questions } = req.body;

    if (!lessonId || !title || !questions || !Array.isArray(questions)) {
      return sendError(res, 400, 'Lesson ID, title, and questions are required');
    }

    const quiz = await quizService.createQuiz({
      lessonId,
      title,
      questions,
      createdBy: userId,
    });

    return res.status(201).json(quiz);
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      return sendError(res, 402, error.message);
    }
    if (error.code === 'QUIZ_EXISTS') {
      return sendError(res, 409, error.message);
    }
    if (error.code === 'ATTEMPT_LIMIT_EXCEEDED') {
      return sendError(res, 403, error.message);
    }
    if (error.code === 'INVALID_QUESTIONS' || error.code === 'INVALID_QUESTION' || error.code === 'INVALID_ANSWER') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
}
