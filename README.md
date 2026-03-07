# AILesson Platform (Alies AI)

Современная образовательная платформа с AI-помощником для учеников, учителей и родителей.

## 🚀 Деплой на Vercel

**Готовы задеплоить в продакшн?** 

👉 **Начните здесь: [START_HERE.md](START_HERE.md)**

### 📚 Документация деплоя

- ⚡ **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Быстрая шпаргалка (30 мин)
- ✅ **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** - Пошаговый чеклист
- 📖 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Полное руководство
- 🔐 **[ENV_VARIABLES.md](ENV_VARIABLES.md)** - Переменные окружения
- 🗄️ **[SQL_MIGRATIONS_QUICK.md](SQL_MIGRATIONS_QUICK.md)** - SQL миграции
- 📊 **[DEPLOY_DIAGRAM.md](DEPLOY_DIAGRAM.md)** - Схемы архитектуры
- 🎯 **[FINAL_FIXES_SUMMARY.md](FINAL_FIXES_SUMMARY.md)** - Что исправлено

---

## 💻 Локальная разработка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск приложения

```bash
npm run dev
```

Откройте `http://localhost:5173` в браузере.

### 3. Первый запуск

При первом запуске вы увидите **Landing Page**.

**Если видите пустую страницу:**
1. Откройте `http://localhost:5173/debug`
2. Нажмите "Очистить весь localStorage"
3. Обновите страницу

## 📖 Режимы работы

### Демо-режим (по умолчанию)

Приложение работает без настройки Supabase:
- Данные сохраняются в localStorage браузера
- Все функции доступны для тестирования
- Не требует регистрации на внешних сервисах

### Production режим (с Supabase)

Для полноценной работы настройте Supabase:

1. **Создайте проект на [supabase.com](https://supabase.com)**

2. **Получите ключи** (Settings → API):
   - Project URL
   - anon public key

3. **Настройте .env**:
   ```env
   VITE_SUPABASE_URL=https://ваш-проект.supabase.co
   VITE_SUPABASE_ANON_KEY=ваш-anon-ключ
   ```

4. **Создайте схему БД**:
   - SQL Editor → New query
   - Скопируйте `supabase/migrations/001_initial_schema.sql`
   - Выполните (Run)

5. **Перезапустите сервер**:
   ```bash
   npm run dev
   ```

📚 **Подробная инструкция**: `SUPABASE_SETUP_GUIDE.md`

## 🛠️ Полезные команды

### Разработка

```bash
npm run dev          # Запустить dev сервер
npm run build        # Собрать для production
npm run preview      # Предпросмотр production сборки
```

### Отладка

Откройте консоль браузера (F12) и используйте:

```javascript
clearAllStorage()    // Очистить весь storage
clearAppStorage()    // Очистить только данные приложения
getStorageInfo()     // Информация о storage
```

Или откройте: `http://localhost:5173/debug`

## 📁 Структура проекта

```
AliesAI/
├── src/
│   ├── pages/           # Страницы приложения
│   │   ├── Landing.tsx  # Приветственная страница
│   │   ├── Debug.tsx    # Страница отладки
│   │   ├── Login.tsx    # Вход
│   │   ├── Register.tsx # Регистрация
│   │   └── Dashboard.tsx # Панель управления
│   ├── components/      # React компоненты
│   ├── services/        # Бизнес-логика
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Утилиты
│   └── lib/            # Библиотеки (Supabase)
├── api/                # Vercel API endpoints
├── supabase/           # Миграции БД
└── docs/               # Документация
```

## 🎯 Основные функции

- 🤖 **AI-помощник** - Персональный эксперт для обучения
- 📚 **Интерактивные уроки** - Создание и прохождение уроков
- 🎮 **Геймификация** - Монеты мудрости и рейтинг
- 💬 **Чаты** - Общение с экспертом и другими пользователями
- 👨‍👩‍👧‍👦 **Для семьи** - Родители следят за прогрессом детей
- 🏫 **Для школ** - Учителя создают материалы для классов

## 🔧 Решение проблем

### Пустая страница

```javascript
// В консоли браузера (F12)
clearAllStorage()
// Обновите страницу (F5)
```

Или откройте: `http://localhost:5173/debug`

### Ошибки Supabase

1. Проверьте `.env` файл
2. Убедитесь, что проект активен в Supabase
3. Проверьте, что схема БД создана
4. Попробуйте демо-режим (удалите настройки из `.env`)

📚 **Подробнее**: `QUICK_FIX_GUIDE.md`

## 📚 Документация

- `LANDING_AND_SUPABASE_SETUP.md` - Полное руководство
- `SUPABASE_SETUP_GUIDE.md` - Настройка Supabase
- `QUICK_FIX_GUIDE.md` - Быстрое решение проблем
- `SETUP.md` - Детальная настройка инфраструктуры
- `DATABASE_SCHEMA.md` - Схема базы данных

## 🚀 Deployment

### Vercel (рекомендуется)

1. Импортируйте проект в Vercel
2. Добавьте переменные окружения
3. Deploy!

Подробнее: `SETUP.md`

## 🧪 Тестирование

```bash
npm run test         # Запустить тесты
npm run test:ui      # UI для тестов
```

## 🛣️ Roadmap

- [x] Базовая инфраструктура
- [x] Аутентификация
- [x] Система уроков
- [x] Чаты
- [x] Рейтинг
- [x] Landing Page
- [ ] Платежная система
- [ ] Мобильное приложение
- [ ] Расширенная аналитика

## 📄 Лицензия

MIT

## 🤝 Поддержка

Если возникли проблемы:

1. Проверьте `/debug` страницу
2. Посмотрите консоль браузера (F12)
3. Прочитайте `QUICK_FIX_GUIDE.md`
4. Откройте issue в репозитории

---

Сделано с ❤️ для образования
