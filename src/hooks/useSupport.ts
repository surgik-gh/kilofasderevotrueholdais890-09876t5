import { useEffect } from 'react';
import { useStore } from '../store';
import { supportTicketService } from '../services/support.service';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for support ticket operations
 */
export function useSupport() {
  const {
    profile,
    tickets,
    activeTicket,
    ticketMessages,
    setTickets,
    addTicket,
    updateTicket,
    setActiveTicket,
    setTicketMessages,
    addTicketMessage,
    setLoading,
  } = useStore();

  // Load tickets
  useEffect(() => {
    if (!isSupabaseConfigured() || !profile) return;

    loadTickets();
  }, [profile?.id]);

  // Load messages for active ticket
  useEffect(() => {
    if (!isSupabaseConfigured() || !activeTicket) return;

    loadTicketMessages(activeTicket.id);
  }, [activeTicket?.id]);

  const loadTickets = async () => {
    if (!profile) return;

    try {
      if (profile.role === 'administrator') {
        // Load all tickets for admins
        const allTickets = await supportTicketService.getAllTickets();
        setTickets(allTickets);
      } else {
        // Load user's tickets
        const userTickets = await supportTicketService.getUserTickets(profile.id);
        setTickets(userTickets);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadTicketMessages = async (ticketId: string) => {
    try {
      const messages = await supportTicketService.getTicketMessages(ticketId);
      setTicketMessages(ticketId, messages);
    } catch (error) {
      console.error('Failed to load ticket messages:', error);
    }
  };

  const createTicket = async (data: {
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    if (!profile) throw new Error('Not authenticated');

    setLoading(true);
    try {
      const ticket = await supportTicketService.createTicket({
        user_id: profile.id,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'medium',
      });

      addTicket(ticket);
      return ticket;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    if (!profile || profile.role !== 'administrator') {
      throw new Error('Only administrators can update ticket status');
    }

    // Optimistic update
    updateTicket(ticketId, { status });

    try {
      const updated = await supportTicketService.updateTicketStatus(ticketId, status);
      updateTicket(ticketId, updated);
      return updated;
    } catch (error) {
      // Reload on error to revert
      await loadTickets();
      throw error;
    }
  };

  const sendMessage = async (ticketId: string, message: string) => {
    if (!profile) throw new Error('Not authenticated');

    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: profile.id,
      message,
      sent_at: new Date().toISOString(),
    };
    addTicketMessage(ticketId, tempMessage);

    try {
      const sentMessage = await supportTicketService.sendTicketMessage(ticketId, profile.id, message);
      // Replace temp message with real one
      const messages = ticketMessages[ticketId] || [];
      const updatedMessages = messages.map(m => m.id === tempMessage.id ? sentMessage : m);
      setTicketMessages(ticketId, updatedMessages);
      return sentMessage;
    } catch (error) {
      // Remove temp message on error
      const messages = ticketMessages[ticketId] || [];
      const updatedMessages = messages.filter(m => m.id !== tempMessage.id);
      setTicketMessages(ticketId, updatedMessages);
      throw error;
    }
  };

  const getTicket = async (ticketId: string) => {
    try {
      return await supportTicketService.getTicket(ticketId);
    } catch (error) {
      console.error('Failed to get ticket:', error);
      throw error;
    }
  };

  return {
    tickets,
    activeTicket,
    ticketMessages: activeTicket ? ticketMessages[activeTicket.id] || [] : [],
    setActiveTicket,
    createTicket,
    updateTicketStatus,
    sendMessage,
    getTicket,
    refreshTickets: loadTickets,
  };
}
