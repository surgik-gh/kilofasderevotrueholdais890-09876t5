# ✅ Чеклист быстрого деплоя AILesson на Vercel

## Перед началом

- [ ] Проект залит на GitHub
- [ ] Есть аккаунт на Vercel
- [ ] Есть аккаунт на Supabase
- [ ] Есть API ключ Groq

---

## 1. Supabase Setup (15 минут)

### Создание проекта
- [ ] Зайти на https://supabase.com
- [ ] Создать новый проект
- [ ] Записать Database Password
- [ ] Дождаться создания проекта

### Получение credentials
- [ ] Settings → API → скопировать **Project URL**
- [ ] Settings → API → скопировать **anon public key**

### Применение миграций
- [ ] SQL Editor → выполнить `001_initial_schema.sql`
- [ ] SQL Editor → выполнить `002_gamification_system.sql`
- [ ] SQL Editor → выполнить `003_production_ready_platform.sql`
- [ ] SQL Editor → выполнить отключение RLS для challenges:
```sql
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all challenges" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
GRANT ALL ON challenges TO anon, authenticated;
```

### Настройка Auth
- [ ] Authentication → Providers → включить Email
- [ ] Authentication → URL Configuration → добавить `http://localhost:5173/**`

---

## 2. Groq API Key (2 минуты)

- [ ] Зайти на https://console.groq.com
- [ ] Создать API Key
- [ ] Скопировать ключ (начинается с `gsk_`)

---

## 3. Vercel Deploy (10 минут)

### Импорт проекта
- [ ] Зайти на https://vercel.com
- [ ] Add New → Project
- [ ] Import Git Repository
- [ ] Выбрать ваш GitHub репозиторий

### Настройка проекта
- [ ] Framework Preset: **Vite**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### Environment Variables
Добавить 3 переменные (для всех окружений):

- [ ] `VITE_SUPABASE_URL` = ваш Supabase Project URL
- [ ] `VITE_SUPABASE_ANON_KEY` = ваш Supabase anon key
- [ ] `VITE_GROQ_API_KEY` = ваш Groq API key

### Деплой
- [ ] Нажать **Deploy**
- [ ] Дождаться завершения (3-5 минут)
- [ ] Скопировать URL приложения

---

## 4. Обновление Supabase (2 минуты)

- [ ] Вернуться в Supabase
- [ ] Authentication → URL Configuration
- [ ] Site URL = ваш Vercel URL
- [ ] Redirect URLs → добавить `https://ваш-домен.vercel.app/**`

---

## 5. Проверка (5 минут)

### Базовая проверка
- [ ] Открыть Vercel URL
- [ ] Главная страница загружается
- [ ] Нет ошибок в консоли (F12)

### Регистрация
- [ ] Зарегистрировать тестового пользователя
- [ ] Email: `test@example.com`
- [ ] Пароль: `Test123!`
- [ ] Роль: Студент

### Функциональность
- [ ] Вход работает
- [ ] Дашборд загружается
- [ ] Создание урока работает (AI генерация)
- [ ] Чат с Alies AI работает
- [ ] Уведомления отображаются

### Мобильная версия
- [ ] F12 → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Проверить на iPhone SE (375px)
- [ ] Проверить на iPad (768px)
- [ ] Глаза робота скрыты на мобильных
- [ ] Кнопки не обрезаются
- [ ] Уведомления не выходят за экран

---

## 6. Cron Jobs (опционально, 5 минут)

Только для Pro плана Vercel:

- [ ] Settings → Cron Jobs
- [ ] Добавить `/api/cron/reset-daily-quests` - `0 0 * * *`
- [ ] Добавить `/api/cron/reset-weekly-quests` - `0 0 * * 0`
- [ ] Добавить `/api/cron/check-streaks` - `0 1 * * *`
- [ ] Добавить `/api/cron/daily-eligibility` - `0 2 * * *`
- [ ] Добавить `/api/cron/biweekly-grants` - `0 3 1,15 * *`

---

## 7. Кастомный домен (опционально, 10 минут)

- [ ] Vercel → Settings → Domains
- [ ] Добавить домен
- [ ] Настроить DNS записи
- [ ] Обновить Site URL в Supabase

---

## Устранение проблем

### ❌ Ошибка сборки
```bash
npm run build  # Проверить локально
git add .
git commit -m "Fix build"
git push
```

### ❌ AI не работает
- [ ] Проверить `VITE_GROQ_API_KEY` в Vercel
- [ ] Проверить ключ на https://console.groq.com
- [ ] Redeploy проекта

### ❌ Авторизация не работает
- [ ] Проверить Site URL в Supabase
- [ ] Проверить Redirect URLs
- [ ] Проверить Email провайдер включен

### ❌ Ошибка 406 для seasonal_events
- [ ] Проверить миграцию `002_gamification_system.sql`
- [ ] Проверить таблицу в Table Editor

---

## Финальная проверка

- [ ] ✅ Проект задеплоен
- [ ] ✅ Все миграции применены
- [ ] ✅ Переменные настроены
- [ ] ✅ Регистрация работает
- [ ] ✅ AI работает
- [ ] ✅ Мобильная версия корректна
- [ ] ✅ URL обновлен в Supabase

---

## 🎉 Готово!

Ваш проект AILesson Platform успешно задеплоен!

**Полезные ссылки:**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Ваше приложение: `https://ваш-домен.vercel.app`

**Документация:**
- Подробное руководство: `DEPLOYMENT_GUIDE.md`
- Переменные окружения: `ENV_VARIABLES.md`
- SQL миграции: `SQL_MIGRATIONS_QUICK.md`

---

**Время выполнения:** ~40 минут  
**Сложность:** Средняя  
**Требуется:** GitHub, Vercel, Supabase аккаунты
