/**
 * Support API Route
 * Handles support ticket operations
 * 
 * Vercel Serverless Function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supportTicketService } from '../../src/services/support.service';
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

// Helper to get user profile
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
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
    console.error('Support API error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}

// GET /api/support - Get tickets or messages
async function handleGet(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id, all, messages, status, priority } = req.query;

  try {
    // Get specific ticket
    if (id && typeof id === 'string') {
      const ticket = await supportTicketService.getTicket(id);
      
      if (!ticket) {
        return sendError(res, 404, 'Ticket not found');
      }

      return res.status(200).json(ticket);
    }

    // Get ticket messages
    if (messages && typeof messages === 'string') {
      const ticketMessages = await supportTicketService.getTicketMessages(messages);
      return res.status(200).json(ticketMessages);
    }

    // Get all tickets (admin only)
    if (all === 'true') {
      const profile = await getUserProfile(userId);
      
      if (!profile || profile.role !== 'administrator') {
        return sendError(res, 403, 'Only administrators can view all tickets');
      }

      const filters: any = {};
      if (status && typeof status === 'string') {
        filters.status = status;
      }
      if (priority && typeof priority === 'string') {
        filters.priority = priority;
      }

      const tickets = await supportTicketService.getAllTickets(filters);
      return res.status(200).json(tickets);
    }

    // Get user's own tickets
    const tickets = await supportTicketService.getUserTickets(userId);
    return res.status(200).json(tickets);
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    if (error.code === 'ACCESS_DENIED') {
      return sendError(res, 403, error.message);
    }
    throw error;
  }
}

// POST /api/support - Create ticket or send message
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string) {
  const { action } = req.query;

  try {
    // Send message to ticket
    if (action === 'message') {
      const { ticketId, message } = req.body;

      if (!ticketId || !message) {
        return sendError(res, 400, 'Ticket ID and message are required');
      }

      const ticketMessage = await supportTicketService.sendTicketMessage(ticketId, userId, message);
      return res.status(201).json(ticketMessage);
    }

    // Create new ticket
    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return sendError(res, 400, 'Subject and description are required');
    }

    const ticket = await supportTicketService.createTicket(userId, {
      subject,
      description,
      priority: priority || 'medium',
    });

    return res.status(201).json(ticket);
  } catch (error: any) {
    if (error.code === 'MISSING_FIELDS' || error.code === 'INVALID_SUBJECT' || error.code === 'INVALID_DESCRIPTION' || error.code === 'INVALID_PRIORITY') {
      return sendError(res, 400, error.message);
    }
    if (error.code === 'EMPTY_MESSAGE' || error.code === 'MESSAGE_TOO_LONG') {
      return sendError(res, 400, error.message);
    }
    throw error;
  }
}

// PUT /api/support - Update ticket status (admin only)
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'Ticket ID is required');
  }

  try {
    // Check if user is administrator
    const profile = await getUserProfile(userId);
    
    if (!profile || profile.role !== 'administrator') {
      return sendError(res, 403, 'Only administrators can update ticket status');
    }

    const { status } = req.body;

    if (!status) {
      return sendError(res, 400, 'Status is required');
    }

    const ticket = await supportTicketService.updateTicketStatus(id, status);
    return res.status(200).json(ticket);
  } catch (error: any) {
    if (error.code === 'INVALID_STATUS') {
      return sendError(res, 400, error.message);
    }
    if (error.code === 'NOT_FOUND') {
      return sendError(res, 404, error.message);
    }
    throw error;
  }
}
