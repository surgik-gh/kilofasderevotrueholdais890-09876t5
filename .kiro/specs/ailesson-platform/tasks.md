# Implementation Plan: AILesson Platform

## Overview

This implementation plan breaks down the AILesson platform development into incremental, testable steps. The platform will be built using React, TypeScript, Supabase, and Vercel, with a focus on establishing core infrastructure first, then building features layer by layer.

The implementation follows a bottom-up approach: database schema → services → UI components → integration. Each major section includes checkpoint tasks to ensure stability before proceeding.

## Tasks

- [x] 1. Set up project infrastructure and database schema
  - Configure Supabase project with PostgreSQL database
  - Create all database tables according to design schema
  - Set up Row Level Security (RLS) policies for role-based access
  - Configure Vercel project and environment variables
  - Install required dependencies (groq-sdk, fast-check, @supabase/supabase-js)
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3_

- [ ]* 1.1 Write property test for database schema constraints
  - **Property 4: School assignment immutability**
  - **Validates: Requirements 1.5**

- [ ] 2. Implement authentication service
  - [x] 2.1 Create auth.service.ts with registration and login functions
    - Implement registerStudent with 50 coin grant and school assignment
    - Implement registerOtherRole for teacher/parent/administrator
    - Implement login and session management
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property tests for authentication
    - **Property 1: Student registration grants initial tokens and school assignment**
    - **Property 2: Teacher registration grants initial tokens**
    - **Property 3: Role assignment correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 2.3 Write unit tests for authentication edge cases
    - Test duplicate email registration
    - Test invalid credentials
    - Test missing required fields
    - _Requirements: 1.1, 1.2, 1.3_

- [-] 3. Implement token economy service
  - [x] 3.1 Create token-economy.service.ts with balance management
    - Implement getBalance, deductTokens, grantTokens
    - Implement cost calculation functions
    - Implement hasEnoughTokens validation
    - Create transaction records for all operations
    - _Requirements: 2.2, 3.1, 11.1, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 3.2 Write property tests for token economy
    - **Property 5: Lesson creation cost**
    - **Property 6: Quiz creation cost**
    - **Property 7: Expert chat token calculation**
    - **Property 8: Insufficient balance rejection**
    - **Property 9: Transaction history completeness**
    - **Validates: Requirements 2.2, 3.1, 11.1, 13.1, 13.2, 13.3, 13.4, 13.5**

  - [ ]* 3.3 Write unit tests for token economy edge cases
    - Test concurrent balance modifications
    - Test negative amounts
    - Test zero balance scenarios
    - _Requirements: 13.4_

- [x] 4. Implement subscription service
  - [x] 4.1 Create subscription.service.ts with tier management
    - Implement getSubscriptionDetails for all tiers
    - Implement benefit calculation functions
    - Implement purchaseSubscription with Robokassa integration
    - _Requirements: 9.1-9.12, 10.1-10.12_

  - [ ]* 4.2 Write property tests for subscription benefits
    - **Property 10: Subscription benefit calculation**
    - **Property 11: Free expert query consumption**
    - **Property 12: Paid expert query after free exhaustion**
    - **Validates: Requirements 9.1-9.12, 10.1-10.12, 11.2, 11.3**

- [x] 5. Checkpoint - Core services validation
  - Ensure all tests pass for auth, token economy, and subscription services
  - Verify database schema is correctly set up
  - Ask the user if questions arise

- [x] 6. Implement AI service with Groq integration
  - [x] 6.1 Create ai.service.ts with Groq API integration
    - Implement generateLesson function
    - Implement generateQuiz function
    - Implement sendExpertChatMessage function
    - Implement token estimation
    - Add error handling for API failures
    - _Requirements: 2.1, 11.5_

  - [ ]* 6.2 Write unit tests for AI service
    - Test API error handling
    - Test timeout and retry logic
    - Test token estimation accuracy
    - _Requirements: 2.1, 11.5_

