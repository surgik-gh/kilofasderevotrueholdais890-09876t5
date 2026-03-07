# Integration Testing Guide - AILesson Platform

## Overview

This document provides a comprehensive guide for testing complete user flows end-to-end on the AILesson platform. It covers manual testing procedures, automated integration tests, and staging environment verification.

## Prerequisites

Before running integration tests, ensure:

1. **Environment Configuration**
   - `.env` file is properly configured with valid credentials
   - Supabase project is set up with all migrations applied
   - Groq API key is valid and has sufficient quota
   - Robokassa test mode is enabled (for payment testing)

2. **Database Setup**
   - All tables from `supabase/migrations/001_initial_schema.sql` are created
   - Row Level Security (RLS) policies are enabled
   - Test schools and users are available

3. **Dependencies Installed**
   ```bash
   npm install
   ```

## Automated Integration Tests

### Running the Tests

```bash
# Run all integration tests
npm run test:run

# Run with UI
npm run test:ui

# Run specific test file
npm run test:run src/__tests__/integration/user-flows.test.ts
```

### Test Coverage

The automated integration tests verify:

- ✅ Database schema and table structure
- ✅ Foreign key relationships
- ✅ User registration flows
- ✅ Lesson creation and assignment
- ✅ Quiz creation and attempts
- ✅ Chat and messaging
- ✅ Leaderboard tracking
- ✅ Support ticket system
- ✅ Transaction history
- ✅ Parent-child relationships
- ✅ School memberships

## Manual End-to-End Testing

### Test Flow 1: Student Registration and Onboarding

**Objective**: Verify a student can register, receive initial tokens, and be assigned to a school.

**Steps**:
1. Navigate to `/register`
2. Select "Student" role
3. Fill in email, password, and full name
4. Select a school from the dropdown
5. Click "Register"

**Expected Results**:
- ✅ User is created with role "student"
- ✅ User receives 50 Wisdom Coins
- ✅ User is assigned to the selected school
- ✅ User is redirected to dashboard
- ✅ Transaction record is created for initial grant

**Validates**: Requirements 1.1, 1.5

---

### Test Flow 2: Teacher Registration and Initial Grant

**Objective**: Verify a teacher can register and receive appropriate initial tokens.

**Steps**:
1. Navigate to `/register`
2. Select "Teacher" role
3. Fill in email, password, and full name
4. Click "Register"

**Expected Results**:
- ✅ User is created with role "teacher"
- ✅ User receives 150 Wisdom Coins
- ✅ User is redirected to dashboard
- ✅ Transaction record is created for initial grant

**Validates**: Requirements 1.2, 1.3

---

### Test Flow 3: Lesson Creation with AI

**Objective**: Verify lesson creation flow with token deduction.

**Steps**:
1. Log in as a teacher or student
2. Navigate to `/lessons/create`
3. Select a subject (e.g., "Mathematics")
4. Enter a topic (e.g., "Pythagorean Theorem")
5. Optionally add material/context
6. Click "Generate Lesson"

**Expected Results**:
- ✅ Token balance is checked (must have ≥5 coins)
- ✅ AI generates lesson content via Groq API
- ✅ 5 Wisdom Coins are deducted
- ✅ Lesson is saved to database
- ✅ Transaction record is created
- ✅ User is redirected to lesson view

**Validates**: Requirements 2.1, 2.2, 2.5, 13.1

---

### Test Flow 4: Quiz Creation and Completion

**Objective**: Verify quiz creation, one-per-lesson constraint, and scoring.

**Steps**:
1. Navigate to an existing lesson
2. Click "Create Quiz" button
3. AI generates quiz questions
4. Review and optionally edit questions
5. Save quiz (5 coins deducted)
6. Take the quiz as a student
7. Submit answers

