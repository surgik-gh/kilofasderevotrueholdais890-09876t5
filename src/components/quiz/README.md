# Quiz Components

This directory contains three main components for quiz functionality in the AILesson platform.

## Components

### 1. QuizCreator

Creates quizzes for lessons with AI generation and manual editing capabilities.

**Features:**
- AI-powered quiz generation using Groq API
- Manual question creation and editing
- Support for LaTeX in questions and answers
- Token cost display and validation
- One quiz per lesson enforcement
- Real-time balance checking

**Props:**
```typescript
interface QuizCreatorProps {
  lessonId: string;        // ID of the lesson to create quiz for
  lessonContent: string;   // Lesson content for AI generation
  userId: string;          // Current user ID
  onQuizCreated: () => void;  // Callback when quiz is created
  onCancel: () => void;    // Callback when user cancels
}
```

**Usage:**
```tsx
import { QuizCreator } from '@/components/quiz';

<QuizCreator
  lessonId={lesson.id}
  lessonContent={lesson.content}
  userId={currentUser.id}
  onQuizCreated={() => {
    // Reload quiz data
    loadQuiz();
  }}
  onCancel={() => {
    // Return to lesson view
    setView('lesson');
  }}
/>
```

**Requirements Implemented:**
- 3.1: Quiz creation costs 5 Wisdom Coins
- 3.2: One quiz per lesson constraint

---

### 2. QuizPlayer

Allows students to take quizzes with a question-by-question flow.

**Features:**
- One question at a time display
- Immediate feedback after each answer
- Visual indicators for correct/incorrect answers
- Progress bar
- Attempt limit enforcement
- Confetti animation for correct answers
- Automatic score calculation and submission

**Props:**
```typescript
interface QuizPlayerProps {
  quiz: Quiz;              // Quiz to take
  studentId: string;       // Current student ID
  onComplete: (score: number, answers: number[]) => void;  // Callback with results
  onCancel: () => void;    // Callback when user cancels
}
```

**Usage:**
```tsx
import { QuizPlayer } from '@/components/quiz';

<QuizPlayer
  quiz={quiz}
  studentId={currentUser.id}
  onComplete={(score, answers) => {
    // Show results
    setScore(score);
    setAnswers(answers);
    setView('results');
  }}
  onCancel={() => {
    // Return to lesson view
    setView('lesson');
  }}
/>
```

**Requirements Implemented:**
- 3.3: Unlimited attempts for self-created lessons
- 3.4: Single attempt for teacher-created lessons
- 3.5: Display score percentage

---

### 3. ResultsDisplay

Shows quiz results with detailed breakdown and rewards.

**Features:**
- Score percentage display with visual feedback
- Correct/incorrect answer breakdown
- Explanations for each question
- Coins earned calculation (0.5 per correct answer)
- Leaderboard points display (10 per correct answer)
- Leaderboard impact indication
- Retry option for self-created lessons

**Props:**
```typescript
interface ResultsDisplayProps {
  quiz: Quiz;              // Quiz that was taken
  score: number;           // Score percentage (0-100)
  userAnswers: number[];   // Array of selected answer indices
  onClose: () => void;     // Callback to close results
  onRetry?: () => void;    // Optional callback to retry quiz
}
```

**Usage:**
```tsx
import { ResultsDisplay } from '@/components/quiz';

<ResultsDisplay
  quiz={quiz}
  score={85}
  userAnswers={[0, 2, 1, 3, 0]}
  onClose={() => {
    // Return to lesson view
    setView('lesson');
  }}
  onRetry={() => {
    // Restart quiz
    setView('take-quiz');
  }}
/>
```

**Requirements Implemented:**
- 3.5: Show score percentage
- 3.6: Leaderboard counting for self-created lessons
- 3.7: Leaderboard exclusion for teacher-created lessons

---

## Integration Example

See `src/pages/QuizDemo.tsx` for a complete integration example showing how to use all three components together.

## Services Used

These components integrate with the following services:

- **quizService**: Quiz CRUD operations, attempt validation, score calculation
- **tokenEconomyService**: Balance checking, token deduction
- **ai.service**: Quiz generation with Groq API
- **supabase**: Database queries for lessons and user data

## Styling

All components use:
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- MarkdownRenderer for LaTeX support

## Notes

- All components handle loading and error states
- Token costs are validated before operations
- Attempt limits are enforced based on lesson creator role
- Leaderboard updates are automatic for qualifying quizzes
- Components are fully responsive and mobile-friendly