- [x] 7. Implement lesson service
  - [x] 7.1 Create lesson.service.ts with CRUD operations
    - Implement createLesson with token deduction
    - Implement getLesson, updateLesson, deleteLesson
    - Implement assignLessonToStudents
    - Implement getAssignedLessons
    - Implement getLessonProgress
    - _Requirements: 2.2, 2.5, 4.1, 4.3, 4.5_

  - [ ]* 7.2 Write property tests for lesson service
    - **Property 13: Lesson metadata completeness**
    - **Property 20: Lesson assignment creates access**
    - **Property 21: Progress visibility for teachers**
    - **Property 22: Attachment accessibility**
    - **Validates: Requirements 2.5, 4.1, 4.3, 4.5**

  - [ ]* 7.3 Write unit tests for lesson service
    - Test unauthorized access attempts
    - Test invalid subject handling
    - Test lesson not found scenarios
    - _Requirements: 2.3, 4.1_

- [-] 8. Implement quiz service
  - [x] 8.1 Create quiz.service.ts with quiz management
    - Implement createQuiz with one-per-lesson constraint
    - Implement getQuiz
    - Implement submitQuizAttempt with scoring
    - Implement canCreateQuiz and canAttemptQuiz validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 8.2 Write property tests for quiz service
    - **Property 14: One quiz per lesson constraint**
    - **Property 15: Quiz score calculation**
    - **Property 16: Unlimited attempts for self-created lessons**
    - **Property 17: Single attempt for teacher-created lessons**
    - **Property 18: Leaderboard counting for self-created lessons**
    - **Property 19: Leaderboard exclusion for teacher-created lessons**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [ ]* 8.3 Write unit tests for quiz service
    - Test quiz already exists error
    - Test attempt limit exceeded error
    - Test invalid quiz data
    - _Requirements: 3.2, 3.4_

- [x] 9. Implement chat service
  - [x] 9.1 Create chat.service.ts with real-time messaging
    - Implement createChat with unique invitation code generation
    - Implement joinChatByInvitation
    - Implement searchChats for public chats
    - Implement sendMessage
    - Implement subscribeToMessages with Supabase Realtime
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 9.2 Write property tests for chat service
    - **Property 28: Unique invitation codes**
    - **Property 29: Invitation code join mechanism**
    - **Property 30: Public chat search visibility**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 9.3 Write unit tests for chat service
    - Test invalid invitation code
    - Test already a member error
    - Test chat not found scenarios
    - _Requirements: 7.1, 7.2_

- [x] 10. Implement leaderboard service
  - [x] 10.1 Create leaderboard.service.ts with scoring and reset
    - Implement updateScore for quiz completions
    - Implement getDailyLeaderboard
    - Implement performDailyReset with reward distribution
    - Implement getStudentRank and getStudentHistory
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 10.2 Write property tests for leaderboard service
    - **Property 31: Quiz completion updates leaderboard**
    - **Property 32: Daily reset reward distribution**
    - **Property 33: Daily reset score clearing**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

  - [ ]* 10.3 Write unit tests for leaderboard service
    - Test edge cases for top 3 rewards
    - Test leaderboard with no entries
    - Test concurrent score updates
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 11. Implement parent monitoring and school services
  - [x] 11.1 Create parent-monitoring functions
    - Implement parent-child link creation
    - Implement getChildProgress for parents
    - Implement school membership functions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

  - [ ]* 11.2 Write property tests for parent and school features
    - **Property 23: Parent-child data access**
    - **Property 24: School-based chat access for parents**
    - **Property 25: Teacher school assignment**
    - **Property 26: Parent school joining**
    - **Property 27: Student school requirement**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3**

- [x] 12. Implement support ticket service
  - [x] 12.1 Create support.service.ts with ticket management
    - Implement createTicket
    - Implement getTicket and getAllTickets
    - Implement updateTicketStatus
    - Implement sendTicketMessage and getTicketMessages
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 12.2 Write property tests for support service
    - **Property 34: Administrator ticket visibility**
    - **Property 35: Ticket status transitions**
    - **Validates: Requirements 12.2, 12.5**