**Expected Results**:
- ✅ Only one quiz can be created per lesson
- ✅ 5 Wisdom Coins are deducted for creation
- ✅ Quiz questions are displayed correctly
- ✅ Score percentage is calculated accurately
- ✅ For self-created lessons: unlimited attempts allowed
- ✅ For teacher-created lessons: only one attempt allowed
- ✅ Leaderboard is updated appropriately

**Validates**: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 13.2

---

### Test Flow 5: Teacher Lesson Assignment

**Objective**: Verify teachers can assign lessons to students and track progress.

**Steps**:
1. Log in as a teacher
2. Create or select a lesson
3. Click "Assign to Students"
4. Select students from the list
5. Confirm assignment
6. View student progress

**Expected Results**:
- ✅ Lesson appears in assigned students' "My Lessons"
- ✅ Students receive notification (if implemented)
- ✅ Teacher can view completion status
- ✅ Teacher can see quiz attempts and scores
- ✅ Attachments are accessible to assigned students

**Validates**: Requirements 4.1, 4.2, 4.3, 4.5

---

### Test Flow 6: Parent Monitoring

**Objective**: Verify parents can view their children's progress.

**Steps**:
1. Log in as a parent
2. Ensure parent-child link exists in database
3. Navigate to parent dashboard
4. View child's progress

**Expected Results**:
- ✅ Parent can see completed lessons
- ✅ Parent can see quiz results
- ✅ Parent can see leaderboard position
- ✅ Parent has access to school chats

**Validates**: Requirements 5.1, 5.2, 5.3, 5.4

---

### Test Flow 7: Chat Creation and Messaging

**Objective**: Verify chat creation, invitation codes, and real-time messaging.

**Steps**:
1. Navigate to `/chat`
2. Click "Create Chat"
3. Enter chat name and select type
4. Copy invitation code
5. Share invitation code with another user
6. Second user joins via invitation code
7. Send messages back and forth

**Expected Results**:
- ✅ Chat is created with unique invitation code
- ✅ Users can join via invitation code
- ✅ Messages appear in real-time
- ✅ Public chats appear in search results
- ✅ School chats are accessible to school members

**Validates**: Requirements 7.1, 7.2, 7.3, 7.5

---

### Test Flow 8: Expert Chat with AI

**Objective**: Verify Expert Chat functionality and token consumption.

**Steps**:
1. Navigate to `/alies-chat`
2. Send a message to the AI expert
3. Observe token deduction
4. Continue conversation

**Expected Results**:
- ✅ Free queries are consumed first (if available)
- ✅ After free queries exhausted, tokens are deducted
- ✅ Cost is 1 coin per 2000 tokens
- ✅ Insufficient balance prevents sending messages
- ✅ AI responses are generated via Groq API

**Validates**: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 13.3

---

### Test Flow 9: Daily Leaderboard and Rewards

**Objective**: Verify leaderboard updates and daily reset rewards.

**Steps**:
1. Complete quizzes as multiple students
2. Check leaderboard at `/leaderboard`
3. Wait for daily reset (18:00) or trigger manually
4. Verify rewards are distributed

**Expected Results**:
- ✅ Quiz completions update leaderboard scores
- ✅ Only self-created lesson quizzes count
- ✅ Teacher-created lesson quizzes don't count
- ✅ Top 3 students receive rewards (50, 25, 10 coins)
- ✅ Leaderboard resets for new day
- ✅ Transaction records are created for rewards

**Validates**: Requirements 8.1, 8.2, 8.3, 8.4, 8.5

---

### Test Flow 10: Subscription Management

**Objective**: Verify subscription tier benefits and token grants.

**Steps**:
1. Navigate to `/pricing`
2. View subscription tiers
3. Purchase a subscription (test mode)
4. Verify benefits are applied
5. Test daily login bonus
6. Test biweekly grant

**Expected Results**:
- ✅ Subscription tier is updated
- ✅ Free expert queries are granted
- ✅ Daily login bonus matches tier
- ✅ Biweekly grant matches tier
- ✅ Payment is processed via Robokassa

