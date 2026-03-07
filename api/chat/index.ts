/**
 * Chat API Route
 * Handles chat operations and messaging
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatService } from '../../src/services/chat.service';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
      
      case 'DELETE':
        return await handleDelete(req, res, user.id);
      
      default:
        return sendError(res, 405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/chat - Get chats, messages, or members
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id, search, messages, members, userChats } = req.query;

  try {
    // Get specific chat by ID
    if (id && typeof id === 'string') {
      const chat = await chatService.getChat(id);
      return res.status(200).json(chat);
    }

    // Search public chats
    if (search !== undefined) {
      const query = typeof search === 'string' ? search : undefined;
      const chats = await chatService.searchChats(query);
      return res.status(200).json(chats);
    }

    // Get messages for a chat
    if (messages && typeof messages === 'string') {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const chatMessages = await chatService.getMessages(messages, limit);
      return res.status(200).json(chatMessages);
    }

    // Get members of a chat
    if (members && typeof members === 'string') {
      const chatMembers = await chatService.getChatMembers(members);
      return res.status(200).json(chatMembers);
    }

    // Get user's chats
    if (userChats === 'true') {
      const chats = await chatService.getUserChats(userId);
      return res.status(200).json(chats);
    }

    return sendError(res, 400, 'Invalid query parameters');
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

// POST /api/chat - Create chat, join chat, or send message
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Join chat by invitation code
    if (action === 'join') {
      const { invitationCode } = req.body;

      if (!invitationCode) {
        return sendError(res, 400, 'Invitation code is required');
      }

      const chat = await chatService.joinChatByInvitation(invitationCode, userId);
      return res.status(200).json(chat);
    }

    // Send message to chat
    if (action === 'message') {
      const { chatId, content } = req.body;

      if (!chatId || !content) {
        return sendError(res, 400, 'Chat ID and content are required');
      }

      const message = await chatService.sendMessage(chatId, userId, content);
      return res.status(201).json(message);
    }

    // Create new chat
    const { name, type, schoolId } = req.body;

    if (!name || !type) {
      return sendError(res, 400, 'Name and type are required');
    }

    const chat = await chatService.createChat({
      name,
      type,
      schoolId: schoolId || null,
      createdBy: userId,
    });

    return res.status(201).json(chat);
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'ALREADY_MEMBER') {
      return sendError(res, 409, error.message);
    }
    if (error.code === 'NOT_MEMBER') {
      return sendError(res, 403, error.message);
    }
    if (error.code === 'EMPTY_MESSAGE') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
}

// DELETE /api/chat - Leave chat
async function handleDelete(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'Chat ID is required');
  }

  try {
    await chatService.leaveChat(id, userId);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    if (error.code === 'NOT_MEMBER') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
}
