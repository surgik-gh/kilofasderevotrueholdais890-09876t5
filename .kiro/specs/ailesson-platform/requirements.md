# Requirements Document

## Introduction

AILesson (Alies AI) - это образовательная платформа для создания и прохождения уроков с интеграцией искусственного интеллекта (Groq API). Платформа предназначена для учеников, учителей, родителей и администраторов, предоставляя инструменты для создания образовательного контента, отслеживания прогресса и взаимодействия между участниками образовательного процесса.

## Glossary

- **System**: AILesson Platform
- **User**: Любой пользователь платформы (ученик, учитель, родитель, администратор)
- **Student**: Ученик - пользователь, который проходит уроки и выполняет задания
- **Teacher**: Учитель - пользователь, который создает уроки и отслеживает прогресс учеников
- **Parent**: Родитель - пользователь, который отслеживает прогресс своих детей
- **Administrator**: Администратор - пользователь с правами управления платформой
- **Lesson**: Урок - образовательный контент, созданный с помощью AI
- **Quiz**: Викторина - набор вопросов для проверки знаний по уроку
- **Wisdom_Coin**: Монета мудрости - внутренняя валюта платформы (токены)
- **Expert_Chat**: Эксперт-чат - чат с нейросетью для консультаций
- **School**: Школа - организационная единица, объединяющая учителей, учеников и родителей
- **Leaderboard**: Таблица лидеров - рейтинг учеников по результатам
- **Subscription_Tier**: Уровень подписки - тарифный план пользователя
- **Support_Ticket**: Тикет поддержки - обращение в службу поддержки

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a user, I want to register and authenticate in the system, so that I can access platform features according to my role.

#### Acceptance Criteria

1. WHEN a student registers THEN THE System SHALL create a student account with 50 Wisdom_Coins and assign them to a selected School
2. WHEN a teacher, parent, or administrator registers through Supabase THEN THE System SHALL create an account with appropriate role permissions
3. WHEN a teacher registers THEN THE System SHALL grant them 150 Wisdom_Coins
4. WHEN a user logs in with valid credentials THEN THE System SHALL authenticate them and grant access to role-specific features
5. WHEN a student selects a School during registration THEN THE System SHALL permanently associate them with that School
6. IF a student needs to change their School THEN THE System SHALL require them to create a Support_Ticket

### Requirement 2: Lesson Creation with AI Integration

**User Story:** As a teacher or student, I want to create lessons using AI, so that I can generate educational content efficiently.

#### Acceptance Criteria

1. WHEN a user provides a lesson topic or material THEN THE System SHALL integrate with Groq API to generate lesson content
2. WHEN a user creates a lesson THEN THE System SHALL deduct 5 Wisdom_Coins from their balance
3. WHEN a lesson is created THEN THE System SHALL support the following subjects: математика, русский язык, физика, география, литература, ОБЖ, физическая культура, биология, химия, история, обществознание, информатика, программирование, музыка, геометрия, вероятность и статистика
4. WHEN displaying subjects THEN THE System SHALL organize them by categories for convenient navigation
5. WHEN a lesson is created THEN THE System SHALL store it with metadata including creator, subject, and creation date

### Requirement 3: Quiz Creation and Completion

**User Story:** As a user, I want to create and complete quizzes for lessons, so that I can test knowledge and earn rewards.

#### Acceptance Criteria

1. WHEN a user creates a quiz for a lesson THEN THE System SHALL deduct 5 Wisdom_Coins from their balance
2. WHEN a quiz is created for a lesson THEN THE System SHALL allow only one quiz per lesson
3. WHEN a student completes a quiz for a self-created lesson THEN THE System SHALL allow unlimited attempts
4. WHEN a student completes a quiz for a teacher-created lesson THEN THE System SHALL allow only one attempt
5. WHEN a quiz is completed THEN THE System SHALL display the percentage of correct answers
6. WHEN a student completes a quiz for a self-created lesson THEN THE System SHALL count the result toward the Leaderboard
7. WHEN a student completes a quiz for a teacher-created lesson THEN THE System SHALL not count the result toward the Leaderboard

### Requirement 4: Teacher Lesson Management

**User Story:** As a teacher, I want to create lessons and assign them to students, so that I can manage educational content and track progress.

#### Acceptance Criteria

1. WHEN a teacher creates a lesson THEN THE System SHALL allow them to assign it to specific students
2. WHEN a teacher assigns a lesson THEN THE System SHALL notify the assigned students
3. WHEN a teacher views assigned lessons THEN THE System SHALL display student progress for each lesson
4. WHEN a teacher attaches educational materials THEN THE System SHALL support literature, poems, songs, and other content types
5. WHEN a teacher attaches materials for holidays THEN THE System SHALL make them available to assigned students

