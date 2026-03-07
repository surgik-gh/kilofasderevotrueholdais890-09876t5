# AILesson Platform API

This directory contains Vercel serverless functions for the AILesson platform.

## API Routes

### Lessons API (`/api/lessons`)

Handles lesson CRUD operations.

**Endpoints:**
- `GET /api/lessons?id={lessonId}` - Get specific lesson
- `GET /api/lessons?creator={userId}` - Get lessons by creator
- `GET /api/lessons?subject={subject}` - Get lessons by subject
- `GET /api/lessons?assigned=true` - Get assigned lessons for current user
- `POST /api/lessons` - Create new lesson
- `POST /api/lessons?action=assign` - Assign lesson to students
- `PUT /api/lessons?id={lessonId}` - Update lesson
- `DELETE /api/lessons?id={lessonId}` - Delete lesson

**Authentication:** Required (Bearer token)

### Quizzes API (`/api/quizzes`)

Handles quiz operations and attempts.

**Endpoints:**
- `GET /api/quizzes?id={quizId}` - Get specific quiz
- `GET /api/quizzes?lessonId={lessonId}` - Get quiz by lesson ID
- `GET /api/quizzes?attempts={quizId}` - Get quiz attempts for current user
- `POST /api/quizzes` - Create new quiz
- `POST /api/quizzes?action=attempt` - Submit quiz attempt
- `POST /api/quizzes?action=canCreate` - Check if can create quiz for lesson
- `POST /api/quizzes?action=canAttempt` - Check if can attempt quiz

**Authentication:** Required (Bearer token)

### Chat API (`/api/chat`)

Handles chat operations and messaging.

**Endpoints:**
- `GET /api/chat?id={chatId}` - Get specific chat
- `GET /api/chat?search={query}` - Search public chats
- `GET /api/chat?messages={chatId}` - Get messages for chat
- `GET /api/chat?members={chatId}` - Get chat members
- `GET /api/chat?userChats=true` - Get current user's chats
- `POST /api/chat` - Create new chat
- `POST /api/chat?action=join` - Join chat by invitation code
- `POST /api/chat?action=message` - Send message to chat
- `DELETE /api/chat?id={chatId}` - Leave chat

**Authentication:** Required (Bearer token)

### Leaderboard API (`/api/leaderboard`)

Handles leaderboard queries and rankings.

**Endpoints:**
- `GET /api/leaderboard` - Get today's leaderboard
- `GET /api/leaderboard?date={YYYY-MM-DD}` - Get leaderboard for specific date
- `GET /api/leaderboard?rank=true` - Get current user's rank
- `GET /api/leaderboard?rankInfo=true` - Get detailed rank info for current user
- `GET /api/leaderboard?history={days}` - Get user's leaderboard history
- `GET /api/leaderboard?top={limit}` - Get top N students

**Authentication:** Required (Bearer token)

### Support API (`/api/support`)

Handles support ticket operations.

**Endpoints:**
- `GET /api/support` - Get current user's tickets
- `GET /api/support?id={ticketId}` - Get specific ticket
- `GET /api/support?all=true` - Get all tickets (admin only)
- `GET /api/support?messages={ticketId}` - Get ticket messages
- `POST /api/support` - Create new ticket
- `POST /api/support?action=message` - Send message to ticket
- `PUT /api/support?id={ticketId}` - Update ticket status (admin only)

**Authentication:** Required (Bearer token)

## Cron Jobs

### Daily Leaderboard Reset (`/api/cron/daily-reset`)

Runs daily at 18:00 (6:00 PM).

**Actions:**
- Awards 50 coins to 1st place
- Awards 25 coins to 2nd place
- Awards 10 coins to 3rd place
- Resets leaderboard for new day

**Schedule:** `0 18 * * *`

### Biweekly Token Grants (`/api/cron/biweekly-grants`)

Runs every 14 days at midnight.

**Actions:**
- Grants tokens to all users based on subscription tier
- Student Freemium: 50 coins
- Student Promium: 150 coins
- Student Premium: 250 coins
- Student Legend: 500 coins
- Teacher Freemium: 150 coins
- Teacher Promium: 200 coins
- Teacher Premium: 350 coins
- Teacher Maxi: 800 coins

**Schedule:** `0 0 */14 * *`

### Daily Login Eligibility Reset (`/api/cron/daily-eligibility`)

Runs daily at midnight.

**Actions:**
- Resets login streaks for users who didn't login yesterday
- Allows users to claim daily login rewards again

**Schedule:** `0 0 * * *`

## Environment Variables

Required environment variables for API routes:

- `CRON_SECRET` - Secret for authenticating cron job requests
- Supabase credentials (inherited from main app)

## Authentication

All API routes (except cron jobs) require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

Cron jobs require the CRON_SECRET in the Authorization header:

```
Authorization: Bearer <cron-secret>
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict
- `500` - Internal Server Error

## CORS

All API routes have CORS enabled with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
