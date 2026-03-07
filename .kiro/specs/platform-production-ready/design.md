# Design Document

## Overview

Данный дизайн описывает архитектуру и реализацию полной production-ready версии платформы AILesson. Система будет включать:

- Полную интеграцию с Supabase (Auth, Database, Storage, Realtime)
- Систему связей между пользователями через запросы (родители-дети, учителя-школы)
- Сохранение истории AI-чатов в базе данных
- Интеллектуальную аналитику прогресса с рекомендациями
- Автоматическую генерацию образовательного контента через GPT-OSS-120B
- Полную панель администратора
- Универсальную навигацию на всех страницах
- Мобильную адаптацию и оптимизацию производительности

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Services   │      │
│  │              │  │              │  │              │      │
│  │ - Dashboard  │  │ - Sidebar    │  │ - Auth       │      │
│  │ - Admin      │  │ - Analytics  │  │ - AI Chat    │      │
│  │ - Profile    │  │ - Roadmap    │  │ - Analytics  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Database   │  │   Storage    │      │
│  │              │  │              │  │              │      │
│  │ - JWT        │  │ - PostgreSQL │  │ - Files      │      │
│  │ - RLS        │  │ - RLS        │  │ - Avatars    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Realtime   │  │   Functions  │                         │
│  │              │  │              │                         │
│  │ - Chats      │  │ - Cron Jobs  │                         │
│  │ - Notifs     │  │ - AI Gen     │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐                                            │
│  │ GPT-OSS-120B │  (AI Content Generation)                  │
│  └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **AI**: GPT-OSS-120B для генерации контента
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts для аналитики
- **Testing**: Vitest + React Testing Library



## Components and Interfaces

### Database Schema Extensions

Новые таблицы для расширения функционала:

```sql
-- Connection requests (запросы на привязку)
CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('parent_child', 'teacher_school', 'student_school')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI chat sessions
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI chat messages
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Learning roadmaps
CREATE TABLE learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content JSONB NOT NULL,
  progress JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment quiz results
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score_percentage NUMERIC(5,2) NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User grade info
ALTER TABLE user_profiles ADD COLUMN grade TEXT;
ALTER TABLE user_profiles ADD COLUMN grade_letter TEXT;
```

### TypeScript Interfaces

```typescript
// Connection Request
interface ConnectionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  request_type: 'parent_child' | 'teacher_school' | 'student_school';
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
}

// AI Chat Session
interface AIChatSession {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

// AI Chat Message
interface AIChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Learning Roadmap
interface LearningRoadmap {
  id: string;
  student_id: string;
  subject: string;
  content: RoadmapContent;
  progress: RoadmapProgress;
  created_at: string;
  updated_at: string;
}

interface RoadmapContent {
  topics: RoadmapTopic[];
  estimated_duration: string;
  difficulty_level: string;
}

interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  resources: string[];
  milestones: string[];
  order: number;
}

interface RoadmapProgress {
  completed_topics: string[];
  current_topic: string;
  completion_percentage: number;
}

// Notification
interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

// Assessment Result
interface AssessmentResult {
  id: string;
  student_id: string;
  subject: string;
  score_percentage: number;
  answers: any;
  created_at: string;
}

// Progress Analytics
interface ProgressAnalytics {
  student_id: string;
  overall_average: number;
  subject_scores: SubjectScore[];
  weak_subjects: string[];
  strong_subjects: string[];
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

interface SubjectScore {
  subject: string;
  average_score: number;
  attempts_count: number;
  last_attempt_date: string;
  trend: 'up' | 'down' | 'stable';
}
```



## Data Models

### User Registration Flow

```
1. User fills registration form
   ├─ Full name
   ├─ Email
   ├─ Password
   ├─ Role (student/parent/teacher)
   └─ Grade + Letter (if student)

2. System creates auth user (Supabase Auth)

3. System creates user profile
   └─ Sets initial wisdom_coins based on role
      ├─ Student: 50 coins
      ├─ Teacher: 150 coins
      ├─ Parent: 30 coins
      └─ Administrator: 1000 coins

4. IF role === 'student':
   ├─ System generates assessment quiz
   │  └─ 2 questions per subject
   │     └─ Subjects based on grade level
   ├─ Student completes assessment
   └─ System saves results to assessment_results
```

### Connection Request Flow