- [x] 13. Implement daily login system
  - [x] 13.1 Create daily login reward logic
    - Implement processDailyLogin in token economy service
    - Implement login streak tracking
    - Implement daily eligibility reset
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 13.2 Write property tests for daily login
    - **Property 36: Daily login reward calculation**
    - **Property 37: Daily login idempotence**
    - **Property 38: Login streak tracking**
    - **Property 39: Daily eligibility reset**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 14. Checkpoint - All services complete
  - Ensure all service tests pass
  - Verify all 39 correctness properties are tested
  - Ask the user if questions arise

- [x] 15. Create Vercel serverless functions
  - [x] 15.1 Create API routes in /api directory
    - Create /api/lessons for lesson CRUD
    - Create /api/quizzes for quiz operations
    - Create /api/chat for chat operations
    - Create /api/leaderboard for leaderboard queries
    - Create /api/support for ticket operations
    - _Requirements: All_

  - [x] 15.2 Create Vercel Cron Jobs
    - Create /api/cron/daily-reset for leaderboard reset at 18:00
    - Create /api/cron/biweekly-grants for token grants
    - Create /api/cron/daily-eligibility for login eligibility reset
    - Configure vercel.json with cron schedules
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 9.1-9.12, 10.1-10.12, 15.5_

  - [ ]* 15.3 Write integration tests for API routes
    - Test authentication middleware
    - Test RLS policy enforcement
    - Test error responses
    - _Requirements: All_

- [x] 16. Build authentication UI components
  - [x] 16.1 Update Login.tsx and Register.tsx pages
    - Integrate with auth.service.ts
    - Add role selector for non-student registration
    - Add school selector for student registration
    - Add form validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.3_

  - [x] 16.2 Create RoleSelector and SchoolSelector components
    - Build reusable role selection component
    - Build school dropdown with search
    - _Requirements: 1.2, 6.3_

- [x] 17. Build lesson management UI
  - [x] 17.1 Update LessonCreate.tsx page
    - Integrate with AI service for lesson generation
    - Add subject selector with categories
    - Add topic/material input
    - Add attachment uploader
    - Show token cost and balance
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.4_

  - [x] 17.2 Update LessonView.tsx page
    - Display lesson content with MarkdownRenderer
    - Add quiz creation button (check if quiz exists)
    - Add attachment download links
    - Show progress for teachers
    - _Requirements: 2.5, 3.2, 4.3, 4.5_

  - [x] 17.3 Update LessonList.tsx and MyLessons.tsx pages
    - Display lessons by subject categories
    - Add assignment functionality for teachers
    - Show completion status
    - _Requirements: 2.4, 4.1_

  - [x] 17.4 Create SubjectSelector component
    - Organize subjects by categories
    - Implement visual category grouping
    - _Requirements: 2.3, 2.4_

- [x] 18. Build quiz UI components
  - [x] 18.1 Create QuizCreator component
    - Integrate with AI service for quiz generation
    - Allow manual question editing
    - Show token cost
    - Enforce one quiz per lesson
    - _Requirements: 3.1, 3.2_

  - [x] 18.2 Create QuizPlayer component
    - Display questions with multiple choice options
    - Track selected answers
    - Submit quiz attempt
    - Show score percentage
    - Handle attempt limits
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 18.3 Create ResultsDisplay component
    - Show score percentage
    - Show correct/incorrect answers
    - Display explanations
    - Show leaderboard impact
    - _Requirements: 3.5, 3.6, 3.7_

