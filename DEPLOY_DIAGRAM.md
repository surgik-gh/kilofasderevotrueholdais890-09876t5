# 📊 Схема деплоя AILesson Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                     ПРОЦЕСС ДЕПЛОЯ                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   GitHub     │  ← Ваш код уже здесь
│  Repository  │
└──────┬───────┘
       │
       │ git push
       ↓
┌──────────────────────────────────────────────────────────────┐
│                         VERCEL                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Import Repository                                │    │
│  │     Framework: Vite                                  │    │
│  │     Build: npm run build                             │    │
│  │     Output: dist                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  2. Environment Variables                            │    │
│  │     VITE_SUPABASE_URL ────────────┐                 │    │
│  │     VITE_SUPABASE_ANON_KEY ───────┤                 │    │
│  │     VITE_GROQ_API_KEY ────────────┤                 │    │
│  └───────────────────────────────────┼─────────────────┘    │
│                                       │                       │
│  ┌───────────────────────────────────┼─────────────────┐    │
│  │  3. Build & Deploy                │                 │    │
│  │     npm install                   │                 │    │
│  │     npm run build                 │                 │    │
│  │     Deploy to CDN                 │                 │    │
│  └───────────────────────────────────┼─────────────────┘    │
│                                       │                       │
│  ┌───────────────────────────────────┼─────────────────┐    │
│  │  4. Serverless Functions          │                 │    │
│  │     /api/lessons/*                │                 │    │
│  │     /api/chat/*                   │                 │    │
│  │     /api/cron/*                   │                 │    │
│  └───────────────────────────────────┼─────────────────┘    │
│                                       │                       │
└───────────────────────────────────────┼───────────────────────┘
                                        │
                                        │ API Calls
                                        ↓
┌──────────────────────────────────────────────────────────────┐
│                        SUPABASE                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Create Project                                   │    │
│  │     Region: Europe West                              │    │
│  │     Database Password: ********                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  2. Run Migrations                                   │    │
│  │     001_initial_schema.sql                           │    │
│  │     002_gamification_system.sql                      │    │
│  │     003_production_ready_platform.sql                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  3. Database Tables                                  │    │
│  │     ├── profiles                                     │    │
│  │     ├── lessons                                      │    │
│  │     ├── quizzes                                      │    │
│  │     ├── achievements                                 │    │
│  │     ├── quests                                       │    │
│  │     ├── challenges                                   │    │
│  │     └── notifications                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  4. Authentication                                   │    │
│  │     Email Provider: ✓                                │    │
│  │     Site URL: https://your-app.vercel.app            │    │
│  │     Redirect URLs: https://your-app.vercel.app/**    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                                        ↓
                                        
┌──────────────────────────────────────────────────────────────┐
│                         GROQ AI                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Key: gsk_...                                    │    │
│  │  Models:                                             │    │
│  │    - llama-3.3-70b-versatile (lessons)               │    │
│  │    - llama-3.1-8b-instant (chat)                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                                        ↓

┌──────────────────────────────────────────────────────────────┐
│                    PRODUCTION APP                             │
│                                                               │
│  URL: https://your-app.vercel.app                            │
│                                                               │
│  Features:                                                    │
│    ✓ User Registration & Login                               │
│    ✓ AI Lesson Generation                                    │
│    ✓ AI Chat (Alies)                                         │
│    ✓ Gamification (Achievements, Quests, Challenges)         │
│    ✓ Notifications                                           │
│    ✓ Mobile Responsive                                       │
│    ✓ Real-time Updates                                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Поток данных

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│  User   │────────▶│ Vercel  │────────▶│ Supabase │
│ Browser │         │   App   │         │    DB    │
└─────────┘         └─────────┘         └──────────┘
     │                   │                     │
     │                   │                     │
     │                   ↓                     │
     │              ┌─────────┐                │
     │              │  Groq   │                │
     │              │   AI    │                │
     │              └─────────┘                │
     │                   │                     │
     │                   ↓                     │
     └───────────────────┴─────────────────────┘
              Response with AI content
```

---

## Архитектура компонентов

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pages      │  │  Components  │  │   Hooks      │    │
│  │              │  │              │  │              │    │
│  │ - Dashboard  │  │ - Layout     │  │ - useAuth    │    │
│  │ - Lessons    │  │ - RobotEyes  │  │ - useLessons │    │
│  │ - Chat       │  │ - Toast      │  │ - useQuests  │    │
│  │ - Quests     │  │ - Sidebar    │  │ - useAI      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │              Services Layer                       │     │
│  │  - ai.service.ts                                  │     │
│  │  - lesson.service.ts                              │     │
│  │  - auth.service.ts                                │     │
│  │  - gamification/*.service.ts                      │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────────┐
│                 BACKEND (Vercel Functions)                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  /api/lessons/*        - CRUD операции с уроками           │
│  /api/chat/*           - Чат с AI                          │
│  /api/quizzes/*        - Квизы и тесты                     │
│  /api/gamification/*   - Достижения, квесты                │
│  /api/cron/*           - Автоматические задачи             │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  PostgreSQL + Real-time + Auth + Storage                   │
│                                                             │
│  Tables: 30+                                                │
│  Functions: 15+                                             │
│  Triggers: 10+                                              │
│  RLS Policies: 50+                                          │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Безопасность

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                        │
└─────────────────────────────────────────────────────────┘

1. Vercel Edge Network
   ├── DDoS Protection
   ├── SSL/TLS Encryption
   └── CDN Caching

2. Supabase Security
   ├── Row Level Security (RLS)
   ├── JWT Authentication
   ├── API Key Rotation
   └── Database Encryption

3. Application Security
   ├── XSS Protection
   ├── CSRF Protection
   ├── SQL Injection Prevention
   ├── Rate Limiting
   └── Input Validation

4. Environment Variables
   ├── Encrypted at rest
   ├── Not exposed to client
   └── Rotatable
```

---

## Мониторинг

```
┌─────────────────────────────────────────────────────────┐
│                    MONITORING                            │
└─────────────────────────────────────────────────────────┘

Vercel Analytics
├── Page Load Times
├── Core Web Vitals
├── Error Tracking
└── Function Logs

Supabase Dashboard
├── Database Performance
├── Query Analytics
├── Auth Logs
└── Storage Usage

Browser DevTools
├── Console Errors
├── Network Requests
├── Performance Metrics
└── Memory Usage
```
