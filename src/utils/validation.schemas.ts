/**
 * Zod Validation Schemas for API Endpoints
 * Server-side validation using Zod
 * Requirements: 14.1
 */

import { z } from 'zod';

// User Registration Schema
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long'),
  role: z.enum(['student', 'parent', 'teacher'], {
    errorMap: () => ({ message: 'Role must be student, parent, or teacher' })
  }),
  grade: z.string()
    .regex(/^(1|2|3|4|5|6|7|8|9|10|11|техникум|ВУЗ)$/, 'Invalid grade')
    .optional(),
  grade_letter: z.string()
    .max(2, 'Grade letter is too long')
    .optional()
}).refine(
  (data) => {
    // If role is student, grade is required
    if (data.role === 'student') {
      return !!data.grade;
    }
    return true;
  },
  {
    message: 'Grade is required for students',
    path: ['grade']
  }
);

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Connection Request Schema
export const connectionRequestSchema = z.object({
  from_user_id: z.string().uuid('Invalid user ID'),
  to_user_id: z.string().uuid('Invalid user ID'),
  request_type: z.enum(['parent_child', 'teacher_school', 'student_school'], {
    errorMap: () => ({ message: 'Invalid connection request type' })
  }),
  message: z.string().max(500, 'Message is too long').optional()
}).refine(
  (data) => data.from_user_id !== data.to_user_id,
  {
    message: 'Cannot send connection request to yourself',
    path: ['to_user_id']
  }
);

// Accept/Reject Connection Request Schema
export const connectionRequestActionSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  user_id: z.string().uuid('Invalid user ID')
});

// AI Chat Message Schema
export const chatMessageSchema = z.object({
  session_id: z.string().uuid('Invalid session ID').optional(),
  user_id: z.string().uuid('Invalid user ID'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long')
});

// Create AI Chat Session Schema
export const createChatSessionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  title: z.string().max(200, 'Title is too long').optional()
});

// Learning Roadmap Request Schema
export const roadmapRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  subject: z.enum([
    'Русский',
    'Английский',
    'Математика',
    'Геометрия',
    'Физика',
    'Химия',
    'Биология',
    'История',
    'Обществознание',
    'Информатика',
    'Французский',
    'Немецкий',
    'Итальянский',
    'Корейский',
    'Китайский',
    'Японский'
  ], {
    errorMap: () => ({ message: 'Invalid subject' })
  })
});

// Update Roadmap Progress Schema
export const updateRoadmapProgressSchema = z.object({
  roadmap_id: z.string().uuid('Invalid roadmap ID'),
  student_id: z.string().uuid('Invalid student ID'),
  completed_topics: z.array(z.string()).optional(),
  current_topic: z.string().optional()
});

// Quiz Generation Schema
export const quizGenerationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject is too long'),
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic is too long'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' })
  }),
  grade: z.string().regex(/^(1|2|3|4|5|6|7|8|9|10|11|техникум|ВУЗ)$/, 'Invalid grade'),
  num_questions: z.number()
    .int('Number of questions must be an integer')
    .min(5, 'Must generate at least 5 questions')
    .max(10, 'Cannot generate more than 10 questions')
    .default(5)
});

// Quiz Submission Schema
export const quizSubmissionSchema = z.object({
  quiz_id: z.string().uuid('Invalid quiz ID'),
  student_id: z.string().uuid('Invalid student ID'),
  answers: z.record(z.string(), z.any()),
  time_taken: z.number().int().min(0, 'Time taken cannot be negative').optional()
});

// Assessment Quiz Submission Schema
export const assessmentSubmissionSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  answers: z.record(z.string(), z.object({
    subject: z.string(),
    question_id: z.string(),
    answer: z.any(),
    correct: z.boolean()
  }))
});

// Notification Schema
export const notificationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
  data: z.any().optional()
});

// Mark Notification as Read Schema
export const markNotificationReadSchema = z.object({
  notification_id: z.string().uuid('Invalid notification ID'),
  user_id: z.string().uuid('Invalid user ID')
});