- [x] 19. Build chat UI components
  - [x] 19.1 Update Chat.tsx page
    - Display chat list with search
    - Show invitation link generator
    - Implement join by invitation code
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 19.2 Create ChatWindow component
    - Display messages in real-time
    - Implement message sending
    - Show typing indicators
    - Handle Supabase Realtime subscriptions
    - _Requirements: 7.5_

  - [x] 19.3 Update AliesChat.tsx for Expert Chat
    - Integrate with AI service
    - Show token cost per message
    - Track free queries remaining
    - Display conversation history
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 20. Build leaderboard UI
  - [x] 20.1 Update Leaderboard.tsx page
    - Display daily leaderboard table
    - Show student rank and score
    - Highlight top 3 with badges
    - Show reward amounts
    - Add student history view
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 20.2 Create RankBadge component
    - Display rank with visual styling
    - Show special badges for top 3
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 21. Build subscription and token UI
  - [x] 21.1 Update Pricing.tsx page
    - Display subscription tiers for students and teachers
    - Show benefits for each tier
    - Integrate with Robokassa payment
    - _Requirements: 9.1-9.12, 10.1-10.12_

  - [x] 21.2 Create TokenBalance component
    - Display current Wisdom_Coins balance
    - Show transaction history
    - Display free expert queries remaining
    - _Requirements: 13.5_

  - [x] 21.3 Create SubscriptionBadge component
    - Display current subscription tier
    - Show tier benefits
    - _Requirements: 9.1-9.12, 10.1-10.12_

- [x] 22. Build parent and school dashboards
  - [x] 22.1 Update SchoolDashboard.tsx page
    - Display school information
    - Show teachers and students
    - Show parent and teacher chats
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 22.2 Create parent progress view
    - Display children's completed lessons
    - Show quiz results
    - Show leaderboard positions
    - _Requirements: 5.1, 5.2_

- [x] 23. Build admin panel and support
  - [x] 23.1 Update AdminPanel.tsx page
    - Display all support tickets
    - Add ticket filtering by status/priority
    - Show user information
    - _Requirements: 12.2_

  - [x] 23.2 Update Support.tsx page
    - Create ticket form
    - Display user's tickets
    - Show ticket chat
    - _Requirements: 12.1, 12.3, 12.5_

  - [x] 23.3 Create TicketChat component
    - Display ticket messages
    - Send messages
    - Show ticket status
    - _Requirements: 12.3, 12.5_

- [x] 24. Build dashboard and profile pages
  - [x] 24.1 Update Dashboard.tsx page
    - Show role-specific dashboard
    - Display quick stats (balance, streak, rank)
    - Show recent lessons and quizzes
    - _Requirements: All_

  - [x] 24.2 Update Profile.tsx page
    - Display user information
    - Show subscription tier
    - Show login streak
    - Allow profile updates (except school for students)
    - _Requirements: 1.5, 15.4_

- [x] 25. Implement Zustand store integration
  - [x] 25.1 Update store.ts with all state management
    - Add auth state (user, session)
    - Add token balance state
    - Add leaderboard state
    - Add chat state
    - Add lesson/quiz state
    - _Requirements: All_

  - [x] 25.2 Connect all components to Zustand store
    - Replace local state with global state where appropriate
    - Implement optimistic updates
    - _Requirements: All_

- [x] 26. Add error handling and loading states
  - [x] 26.1 Create error boundary components
    - Handle API errors gracefully
    - Display user-friendly error messages
    - Implement retry logic
    - _Requirements: All_

  - [x] 26.2 Add loading states to all async operations
    - Show spinners during API calls
    - Implement skeleton screens
    - _Requirements: All_

- [x] 27. Implement responsive design
  - [x] 27.1 Add mobile-responsive styles
    - Ensure all pages work on mobile devices
    - Implement mobile navigation
    - Test on various screen sizes
    - _Requirements: 14.5_

  - [x] 27.2 Apply youth-oriented design theme
    - Use modern, vibrant colors
    - Add smooth animations
    - Implement engaging visual elements
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 28. Final checkpoint - Integration testing
  - Test complete user flows end-to-end
  - Verify all features work together
  - Test on staging environment
  - Ask the user if questions arise

- [ ] 29. Deploy to Vercel production
  - Configure production environment variables
  - Set up custom domain (if applicable)
  - Enable Vercel Cron Jobs
  - Monitor deployment logs
  - _Requirements: All_

- [ ]* 30. Performance optimization
  - Implement code splitting
  - Optimize bundle size
  - Add caching strategies
  - Monitor Core Web Vitals
  - _Requirements: 14.4, 14.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end functionality