```
Parent → Student Connection:
1. Parent enters student ID
2. System creates connection_request (type: parent_child, status: pending)
3. System sends notification to student
4. Student reviews request
5. IF accepted:
   ├─ System creates parent_child_links entry
   ├─ System updates connection_request (status: accepted)
   └─ System sends confirmation notification
6. IF rejected:
   └─ System updates connection_request (status: rejected)

Teacher → School Connection:
1. Teacher enters school ID
2. System creates connection_request (type: teacher_school, status: pending)
3. System sends notification to school administrators
4. School admin reviews request
5. IF accepted:
   ├─ System creates school_memberships entry
   ├─ System updates connection_request (status: accepted)
   └─ System sends confirmation notification

School → Student Connection:
1. School admin enters student ID
2. System creates connection_request (type: student_school, status: pending)
3. System sends notification to student
4. Student reviews request
5. IF accepted:
   ├─ System creates school_memberships entry
   ├─ IF student has parents:
   │  └─ System auto-links parents to school
   ├─ System updates connection_request (status: accepted)
   └─ System sends confirmation notification
```

### AI Chat Storage Flow

```
1. User opens AI Chat page
   └─ System loads existing sessions for user

2. User starts new chat OR selects existing session
   └─ IF new: System creates ai_chat_sessions entry

3. User sends message
   ├─ System saves message to ai_chat_messages (role: user)
   ├─ System sends request to GPT-OSS-120B
   ├─ AI responds
   └─ System saves response to ai_chat_messages (role: assistant)

4. All messages displayed from database
   └─ Real-time updates via Supabase Realtime
```

### Learning Roadmap Generation Flow

```
1. Student requests roadmap for subject
   └─ System checks wisdom_coins >= 4

2. IF insufficient coins:
   └─ Return error message

3. IF sufficient coins:
   ├─ System deducts 4 wisdom_coins
   ├─ System fetches assessment_results for subject
   ├─ System fetches quiz_attempts for subject
   ├─ System prepares context for AI:
   │  ├─ Student grade level
   │  ├─ Assessment scores
   │  ├─ Recent quiz performance
   │  └─ Weak topics identified
   ├─ System calls GPT-OSS-120B with prompt:
   │  "Generate a personalized learning roadmap for [subject]
   │   at grade [X] level. Student's current performance: [data].
   │   Include 5-8 topics in logical order with resources and milestones."
   ├─ System parses AI response into structured format
   ├─ System saves to learning_roadmaps table
   └─ System returns roadmap to user
```

### Progress Analytics Calculation