### Requirement 5: Parent Monitoring

**User Story:** As a parent, I want to monitor my children's progress, so that I can support their education.

#### Acceptance Criteria

1. WHEN a parent account is linked to a student through Supabase THEN THE System SHALL grant access to that student's progress data
2. WHEN a parent views progress THEN THE System SHALL display completed lessons, quiz results, and Leaderboard position
3. WHEN a parent joins a School THEN THE System SHALL grant access to parent chats
4. WHEN a parent needs to communicate with teachers THEN THE System SHALL provide access to teacher chats within the School

### Requirement 6: School Organization

**User Story:** As an administrator, I want to organize users into schools, so that I can manage educational institutions effectively.

#### Acceptance Criteria

1. WHEN a School is created through Supabase THEN THE System SHALL allow teachers to be assigned to it
2. WHEN teachers are assigned to a School THEN THE System SHALL allow parents to join that School
3. WHEN a student registers THEN THE System SHALL require them to select a School
4. WHEN a School is established THEN THE System SHALL enable communication channels between teachers, parents, and students within that School

### Requirement 7: Chat and Communication

**User Story:** As a user, I want to create and join chats, so that I can communicate with other users.

#### Acceptance Criteria

1. WHEN a user creates a chat THEN THE System SHALL generate a unique invitation link
2. WHEN a user shares an invitation link THEN THE System SHALL allow other users to join the chat
3. WHEN a user searches for chats THEN THE System SHALL display available public chats and channels
4. WHEN a parent joins a School THEN THE System SHALL grant access to parent chats and teacher chats
5. WHEN users communicate in chats THEN THE System SHALL support real-time messaging

### Requirement 8: Daily Leaderboard and Rewards

**User Story:** As a student, I want to compete on a daily leaderboard, so that I can earn rewards and stay motivated.

#### Acceptance Criteria

1. WHEN students complete quizzes for self-created lessons THEN THE System SHALL update their Leaderboard score
2. WHEN the daily reset occurs at 18:00 THEN THE System SHALL award 50 Wisdom_Coins to the first place student
3. WHEN the daily reset occurs at 18:00 THEN THE System SHALL award 25 Wisdom_Coins to the second place student
4. WHEN the daily reset occurs at 18:00 THEN THE System SHALL award 10 Wisdom_Coins to the third place student
5. WHEN the daily reset occurs THEN THE System SHALL reset the Leaderboard for the next day

### Requirement 9: Subscription Tiers for Students

**User Story:** As a student, I want to purchase subscription tiers, so that I can access additional features and tokens.

#### Acceptance Criteria

1. WHERE a student has Freemium tier (0₽), THE System SHALL grant 50 Wisdom_Coins every two weeks
2. WHERE a student has Freemium tier, THE System SHALL grant 10 Wisdom_Coins for daily login
3. WHERE a student has Freemium tier, THE System SHALL grant 5 free Expert_Chat queries
4. WHERE a student has Promium tier (349₽), THE System SHALL grant 150 Wisdom_Coins every two weeks
5. WHERE a student has Promium tier, THE System SHALL grant 30 Wisdom_Coins for daily login
6. WHERE a student has Promium tier, THE System SHALL grant 10 free Expert_Chat queries
7. WHERE a student has Premium tier (649₽), THE System SHALL grant 250 Wisdom_Coins every two weeks
8. WHERE a student has Premium tier, THE System SHALL grant 50 Wisdom_Coins for daily login
9. WHERE a student has Premium tier, THE System SHALL grant 15 free Expert_Chat queries
10. WHERE a student has Legend tier (1299₽), THE System SHALL grant 500 Wisdom_Coins every two weeks
11. WHERE a student has Legend tier, THE System SHALL grant 90 Wisdom_Coins for daily login
12. WHERE a student has Legend tier, THE System SHALL grant 30 free Expert_Chat queries

### Requirement 10: Subscription Tiers for Teachers

**User Story:** As a teacher, I want to purchase subscription tiers, so that I can access additional features and tokens.

#### Acceptance Criteria

