# 🚀 Полное руководство по деплою AILesson Platform на Vercel

## Предварительные требования

✅ Проект залит на GitHub  
✅ Аккаунт на [Vercel](https://vercel.com)  
✅ Аккаунт на [Supabase](https://supabase.com)  
✅ API ключ Groq (для AI функций)

---

## Шаг 1: Подготовка Supabase

### 1.1 Создание проекта Supabase

1. Перейдите на https://supabase.com
2. Нажмите **"New Project"**
3. Заполните данные:
   - **Name**: `ailesson-platform` (или любое имя)
   - **Database Password**: создайте надежный пароль (сохраните его!)
   - **Region**: выберите ближайший регион (например, `Europe West (London)`)
4. Нажмите **"Create new project"**
5. Дождитесь создания проекта (2-3 минуты)

### 1.2 Получение учетных данных Supabase

После создания проекта:

1. Перейдите в **Settings** → **API**
2. Скопируйте и сохраните:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ (начинается с `eyJhbGc...`)

### 1.3 Применение миграций базы данных

1. Перейдите в **SQL Editor** в боковом меню Supabase
2. Нажмите **"New query"**
3. Скопируйте содержимое файла `supabase/migrations/001_initial_schema.sql`
4. Вставьте в редактор и нажмите **"Run"**
5. Повторите для файлов:
   - `supabase/migrations/002_gamification_system.sql`
   - `supabase/migrations/003_production_ready_platform.sql`

### 1.4 Отключение RLS для challenges (временно)

1. В **SQL Editor** выполните:
```sql
-- Отключить RLS для таблицы challenges
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- Удалить существующие политики
DROP POLICY IF EXISTS "Users can view all challenges" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
```

### 1.5 Настройка Authentication

1. Перейдите в **Authentication** → **Providers**
2. Убедитесь, что **Email** провайдер включен
3. В **Authentication** → **URL Configuration**:
   - **Site URL**: `https://ваш-домен.vercel.app` (обновите после деплоя)
   - **Redirect URLs**: добавьте:
     - `https://ваш-домен.vercel.app/**`
     - `http://localhost:5173/**` (для локальной разработки)

---

## Шаг 2: Получение API ключа Groq

1. Перейдите на https://console.groq.com
2. Зарегистрируйтесь или войдите
3. Перейдите в **API Keys**
4. Нажмите **"Create API Key"**
5. Скопируйте ключ (начинается с `gsk_...`)

---

## Шаг 3: Деплой на Vercel

### 3.1 Импорт проекта

1. Перейдите на https://vercel.com
2. Нажмите **"Add New..."** → **"Project"**
3. Выберите **"Import Git Repository"**
4. Найдите ваш репозиторий GitHub и нажмите **"Import"**

### 3.2 Настройка проекта

На странице конфигурации проекта:

#### Framework Preset
- Выберите: **Vite**

#### Root Directory
- Оставьте: `./` (корень проекта)

#### Build and Output Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Настройка переменных окружения

Нажмите **"Environment Variables"** и добавьте следующие переменные:

| Имя переменной | Значение | Где взять |
|----------------|----------|-----------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase → Settings → API → anon public |
| `VITE_GROQ_API_KEY` | `gsk_...` | Groq Console → API Keys |

**Важно**: 
- Все переменные должны начинаться с `VITE_`
- Не используйте кавычки в значениях
- Применяйте переменные для всех окружений (Production, Preview, Development)

### 3.4 Запуск деплоя

1. Нажмите **"Deploy"**
2. Дождитесь завершения сборки (3-5 минут)
3. После успешного деплоя вы увидите URL вашего приложения

---

## Шаг 4: Настройка Cron Jobs (опционально)

Для автоматических задач (ежедневные квесты, проверка стриков):

1. В Vercel перейдите в **Settings** → **Cron Jobs**
2. Добавьте следующие задачи:

| Путь | Расписание | Описание |
|------|------------|----------|
| `/api/cron/reset-daily-quests` | `0 0 * * *` | Сброс ежедневных квестов (00:00) |
| `/api/cron/reset-weekly-quests` | `0 0 * * 0` | Сброс недельных квестов (воскресенье 00:00) |
| `/api/cron/check-streaks` | `0 1 * * *` | Проверка стриков (01:00) |
| `/api/cron/daily-eligibility` | `0 2 * * *` | Проверка права на токены (02:00) |
| `/api/cron/biweekly-grants` | `0 3 1,15 * *` | Выдача токенов (1 и 15 числа, 03:00) |

---

## Шаг 5: Обновление Supabase URL

После деплоя обновите настройки Supabase:

1. Скопируйте URL вашего Vercel приложения (например: `https://ailesson.vercel.app`)
2. В Supabase перейдите в **Authentication** → **URL Configuration**
3. Обновите **Site URL** на ваш Vercel URL
4. Добавьте в **Redirect URLs**: `https://ваш-домен.vercel.app/**`

---

## Шаг 6: Проверка деплоя

### 6.1 Базовая проверка

1. Откройте ваш Vercel URL
2. Проверьте, что главная страница загружается
3. Попробуйте зарегистрироваться:
   - Email: `test@example.com`
   - Пароль: `Test123!`
   - Имя: `Тестовый Пользователь`
   - Роль: `Студент`

### 6.2 Проверка функций

После регистрации проверьте:

- ✅ Вход в систему
- ✅ Дашборд загружается
- ✅ Создание урока (AI генерация)
- ✅ Просмотр уроков
- ✅ Чат с Alies AI
- ✅ Уведомления работают

### 6.3 Проверка мобильной версии

1. Откройте DevTools (F12)
2. Включите режим устройства (Ctrl+Shift+M)
3. Проверьте на разных размерах экрана:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

---

## Шаг 7: Настройка домена (опционально)

### 7.1 Добавление кастомного домена

1. В Vercel перейдите в **Settings** → **Domains**
2. Нажмите **"Add"**
3. Введите ваш домен (например: `ailesson.ru`)
4. Следуйте инструкциям для настройки DNS

### 7.2 Обновление Supabase

После добавления домена:

1. В Supabase обновите **Site URL** на новый домен
2. Добавьте в **Redirect URLs**: `https://ваш-домен.ru/**`

---

## Устранение проблем

### Проблема: Ошибка сборки "Module not found"

**Решение**:
```bash
# Локально проверьте сборку
npm run build

# Если есть ошибки, исправьте импорты
# Затем закоммитьте и запушьте изменения
git add .
git commit -m "Fix build errors"
git push
```

### Проблема: "Failed to load resource: 406" для seasonal_events

**Решение**: Проверьте, что миграция `002_gamification_system.sql` применена в Supabase

### Проблема: AI не работает (Connection error)

**Решение**: 
1. Проверьте, что `VITE_GROQ_API_KEY` добавлен в Vercel
2. Проверьте, что ключ валиден на https://console.groq.com
3. Передеплойте проект после добавления переменной

### Проблема: Не работает авторизация

**Решение**:
1. Проверьте **Site URL** и **Redirect URLs** в Supabase
2. Убедитесь, что Email провайдер включен
3. Проверьте переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`

### Проблема: Cron jobs не запускаются

**Решение**:
1. Убедитесь, что у вас Pro план Vercel (Hobby план не поддерживает Cron)
2. Проверьте логи в Vercel → Functions → Logs

---

## Мониторинг и логи

### Просмотр логов

1. В Vercel перейдите в **Deployments**
2. Выберите последний деплой
3. Нажмите **"View Function Logs"**

### Мониторинг производительности

1. Перейдите в **Analytics**
2. Отслеживайте:
   - Время загрузки страниц
   - Количество посетителей
   - Ошибки

### Supabase мониторинг

1. В Supabase перейдите в **Database** → **Logs**
2. Отслеживайте SQL запросы и ошибки

---

## Обновление проекта

### Автоматический деплой

Vercel автоматически деплоит при каждом push в GitHub:

```bash
# Внесите изменения
git add .
git commit -m "Update feature"
git push

# Vercel автоматически начнет деплой
```

### Откат к предыдущей версии

1. В Vercel перейдите в **Deployments**
2. Найдите стабильную версию
3. Нажмите **"..."** → **"Promote to Production"**

---

## Чеклист после деплоя

- [ ] Проект успешно задеплоен на Vercel
- [ ] Все миграции применены в Supabase
- [ ] Переменные окружения настроены
- [ ] Site URL обновлен в Supabase
- [ ] Регистрация работает
- [ ] Создание уроков работает
- [ ] AI чат работает
- [ ] Мобильная версия корректна
- [ ] Cron jobs настроены (если нужно)
- [ ] Домен настроен (если нужно)

---

## Полезные ссылки

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Groq Console**: https://console.groq.com
- **Документация Vercel**: https://vercel.com/docs
- **Документация Supabase**: https://supabase.com/docs

---

## Поддержка

Если возникли проблемы:

1. Проверьте логи в Vercel
2. Проверьте логи в Supabase
3. Проверьте консоль браузера (F12)
4. Убедитесь, что все переменные окружения настроены правильно

---

**Готово! 🎉 Ваша платформа AILesson теперь в продакшене!**
