/**
 * Lessons API Route
 * Handles lesson CRUD operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { lessonService } from '../../src/services/lesson.service';
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
    console.error('Lessons API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/lessons - Get lessons
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id, creator, subject, assigned, schoolId } = req.query;

  try {
    // Get specific lesson by ID
    if (id && typeof id === 'string') {
      const lesson = await lessonService.getLesson(id);
      return res.status(200).json(lesson);
    }

    // Get lessons by creator
    if (creator && typeof creator === 'string') {
      const lessons = await lessonService.getLessonsByCreator(creator);
      return res.status(200).json(lessons);
    }

    // Get lessons by subject
    if (subject && typeof subject === 'string') {
      const lessons = await lessonService.getLessonsBySubject(
        subject as any,
        typeof schoolId === 'string' ? schoolId : undefined
      );
      return res.status(200).json(lessons);
    }

    // Get assigned lessons for student
    if (assigned === 'true') {
      const lessons = await lessonService.getAssignedLessons(userId);
      return res.status(200).json(lessons);
    }

    // Get user's own lessons
    const lessons = await lessonService.getLessonsByCreator(userId);
    return res.status(200).json(lessons);
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

// POST /api/lessons - Create lesson or assign lesson
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Assign lesson to students
    if (action === 'assign') {
      const { lessonId, studentIds } = req.body;
      
      if (!lessonId || !studentIds || !Array.isArray(studentIds)) {
        return sendError(res, 400, 'Lesson ID and student IDs are required');
      }

      await lessonService.assignLessonToStudents(lessonId, studentIds, userId);
      return res.status(200).json({ success: true });
    }

    // Create new lesson
    const { title, subject, content, creatorRole, schoolId, attachments } = req.body;

    if (!title || !subject || !content || !creatorRole) {
      return sendError(res, 400, 'Title, subject, content, and creator role are required');
    }

    const lesson = await lessonService.createLesson({
      title,
      subject,
      content,
      creatorId: userId,
      creatorRole,
      schoolId: schoolId || null,
      attachments: attachments || [],
    });

    return res.status(201).json(lesson);
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      return sendError(res, 402, error.message);
    }
    if (error.code === 'INVALID_SUBJECT') {
      return sendError(res, 400, error.message);
    }
    if (error.code === 'UNAUTHORIZED') {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
}

// PUT /api/lessons - Update lesson
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'Lesson ID is required');
  }

  try {
    const { title, subject, content } = req.body;

    const lesson = await lessonService.updateLesson(id, { title, subject, content }, userId);
    return res.status(200).json(lesson);
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

// DELETE /api/lessons - Delete lesson
async function handleDelete(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'Lesson ID is required');
  }

  try {
    await lessonService.deleteLesson(id, userId);
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
