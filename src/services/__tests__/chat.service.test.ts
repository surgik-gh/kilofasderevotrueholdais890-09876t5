import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '../chat.service';
import type { Chat, ChatMessage } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'not found' } 
      }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  };

  return {
    supabase: mockSupabase,
  };
});

describe('Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChat', () => {
    it('should create a chat with unique invitation code', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      // Mock successful chat creation
      const mockChat: Chat = {
        id: 'chat-1',
        name: 'Test Chat',
        type: 'public',
        school_id: null,
        invitation_code: 'ABC12345',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chats') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              callCount++;
              // First call is for checking invitation code uniqueness (should return not found)
              if (callCount === 1) {
                return Promise.resolve({ 
                  data: null, 
                  error: { code: 'PGRST116', message: 'not found' } 
                });
              }
              // Second call is for inserting the chat (should return the chat)
              return Promise.resolve({ 
                data: mockChat, 
                error: null 
              });
            }),
          } as any;
        }
        // For chat_memberships
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      const result = await chatService.createChat({
        name: 'Test Chat',
        type: 'public',
        createdBy: 'user-1',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Chat');
      expect(result.type).toBe('public');
      expect(result.invitation_code).toBeDefined();
    });

    it('should require name, type, and creator', async () => {
      await expect(
        chatService.createChat({
          name: '',
          type: 'public',
          createdBy: 'user-1',
        })
      ).rejects.toThrow();
    });

    it('should require school_id for school chats', async () => {
      await expect(
        chatService.createChat({
          name: 'School Chat',
          type: 'school_parent',
          createdBy: 'user-1',
        })
      ).rejects.toThrow('School ID is required');
    });
  });

  describe('joinChatByInvitation', () => {
    it('should join chat with valid invitation code', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      const mockChat: Chat = {
        id: 'chat-1',
        name: 'Test Chat',
        type: 'public',
        school_id: null,
        invitation_code: 'ABC12345',
        created_by: 'user-1',
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: mockChat, 
              error: null 
            }),
          } as any;
        }
        if (table === 'chat_memberships') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await chatService.joinChatByInvitation('ABC12345', 'user-2');
      expect(result).toBeDefined();
      expect(result.id).toBe('chat-1');
    });

    it('should reject invalid invitation code', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      // Mock chat not found
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'not found' } 
        }),
      } as any);

      await expect(
        chatService.joinChatByInvitation('INVALID', 'user-1')
      ).rejects.toThrow('Chat not found');
    });
  });

  describe('searchChats', () => {
    it('should return public chats', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      const mockChats: Chat[] = [
        {
          id: 'chat-1',
          name: 'Public Chat 1',
          type: 'public',
          school_id: null,
          invitation_code: 'ABC12345',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: mockChats, 
          error: null 
        }),
      } as any);

      const result = await chatService.searchChats();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by query', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        }),
      } as any);

      const result = await chatService.searchChats('test');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('should send message to chat', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      const mockMessage: ChatMessage = {
        id: 'msg-1',
        chat_id: 'chat-1',
        sender_id: 'user-1',
        content: 'Hello',
        sent_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'chat_memberships') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { id: 'membership-1' }, 
              error: null 
            }),
          } as any;
        }
        if (table === 'chat_messages') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: mockMessage, 
              error: null 
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await chatService.sendMessage('chat-1', 'user-1', 'Hello');
      expect(result).toBeDefined();
      expect(result.content).toBe('Hello');
    });

    it('should reject empty messages', async () => {
      await expect(
        chatService.sendMessage('chat-1', 'user-1', '   ')
      ).rejects.toThrow('empty');
    });
  });

  describe('subscribeToMessages', () => {
    it('should set up real-time subscription', () => {
      const callback = vi.fn();
      const unsubscribe = chatService.subscribeToMessages('chat-1', callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Call unsubscribe
      unsubscribe();
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages for a chat', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          chat_id: 'chat-1',
          sender_id: 'user-1',
          content: 'Hello',
          sent_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ 
          data: mockMessages, 
          error: null 
        }),
      } as any);

      const result = await chatService.getMessages('chat-1');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should support message limit', async () => {
      const { supabase } = await import('../../lib/supabase');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        }),
      } as any);

      const result = await chatService.getMessages('chat-1', 10);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