**Validates**: Requirements 9.1-9.12, 10.1-10.12

---

### Test Flow 11: Support Ticket System

**Objective**: Verify support ticket creation and administrator response.

**Steps**:
1. Log in as a regular user
2. Navigate to `/support`
3. Create a new ticket
4. Log in as an administrator
5. Navigate to `/admin`
6. View and respond to ticket

**Expected Results**:
- ✅ Ticket is created with correct status
- ✅ Administrator can see all tickets
- ✅ Administrator can respond to tickets
- ✅ User receives notification (if implemented)
- ✅ Ticket status can be updated

**Validates**: Requirements 12.1, 12.2, 12.3, 12.4, 12.5

---

### Test Flow 12: Daily Login Rewards

**Objective**: Verify daily login rewards and streak tracking.

**Steps**:
1. Log in as a user
2. Check token balance
3. Verify daily reward is granted
4. Log in again same day
5. Verify reward is not granted twice
6. Log in on consecutive days
7. Verify streak is tracked

**Expected Results**:
- ✅ Daily reward is granted on first login
- ✅ Reward amount matches subscription tier
- ✅ Reward is only granted once per day
- ✅ Login streak increments on consecutive days
- ✅ Transaction record is created

**Validates**: Requirements 15.1, 15.2, 15.3, 15.4, 15.5

---

## Staging Environment Testing

### Deployment Checklist

Before testing on staging:

- [ ] Deploy to Vercel staging environment
- [ ] Verify environment variables are set
- [ ] Apply database migrations to staging database
- [ ] Enable Vercel Cron Jobs
- [ ] Test API routes are accessible
- [ ] Verify static assets load correctly

### Staging Test Scenarios

1. **Performance Testing**
   - Load time for main pages
   - API response times
   - Real-time messaging latency
   - AI generation speed

2. **Cross-Browser Testing**
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **Mobile Responsiveness**
   - iOS Safari
   - Android Chrome
   - Tablet views

4. **Security Testing**
   - RLS policies enforcement
   - Authentication flows
   - Authorization checks
   - Input validation

## Vercel Cron Jobs Testing

### Daily Reset (18:00)

**Endpoint**: `/api/cron/daily-reset`

**Test**:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-reset \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected**:
- Top 3 students receive rewards
- Leaderboard scores reset
- Transaction records created

### Biweekly Grants

**Endpoint**: `/api/cron/biweekly-grants`

**Test**:
```bash
curl -X POST https://your-app.vercel.app/api/cron/biweekly-grants \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected**:
- All users receive tokens based on subscription tier
- Transaction records created

### Daily Eligibility Reset

**Endpoint**: `/api/cron/daily-eligibility`

**Test**:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-eligibility \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected**:
- Daily login eligibility reset for all users

## Known Issues and Limitations

Document any known issues discovered during testing:

- [ ] Issue 1: Description
- [ ] Issue 2: Description
- [ ] Issue 3: Description

## Test Results Summary

| Test Flow | Status | Notes |
|-----------|--------|-------|
| Student Registration | ⏳ Pending | |
| Teacher Registration | ⏳ Pending | |
| Lesson Creation | ⏳ Pending | |
| Quiz Creation | ⏳ Pending | |
| Teacher Assignment | ⏳ Pending | |
| Parent Monitoring | ⏳ Pending | |
| Chat Messaging | ⏳ Pending | |
| Expert Chat | ⏳ Pending | |
| Leaderboard | ⏳ Pending | |
| Subscriptions | ⏳ Pending | |
| Support Tickets | ⏳ Pending | |
| Daily Login | ⏳ Pending | |

## Conclusion

After completing all integration tests:

1. Update the test results summary above
2. Document any issues found
3. Create tickets for bugs that need fixing
4. Verify all critical user flows work correctly
5. Get sign-off from stakeholders before production deployment

## Next Steps

- [ ] Fix any critical issues found
- [ ] Perform load testing
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Production deployment planning
