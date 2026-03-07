# 🔐 Переменные окружения для Vercel

## Копируйте эти переменные в Vercel

### 1. VITE_SUPABASE_URL
```
Значение: https://ваш-проект.supabase.co
Где взять: Supabase → Settings → API → Project URL
```

### 2. VITE_SUPABASE_ANON_KEY
```
Значение: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Где взять: Supabase → Settings → API → anon public key
```

### 3. VITE_GROQ_API_KEY
```
Значение: gsk_...
Где взять: https://console.groq.com → API Keys
```

### 4. CRON_SECRET
```
Значение: случайная строка (32+ символов)
Где взять: Сгенерировать командой:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Назначение: Защита cron endpoints от несанкционированного доступа
```

---

## Как добавить в Vercel

### Способ 1: Через веб-интерфейс

1. Откройте ваш проект в Vercel
2. Перейдите в **Settings** → **Environment Variables**
3. Для каждой переменной:
   - Введите **Key** (имя переменной)
   - Введите **Value** (значение)
   - Выберите все окружения: **Production**, **Preview**, **Development**
   - Нажмите **Save**

### Способ 2: Через Vercel CLI (для CRON_SECRET)

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Сгенерируйте секретный ключ
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Добавьте секрет (замените YOUR_KEY на сгенерированный ключ)
vercel secrets add cron-secret "YOUR_KEY"
```

---

## Пример заполнения

```
Key: VITE_SUPABASE_URL
Value: https://pnhmrddjsoyatqwvkgvr.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaG1yZGRqc295YXRxd3ZrZ3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTI4NzAsImV4cCI6MjA1MjUyODg3MH0.abc123...
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: VITE_GROQ_API_KEY
Value: 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
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: CRON_SECRET
Value: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
Environments: ✓ Production ✓ Preview ✓ Development
```

---

## ⚠️ Важно

- **НЕ** используйте кавычки в значениях
- **НЕ** добавляйте пробелы в начале или конце
- Все переменные для фронтенда должны начинаться с `VITE_`
- `CRON_SECRET` используется только на сервере (без префикса VITE_)
- После добавления переменных нажмите **Redeploy** в Vercel
- Храните `CRON_SECRET` в безопасности - это ключ для защиты cron jobs

---

## Проверка

После деплоя откройте консоль браузера (F12) и проверьте:

```javascript
// Эти значения НЕ должны быть undefined
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log(import.meta.env.VITE_GROQ_API_KEY);
```

Если видите `undefined` - переменные не настроены правильно.