```
Algorithm for calculating progress analytics:

1. Fetch all quiz_attempts for student
2. Group by subject
3. For each subject:
   ├─ Calculate average_score
   ├─ Count attempts
   ├─ Determine trend (compare recent vs older attempts)
   └─ Classify as weak/strong:
      ├─ Weak: average < 60%
      └─ Strong: average > 80%

4. Calculate overall_average across all subjects

5. Generate recommendations:
   ├─ For weak subjects: "Focus on [subject] - current score: [X]%"
   ├─ For improving subjects: "Keep up the good work in [subject]!"
   └─ For declining subjects: "Review fundamentals in [subject]"

6. Return ProgressAnalytics object
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Registration and Assessment Properties

Property 1: Student registration requires grade information
*For any* student registration attempt, the system should reject submissions that lack grade and grade_letter fields
**Validates: Requirements 1.1**

Property 2: Assessment quiz generation completeness
*For any* completed student registration, the system should create an assessment quiz with exactly 2 questions per applicable subject based on the student's grade level
**Validates: Requirements 1.2, 1.7**

Property 3: Assessment results persistence
*For any* completed assessment quiz, the system should create an entry in assessment_results table with the student's answers and scores
**Validates: Requirements 1.3**

### Connection Request Properties

Property 4: Connection request initial state
*For any* connection request creation, the system should set the initial status to "pending" regardless of request type
**Validates: Requirements 2.1**

Property 5: Parent-child link permanence
*For any* accepted parent-child connection request, the system should create a parent_child_links entry that cannot be deleted by non-administrator users
**Validates: Requirements 2.3, 2.4**

### AI Chat Storage Properties

Property 6: Message persistence
*For any* message sent in AI chat, the system should create an entry in ai_chat_messages table with the correct role (user or assistant)
**Validates: Requirements 3.1**

Property 7: Chat history retrieval
*For any* AI chat session, opening the chat should load all messages associated with that session_id in chronological order
**Validates: Requirements 3.3**

Property 8: Session uniqueness
*For any* new chat dialog creation, the system should generate a unique chat_session_id that doesn't conflict with existing sessions
**Validates: Requirements 3.6**

### Navigation and Access Control Properties

Property 9: Role-based navigation
*For any* authenticated user, the sidebar should display navigation items appropriate to their role (student/parent/teacher/administrator)
**Validates: Requirements 4.3**

Property 10: Admin panel access restriction
*For any* user attempting to access the admin panel, the system should allow access only if the user's role is "administrator"
**Validates: Requirements 5.11**

Property 11: Admin operations authorization
*For any* administrative operation (user management, school management, etc.), the system should verify the requesting user has administrator role before executing
**Validates: Requirements 5.2**

### Analytics and Progress Properties

Property 12: Subject average calculation
*For any* student and subject combination, the calculated average score should equal the mean of all quiz_attempts scores for that subject
**Validates: Requirements 6.2**

Property 13: Weak subject classification
*For any* subject with an average score below 60%, the system should classify it as a weak subject in the progress analytics
**Validates: Requirements 6.3**

### Wisdom Coins Transaction Properties

Property 14: Roadmap generation cost
*For any* successful learning roadmap generation request, the system should deduct exactly 4 wisdom_coins from the student's balance
**Validates: Requirements 7.1**

Property 15: Insufficient funds rejection
*For any* roadmap generation request where the student has fewer than 4 wisdom_coins, the system should reject the request with an error message
**Validates: Requirements 7.2**

Property 16: Quiz generation cost
*For any* AI-generated quiz creation, the system should deduct exactly 2 wisdom_coins from the creator's balance
**Validates: Requirements 8.6**

### Data Persistence Properties

Property 17: Roadmap storage
*For any* generated learning roadmap, the system should save it to the learning_roadmaps table and allow retrieval by the student
**Validates: Requirements 7.8**

### Automated Content Generation Properties

Property 18: Daily quest generation count
*For any* execution of the daily cron job, the system should create exactly 3 new quests with status "active"
**Validates: Requirements 9.2**

### Notification Properties

Property 19: Connection request notification
*For any* connection request creation, the system should create a corresponding notification for the recipient user
**Validates: Requirements 11.1**

### Security Properties

Property 20: RLS policy enforcement
*For any* database table with sensitive data, Row Level Security policies should be enabled and prevent unauthorized access
**Validates: Requirements 12.5**

Property 21: Input validation
*For any* user input field, the system should validate the input on both client and server side, rejecting invalid data
**Validates: Requirements 14.1**

Property 22: SQL injection protection
*For any* database query with user-provided data, the system should use parameterized queries that prevent SQL injection attacks
**Validates: Requirements 14.2**

Property 23: Authorization checks
*For any* operation that modifies data, the system should verify the user has permission to perform that operation before executing
**Validates: Requirements 14.7**

### Performance Properties

Property 24: Pagination for large datasets
*For any* list view with more than 50 items, the system should implement pagination to limit the number of items loaded at once
**Validates: Requirements 15.4**



## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials
   - Expired session
   - Insufficient permissions
   - Email not verified

2. **Validation Errors**
   - Missing required fields
   - Invalid format (email, phone, etc.)
   - Out of range values
   - Duplicate entries

3. **Business Logic Errors**
   - Insufficient wisdom coins
   - Connection request already exists
   - Cannot unlink parent-child without admin
   - Quiz already completed

4. **External Service Errors**
   - Supabase connection failed
   - AI service unavailable
   - Rate limit exceeded
   - Timeout

5. **Data Errors**
   - Record not found
   - Foreign key violation
   - Unique constraint violation
   - RLS policy violation

### Error Handling Strategy

```typescript
// Centralized error handler
class ErrorHandler {
  static handle(error: unknown): UserFriendlyError {
    if (error instanceof AuthError) {
      return this.handleAuthError(error);
    }
    if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    }
    if (error instanceof SupabaseError) {
      return this.handleSupabaseError(error);
    }
    if (error instanceof AIServiceError) {
      return this.handleAIServiceError(error);
    }
    
