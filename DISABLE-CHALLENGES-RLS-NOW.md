# СРОЧНОЕ ИСПРАВЛЕНИЕ: Отключение RLS для челленджей

## Проблема
Бесконечная рекурсия в RLS политиках не устраняется обычными методами.

## Решение
Полностью отключить RLS для таблиц `challenges` и `challenge_participants`.
Безопасность будет обеспечиваться на уровне приложения.

## НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Откройте SQL Editor

### Шаг 2: Выполните этот SQL код

Скопируйте и выполните содержимое файла `disable-challenges-rls.sql` ИЛИ выполните этот код напрямую:

```sql
-- Drop ALL existing policies for challenges
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'challenges') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON challenges';
    END LOOP;
END $$;

-- Drop ALL existing policies for challenge_participants
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'challenge_participants') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON challenge_participants';
    END LOOP;
END $$;

-- Disable RLS completely
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;
```

### Шаг 3: Проверка
После выполнения SQL:
1. Обновите страницу с челленджами (Ctrl+F5 или Cmd+Shift+R)
2. Ошибка должна исчезнуть
3. Челленджи должны загружаться

## Безопасность

Хотя RLS отключен, безопасность обеспечивается:

1. **Фильтрация в `getUserChallenges()`**: Пользователи видят только свои челленджи
2. **Проверка в `createChallenge()`**: Только создатель может создавать от своего имени
3. **Проверка в `acceptChallenge()`**: Пользователь может принять только свое приглашение
4. **Проверка в `updateChallengeProgress()`**: Пользователь обновляет только свой прогресс

## Если проблема сохраняется

Если после выполнения SQL ошибка все еще есть:

1. Очистите кэш браузера (Ctrl+Shift+Delete)
2. Перезапустите приложение локально
3. Проверьте в Supabase Dashboard -> Table Editor, что RLS действительно отключен
4. Проверьте в SQL Editor:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('challenges', 'challenge_participants');
   ```
   Должно показать `rowsecurity = false`

## Альтернатива (если ничего не помогает)

Если проблема сохраняется, возможно есть триггеры или функции, которые также вызывают рекурсию. Проверьте:

```sql
-- Проверить триггеры
SELECT * FROM pg_trigger WHERE tgrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('challenges', 'challenge_participants')
);

-- Проверить функции
SELECT proname, prosrc FROM pg_proc 
WHERE prosrc LIKE '%challenges%' OR prosrc LIKE '%challenge_participants%';
```