// Admin User Management Schema
export const adminUpdateUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  admin_id: z.string().uuid('Invalid admin ID'),
  updates: z.object({
    full_name: z.string().min(2).max(100).optional(),
    role: z.enum(['student', 'parent', 'teacher', 'administrator']).optional(),
    wisdom_coins: z.number().int().min(0).max(1000000).optional(),
    is_blocked: z.boolean().optional()
  })
});

// Admin School Management Schema
export const adminSchoolSchema = z.object({
  admin_id: z.string().uuid('Invalid admin ID'),
  school_data: z.object({
    name: z.string().min(2, 'School name must be at least 2 characters').max(200, 'School name is too long'),
    address: z.string().max(500, 'Address is too long').optional(),
    contact_email: z.string().email('Invalid email format').optional(),
    contact_phone: z.string().max(20, 'Phone is too long').optional()
  })
});

// Admin Content Moderation Schema
export const adminModerationSchema = z.object({
  admin_id: z.string().uuid('Invalid admin ID'),
  content_id: z.string().uuid('Invalid content ID'),
  content_type: z.enum(['lesson', 'quiz', 'chat_message'], {
    errorMap: () => ({ message: 'Invalid content type' })
  }),
  action: z.enum(['approve', 'reject', 'delete'], {
    errorMap: () => ({ message: 'Invalid moderation action' })
  }),
  reason: z.string().max(500, 'Reason is too long').optional()
});

// Wisdom Coins Transaction Schema
export const wisdomCoinsTransactionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  amount: z.number().int('Amount must be an integer'),
  transaction_type: z.enum(['earn', 'spend', 'admin_grant', 'admin_deduct'], {
    errorMap: () => ({ message: 'Invalid transaction type' })
  }),
  description: z.string().max(200, 'Description is too long').optional()
}).refine(
  (data) => {
    // Spending and admin deductions must be negative
    if (data.transaction_type === 'spend' || data.transaction_type === 'admin_deduct') {
      return data.amount < 0;
    }
    // Earning and admin grants must be positive
    if (data.transaction_type === 'earn' || data.transaction_type === 'admin_grant') {
      return data.amount > 0;
    }
    return true;
  },
  {
    message: 'Invalid amount for transaction type',
    path: ['amount']
  }
);

// Support Ticket Schema
export const supportTicketSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' })
  }).default('medium')
});

// Support Ticket Response Schema
export const supportTicketResponseSchema = z.object({
  ticket_id: z.string().uuid('Invalid ticket ID'),
  admin_id: z.string().uuid('Invalid admin ID'),
  message: z.string().min(1, 'Response message is required').max(2000, 'Response is too long')
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20)
});

// Search Schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Search query is too long'),
  filters: z.record(z.string(), z.any()).optional()
}).merge(paginationSchema);

// Helper function to validate request body
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Helper function to create validation middleware
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return schema.parse(data);
  };
}

// Export all schemas
export const ValidationSchemas = {
  register: registerSchema,
  login: loginSchema,
  connectionRequest: connectionRequestSchema,
  connectionRequestAction: connectionRequestActionSchema,
  chatMessage: chatMessageSchema,
  createChatSession: createChatSessionSchema,
  roadmapRequest: roadmapRequestSchema,
  updateRoadmapProgress: updateRoadmapProgressSchema,
  quizGeneration: quizGenerationSchema,
  quizSubmission: quizSubmissionSchema,
  assessmentSubmission: assessmentSubmissionSchema,
  notification: notificationSchema,
  markNotificationRead: markNotificationReadSchema,
  adminUpdateUser: adminUpdateUserSchema,
  adminSchool: adminSchoolSchema,
  adminModeration: adminModerationSchema,
  wisdomCoinsTransaction: wisdomCoinsTransactionSchema,
  supportTicket: supportTicketSchema,
  supportTicketResponse: supportTicketResponseSchema,
  pagination: paginationSchema,
  search: searchSchema
};
