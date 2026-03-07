# 📦 Краткое резюме: Что делать для деплоя

## Вы уже сделали ✅
- Залили проект на GitHub

## Что нужно сделать 🎯

### 1. Supabase (10 минут)
1. Зайти на https://supabase.com
2. Создать новый проект
3. Записать:
   - Project URL (например: `https://xxxxx.supabase.co`)
   - anon public key (длинный ключ начинающийся с `eyJ...`)
4. В SQL Editor выполнить 3 файла по порядку:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_gamification_system.sql`
   - `supabase/migrations/003_production_ready_platform.sql`
5. Выполнить отдельно:
   ```sql
   ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
   ```

### 2. Groq API (2 минуты)
1. Зайти на https://console.groq.com
2. Создать API Key
3. Скопировать ключ (начинается с `gsk_...`)

### 3. Vercel (10 минут)
1. Зайти на https://vercel.com
2. Add New → Project
3. Import ваш GitHub репозиторий
4. Настройки:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Environment Variables (добавить 3 переменные):
   ```
   VITE_SUPABASE_URL = ваш Project URL из Supabase
   VITE_SUPABASE_ANON_KEY = ваш anon key из Supabase
   VITE_GROQ_API_KEY = ваш ключ из Groq
   ```
   Для всех окружений: Production, Preview, Development
6. Нажать **Deploy**
7. Дождаться завершения
8. Скопировать URL приложения

### 4. Обновить Supabase (2 минуты)
1. Вернуться в Supabase
2. Authentication → URL Configuration
3. Site URL = ваш Vercel URL
4. Redirect URLs → добавить `https://ваш-домен.vercel.app/**`

### 5. Проверка (5 минут)
1. Открыть ваш Vercel URL
2. Зарегистрироваться
3. Создать тестовый урок
4. Проверить AI чат

## 🎉 Готово!

Ваше приложение в продакшене!

---

## 📚 Подробные инструкции

Если нужны детали, откройте:
- **START_HERE.md** - выбор пути
- **QUICK_DEPLOY.md** - быстрая шпаргалка
- **DEPLOYMENT_GUIDE.md** - полное руководство

---

## ⚠️ Если что-то не работает

### AI не работает
→ Проверьте `VITE_GROQ_API_KEY` в Vercel → Settings → Environment Variables

### Авторизация не работает
→ Проверьте Site URL в Supabase → Authentication → URL Configuration

### Ошибка сборки
→ Запустите локально `npm run build` и исправьте ошибки

### Другие проблемы
→ Смотрите логи в Vercel → Functions → Logs

---

## 🔗 Полезные ссылки

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Groq Console: https://console.groq.com

---

**Время**: ~30 минут  
**Стоимость**: Бесплатно (все сервисы имеют free tier)  
**Сложность**: Средняя