    // Log unexpected errors
    console.error('Unexpected error:', error);
    return {
      title: 'Произошла ошибка',
      message: 'Пожалуйста, попробуйте позже или обратитесь в поддержку',
      code: 'UNKNOWN_ERROR'
    };
  }
  
  private static handleAuthError(error: AuthError): UserFriendlyError {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return {
          title: 'Неверные данные',
          message: 'Проверьте email и пароль',
          code: error.code
        };
      case 'SESSION_EXPIRED':
        return {
          title: 'Сессия истекла',
          message: 'Пожалуйста, войдите снова',
          code: error.code
        };
      case 'INSUFFICIENT_PERMISSIONS':
        return {
          title: 'Недостаточно прав',
          message: 'У вас нет доступа к этой функции',
          code: error.code
        };
      default:
        return {
          title: 'Ошибка авторизации',
          message: error.message,
          code: error.code
        };
    }
  }
  
  private static handleValidationError(error: ValidationError): UserFriendlyError {
    return {
      title: 'Неверные данные',
      message: error.message,
      code: 'VALIDATION_ERROR',
      fields: error.fields
    };
  }
  
  private static handleSupabaseError(error: SupabaseError): UserFriendlyError {
    if (error.code === 'PGRST116') {
      return {
        title: 'Не найдено',
        message: 'Запрашиваемые данные не найдены',
        code: 'NOT_FOUND'
      };
    }
    if (error.message.includes('RLS')) {
      return {
        title: 'Доступ запрещен',
        message: 'У вас нет прав для этой операции',
        code: 'RLS_VIOLATION'
      };
    }
    return {
      title: 'Ошибка базы данных',
      message: 'Не удалось выполнить операцию',
      code: 'DATABASE_ERROR'
    };
  }
  
  private static handleAIServiceError(error: AIServiceError): UserFriendlyError {
    if (error.code === 'RATE_LIMIT') {
      return {
        title: 'Слишком много запросов',
        message: 'Пожалуйста, подождите немного перед следующим запросом',
        code: 'RATE_LIMIT'
      };
    }
    if (error.code === 'TIMEOUT') {
      return {
        title: 'Превышено время ожидания',
        message: 'AI сервис не ответил вовремя, попробуйте еще раз',
        code: 'TIMEOUT'
      };
    }
    return {
      title: 'Ошибка AI сервиса',
      message: 'Не удалось сгенерировать контент',
      code: 'AI_SERVICE_ERROR'
    };
  }
}

// Usage in components
try {
  await someOperation();
} catch (error) {
  const userError = ErrorHandler.handle(error);
  showErrorToast(userError);
}
```

### Retry Strategy

```typescript
// Exponential backoff for transient errors
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable = isRetryableError(error);
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof SupabaseError) {
    return error.code === 'TIMEOUT' || error.code === 'CONNECTION_ERROR';
  }
  if (error instanceof AIServiceError) {
    return error.code === 'TIMEOUT' || error.code === 'RATE_LIMIT';
  }
  return false;
}
```



## Testing Strategy

### Dual Testing Approach

The system will use both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both are complementary and necessary for comprehensive coverage

### Property-Based Testing Configuration

- Use **fast-check** library for TypeScript property-based testing
- Minimum **100 iterations** per property test
- Each property test must reference its design document property
- Tag format: **Feature: platform-production-ready, Property {number}: {property_text}**

### Test Organization

```
src/
├── services/
│   ├── connection-request.service.ts
│   ├── connection-request.service.test.ts (unit tests)
│   ├── connection-request.service.property.test.ts (property tests)
│   ├── ai-chat.service.ts
│   ├── ai-chat.service.test.ts
│   ├── ai-chat.service.property.test.ts
│   ├── analytics.service.ts
│   ├── analytics.service.test.ts
│   ├── analytics.service.property.test.ts
│   └── ...
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.test.tsx (unit tests)
│   │   └── Sidebar.property.test.tsx (property tests)
│   └── ...
└── __tests__/
    ├── integration/
    │   ├── registration-flow.test.ts
    │   ├── connection-request-flow.test.ts
    │   ├── ai-chat-flow.test.ts
    │   └── admin-panel-flow.test.ts
    └── e2e/
        ├── user-journey.test.ts
        └── admin-journey.test.ts
```

### Unit Test Examples

```typescript
// Unit test for specific example
describe('ConnectionRequestService', () => {
  it('should create parent-child connection request with pending status', async () => {
    const parentId = 'parent-123';
    const childId = 'child-456';
    
    const request = await connectionRequestService.create({
      from_user_id: parentId,
      to_user_id: childId,
      request_type: 'parent_child'
    });
    
    expect(request.status).toBe('pending');
    expect(request.from_user_id).toBe(parentId);
    expect(request.to_user_id).toBe(childId);
  });
  
  it('should reject connection request with insufficient permissions', async () => {
    const studentId = 'student-123';
    const otherId = 'other-456';
    
    await expect(
      connectionRequestService.create({
        from_user_id: studentId,
        to_user_id: otherId,
        request_type: 'parent_child'
      })
    ).rejects.toThrow('Insufficient permissions');
  });
});
```

### Property Test Examples

```typescript
import * as fc from 'fast-check';

