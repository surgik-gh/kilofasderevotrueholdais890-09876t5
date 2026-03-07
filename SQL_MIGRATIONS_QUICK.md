# 🗄️ Быстрое применение SQL миграций в Supabase

## Порядок выполнения

Выполняйте миграции **строго по порядку**:

### 1️⃣ Базовая схема (001)
### 2️⃣ Система геймификации (002)
### 3️⃣ Продакшн готовность (003)
### 4️⃣ Отключение RLS для challenges

---

## Шаг 1: Откройте SQL Editor

1. Войдите в Supabase Dashboard
2. Выберите ваш проект
3. В боковом меню нажмите **SQL Editor**
4. Нажмите **"New query"**

---

## Шаг 2: Миграция 001 - Базовая схема

1. Откройте файл `supabase/migrations/001_initial_schema.sql` в вашем проекте
2. Скопируйте **весь** код
3. Вставьте в SQL Editor
4. Нажмите **"Run"** (или Ctrl+Enter)
5. Дождитесь сообщения "Success"

**Что создается:**
- Таблицы: profiles, schools, lessons, quizzes, chats, support_tickets
- RLS политики
- Функции и триггеры

---

## Шаг 3: Миграция 002 - Геймификация

1. Откройте файл `supabase/migrations/002_gamification_system.sql`
2. Скопируйте **весь** код
3. Вставьте в **новый** SQL Editor запрос
4. Нажмите **"Run"**
5. Дождитесь "Success"

**Что создается:**
- Таблицы: achievements, quests, challenges, milestones, streaks, seasonal_events
- Функции для геймификации
- RLS политики

---

## Шаг 4: Миграция 003 - Продакшн

1. Откройте файл `supabase/migrations/003_production_ready_platform.sql`
2. Скопируйте **весь** код
3. Вставьте в **новый** SQL Editor запрос
4. Нажмите **"Run"**
5. Дождитесь "Success"

**Что создается:**
- Таблицы: notifications, connection_requests, roadmaps
- Дополнительные индексы
- Оптимизации

---

## Шаг 5: Отключение RLS для challenges (ВАЖНО!)

Выполните этот SQL код отдельно:

```sql
-- Отключить RLS для таблицы challenges
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- Удалить существующие политики
DROP POLICY IF EXISTS "Users can view all challenges" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;

-- Дать полный доступ всем
GRANT ALL ON challenges TO anon, authenticated;
```

**Почему это нужно:**
- Временное решение для работы челленджей
- Будет исправлено в будущих обновлениях

---

## Проверка успешности

После всех миграций проверьте в **Table Editor**:

### Должны быть созданы таблицы:

**Основные:**
- ✅ profiles
- ✅ schools
- ✅ lessons
- ✅ quizzes
- ✅ quiz_questions
- ✅ quiz_attempts
- ✅ chats
- ✅ chat_messages
- ✅ support_tickets
- ✅ support_messages

**Геймификация:**
- ✅ achievements
- ✅ user_achievements
- ✅ quests
- ✅ user_quests
- ✅ challenges
- ✅ challenge_participants
- ✅ milestones
- ✅ user_milestones
- ✅ streaks
- ✅ seasonal_events
- ✅ user_seasonal_progress

**Дополнительные:**
- ✅ notifications
- ✅ connection_requests
- ✅ roadmaps
- ✅ roadmap_items
- ✅ leaderboard

---

## Если возникла ошибка

### Ошибка: "relation already exists"

**Решение:** Таблица уже создана, пропустите эту часть миграции

### Ошибка: "permission denied"

**Решение:** 
1. Убедитесь, что вы владелец проекта
2. Проверьте, что используете правильный проект

### Ошибка: "syntax error"

**Решение:**
1. Убедитесь, что скопировали **весь** код
2. Проверьте, что не потеряли начало или конец файла
3. Попробуйте скопировать заново

---

## Альтернативный способ (через CLI)

Если у вас установлен Supabase CLI:

```bash
# Установка CLI (если нет)
npm install -g supabase

# Логин
supabase login

# Линк к проекту
supabase link --project-ref ваш-project-ref

# Применить все миграции
supabase db push
```

---

## После миграций

1. Перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** включен
3. Настройте **Site URL** и **Redirect URLs**
4. Готово к деплою! 🚀
