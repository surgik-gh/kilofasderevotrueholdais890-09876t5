# ⚡ Быстрый деплой за 30 минут

## 1. Supabase (10 мин)

### Создать проект
```
https://supabase.com → New Project
Записать: Project URL + anon key
```

### Выполнить SQL
```
SQL Editor → New query → вставить и запустить:
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_gamification_system.sql
3. supabase/migrations/003_production_ready_platform.sql
4. ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
```

### Настроить Auth
```
Authentication → Providers → Email ✓
Authentication → URL Configuration → 
  Redirect URLs: http://localhost:5173/**
```

---

## 2. Groq API (2 мин)

```
https://console.groq.com → API Keys → Create
Скопировать ключ (gsk_...)
```

---

## 3. Vercel (10 мин)

### Импорт
```
https://vercel.com → Add New → Project
Import Git Repository → выбрать репозиторий
```

### Настройка
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

### Environment Variables
```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
VITE_GROQ_API_KEY = gsk_...

Environments: ✓ Production ✓ Preview ✓ Development
```

### Deploy
```
Deploy → дождаться завершения → скопировать URL
```

---

## 4. Обновить Supabase (2 мин)

```
Supabase → Authentication → URL Configuration
Site URL: https://ваш-домен.vercel.app
Redirect URLs: https://ваш-домен.vercel.app/**
```

---

## 5. Проверка (5 мин)

```
1. Открыть Vercel URL
2. Зарегистрироваться (test@example.com / Test123!)
3. Создать урок (проверить AI)
4. Открыть чат с Alies AI
5. F12 → мобильный режим → проверить
```

---

## ✅ Готово!

**Если что-то не работает:**

| Проблема | Решение |
|----------|---------|
| AI не работает | Проверить VITE_GROQ_API_KEY в Vercel |
| Авторизация не работает | Проверить Site URL в Supabase |
| Ошибка 406 | Проверить миграцию 002 |
| Ошибка сборки | `npm run build` локально |

**Документация:**
- Полное руководство: `DEPLOYMENT_GUIDE.md`
- Чеклист: `DEPLOY_CHECKLIST.md`
- Переменные: `ENV_VARIABLES.md`
- SQL: `SQL_MIGRATIONS_QUICK.md`