// Feature: platform-production-ready, Property 4: Connection request initial state
describe('ConnectionRequestService Properties', () => {
  it('should always create connection requests with pending status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // from_user_id
        fc.uuid(), // to_user_id
        fc.constantFrom('parent_child', 'teacher_school', 'student_school'), // request_type
        async (fromUserId, toUserId, requestType) => {
          const request = await connectionRequestService.create({
            from_user_id: fromUserId,
            to_user_id: toUserId,
            request_type: requestType
          });
          
          expect(request.status).toBe('pending');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: platform-production-ready, Property 12: Subject average calculation
describe('AnalyticsService Properties', () => {
  it('should calculate correct average for any set of quiz attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // student_id
        fc.constantFrom('mathematics', 'physics', 'chemistry'), // subject
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 20 }), // scores
        async (studentId, subject, scores) => {
          // Create quiz attempts with these scores
          for (const score of scores) {
            await createQuizAttempt(studentId, subject, score);
          }
          
          const analytics = await analyticsService.getProgressAnalytics(studentId);
          const subjectScore = analytics.subject_scores.find(s => s.subject === subject);
          
          const expectedAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
          expect(subjectScore.average_score).toBeCloseTo(expectedAverage, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: platform-production-ready, Property 14: Roadmap generation cost
describe('RoadmapService Properties', () => {
  it('should always deduct exactly 4 wisdom coins for roadmap generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // student_id
        fc.integer({ min: 4, max: 1000 }), // initial_coins
        fc.constantFrom('mathematics', 'physics', 'chemistry'), // subject
        async (studentId, initialCoins, subject) => {
          // Set initial coins
          await setWisdomCoins(studentId, initialCoins);
          
          // Generate roadmap
          await roadmapService.generateRoadmap(studentId, subject);
          
          // Check coins deducted
          const finalCoins = await getWisdomCoins(studentId);
          expect(finalCoins).toBe(initialCoins - 4);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Test Strategy

Integration tests verify complete user flows:

```typescript
describe('Registration and Assessment Flow', () => {
  it('should complete full student registration with assessment', async () => {
    // 1. Register student
    const student = await registerStudent({
      email: 'test@example.com',
      password: 'password123',
      full_name: 'Test Student',
      grade: '5',
      grade_letter: 'A'
    });
    
    // 2. Verify assessment quiz created
    const assessmentQuiz = await getAssessmentQuiz(student.id);
    expect(assessmentQuiz).toBeDefined();
    expect(assessmentQuiz.questions.length).toBeGreaterThan(0);
    
    // 3. Complete assessment
    const answers = generateAnswers(assessmentQuiz.questions);
    await submitAssessment(student.id, answers);
    
    // 4. Verify results saved
    const results = await getAssessmentResults(student.id);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Connection Request Flow', () => {
  it('should complete parent-child connection flow', async () => {
    const parent = await createTestUser('parent');
    const child = await createTestUser('student');
    
    // 1. Parent sends request
    const request = await sendConnectionRequest(parent.id, child.id, 'parent_child');
    expect(request.status).toBe('pending');
    
    // 2. Child receives notification
    const notifications = await getNotifications(child.id);
    expect(notifications.some(n => n.type === 'connection_request')).toBe(true);
    
    // 3. Child accepts request
    await acceptConnectionRequest(child.id, request.id);
    
    // 4. Verify link created
    const links = await getParentChildLinks(parent.id);
    expect(links.some(l => l.child_id === child.id)).toBe(true);
    
    // 5. Verify cannot be deleted by non-admin
    await expect(
      deleteParentChildLink(parent.id, child.id)
    ).rejects.toThrow('Insufficient permissions');
  });
});
```

### Test Coverage Goals

- **Unit tests**: 80% code coverage minimum
- **Property tests**: All 24 correctness properties implemented
- **Integration tests**: All major user flows covered
- **E2E tests**: Critical paths (registration, quiz taking, admin operations)

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every PR
- Run integration tests before deployment
- Run E2E tests on staging environment