1. WHERE a teacher has Freemium tier (0₽), THE System SHALL grant 150 Wisdom_Coins every two weeks
2. WHERE a teacher has Freemium tier, THE System SHALL grant 15 Wisdom_Coins for daily login
3. WHERE a teacher has Freemium tier, THE System SHALL grant 5 free Expert_Chat queries
4. WHERE a teacher has Promium tier (299₽), THE System SHALL grant 200 Wisdom_Coins every two weeks
5. WHERE a teacher has Promium tier, THE System SHALL grant 35 Wisdom_Coins for daily login
6. WHERE a teacher has Promium tier, THE System SHALL grant 10 free Expert_Chat queries
7. WHERE a teacher has Premium tier (599₽), THE System SHALL grant 350 Wisdom_Coins every two weeks
8. WHERE a teacher has Premium tier, THE System SHALL grant 55 Wisdom_Coins for daily login
9. WHERE a teacher has Premium tier, THE System SHALL grant 15 free Expert_Chat queries
10. WHERE a teacher has Maxi tier (1399₽), THE System SHALL grant 800 Wisdom_Coins every two weeks
11. WHERE a teacher has Maxi tier, THE System SHALL grant 100 Wisdom_Coins for daily login
12. WHERE a teacher has Maxi tier, THE System SHALL grant 30 free Expert_Chat queries

### Requirement 11: Expert Chat with AI

**User Story:** As a user, I want to chat with an AI expert, so that I can get help with educational questions.

#### Acceptance Criteria

1. WHEN a user sends a message to Expert_Chat THEN THE System SHALL charge 1 Wisdom_Coin per 2000 input/output tokens
2. WHEN a user has free Expert_Chat queries remaining THEN THE System SHALL not charge Wisdom_Coins
3. WHEN a user exhausts free Expert_Chat queries THEN THE System SHALL charge Wisdom_Coins for subsequent queries
4. WHEN a user has insufficient Wisdom_Coins THEN THE System SHALL prevent Expert_Chat access and display a notification
5. WHEN a user interacts with Expert_Chat THEN THE System SHALL integrate with Groq API for AI responses

### Requirement 12: Support Ticket System

**User Story:** As a user, I want to create support tickets, so that I can get help from administrators.

#### Acceptance Criteria

1. WHEN a user creates a Support_Ticket THEN THE System SHALL notify administrators
2. WHEN an administrator views Support_Tickets THEN THE System SHALL display all open tickets with user information
3. WHEN an administrator responds to a Support_Ticket THEN THE System SHALL notify the user
4. WHEN a student needs to change their School THEN THE System SHALL require a Support_Ticket for administrator approval
5. WHEN a Support_Ticket is resolved THEN THE System SHALL mark it as closed

### Requirement 13: Token Economy and Pricing

**User Story:** As a user, I want to understand token costs, so that I can manage my Wisdom_Coins effectively.

#### Acceptance Criteria

1. WHEN a user creates a lesson THEN THE System SHALL charge 5 Wisdom_Coins
2. WHEN a user creates a quiz THEN THE System SHALL charge 5 Wisdom_Coins
3. WHEN a user sends a message to Expert_Chat THEN THE System SHALL charge 1 Wisdom_Coin per 2000 tokens
4. WHEN a user performs a paid action with insufficient Wisdom_Coins THEN THE System SHALL prevent the action and display a notification
5. WHEN a user views their balance THEN THE System SHALL display current Wisdom_Coins and transaction history

### Requirement 14: User Interface Design

**User Story:** As a user, I want a modern and youth-friendly interface, so that the platform is engaging and easy to use.

#### Acceptance Criteria

1. WHEN a user accesses the platform THEN THE System SHALL display a modern, youth-oriented design
2. WHEN a user navigates the interface THEN THE System SHALL provide intuitive navigation with clear visual hierarchy
3. WHEN a user views subjects THEN THE System SHALL display them organized by categories with visual appeal
4. WHEN a user interacts with features THEN THE System SHALL provide responsive feedback and smooth animations
5. WHEN a user accesses the platform on different devices THEN THE System SHALL adapt the interface for optimal viewing

### Requirement 15: Daily Login Rewards

**User Story:** As a user, I want to receive daily login rewards, so that I am incentivized to use the platform regularly.

#### Acceptance Criteria

1. WHEN a student logs in daily THEN THE System SHALL grant Wisdom_Coins according to their Subscription_Tier
2. WHEN a teacher logs in daily THEN THE System SHALL grant Wisdom_Coins according to their Subscription_Tier
3. WHEN a user logs in multiple times in one day THEN THE System SHALL grant the daily reward only once
4. WHEN a user logs in on consecutive days THEN THE System SHALL track login streaks
5. WHEN the day changes THEN THE System SHALL reset daily login eligibility for all users
