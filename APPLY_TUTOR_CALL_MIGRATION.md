# Применение миграции системы звонков с AI репетитором

## Быстрый старт

### Шаг 1: Применить SQL миграцию

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Создайте новый запрос
4. Скопируйте содержимое файла `supabase/migrations/005_tutor_call_system.sql`
5. Выполните запрос

### Шаг 2: Проверить миграцию

```sql
-- Проверить таблицу
SELECT COUNT(*) FROM tutor_call_sessions;

-- Проверить RLS
SELECT * FROM pg_policies WHERE tablename = 'tutor_call_sessions';

-- Проверить view
SELECT * FROM tutor_call_statistics LIMIT 1;
```

### Шаг 3: Проверить API ключ

Убедитесь, что в `.env` есть:
```env
VITE_TTS_STT_API_KEY=ak_JhC23erQ67y97mWyx9Fe7D
```

### Шаг 4: Деплой на Vercel

```bash
# Установить зависимости (если нужно)
npm install

# Деплой
vercel --prod
```

### Шаг 5: Проверить работу

1. Перейдите на `/tutor-call`
2. Проверьте отображение баланса и стоимости
3. Попробуйте начать тестовый звонок
4. Проверьте историю звонков

## Что было добавлено

### Файлы

**Сервисы:**
- `src/services/tutor-call.service.ts` - основной сервис звонков

**Компоненты:**
- `src/components/tutor-call/TutorCallInterface.tsx` - интерфейс звонка
- `src/components/tutor-call/TutorCallHistory.tsx` - история звонков

**Страницы:**
- `src/pages/TutorCall.tsx` - главная страница звонков

**API:**
- `api/tutor-call/index.ts` - API endpoint для звонков

**База данных:**
- `supabase/migrations/005_tutor_call_system.sql` - миграция БД

**Документация:**
- `TUTOR_CALL_SYSTEM_GUIDE.md` - полное руководство
- `APPLY_TUTOR_CALL_MIGRATION.md` - эта инструкция

### Изменения в существующих файлах

**src/services/token-economy.service.ts:**
- Добавлен метод `calculateTutorCallCost()`
- Добавлен тип транзакции `tutor_call_usage`

**src/App.tsx:**
- Добавлен маршрут `/tutor-call`

**src/components/Layout.tsx:**
- Добавлен пункт меню "AI Репетитор"

## Экономика

### Стоимость
- 10 монет/минута
- Минимум 5 минут (50 монет)
- Скидки до 30% для премиум подписок

### Скидки по подпискам
- Student Freemium: 0%
- Student Promium: 10%
- Student Premium: 20%
- Student Legend: 30%
- Teacher Freemium: 10%
- Teacher Promium: 15%
- Teacher Premium: 25%
- Teacher Maxi: 30%

## Функционал

### Для пользователей
✅ Голосовые звонки с AI репетитором
✅ Выбор голоса (4 варианта)
✅ Управление микрофоном и звуком
✅ Таймер и счетчик монет в реальном времени
✅ История звонков со статистикой
✅ Автоматическое списание монет

### Для администраторов
✅ Просмотр всех звонков
✅ Статистика по пользователям
✅ Мониторинг использования

## Безопасность

✅ RLS политики для защиты данных
✅ Проверка баланса перед звонком
✅ Автоматическое завершение при недостатке средств
✅ Валидация владельца сессии

## Тестирование

### Тест 1: Проверка доступности
```typescript
const affordability = await tutorCallService.canAffordCall(userId);
console.log(affordability);
```

### Тест 2: Начало звонка
```typescript
const session = await tutorCallService.startCall(userId, 'Математика');
console.log(session);
```

### Тест 3: Синтез речи
```typescript
const audio = await tutorCallService.synthesizeSpeech('Привет!');
console.log(audio);
```

### Тест 4: История
```typescript
const history = await tutorCallService.getCallHistory(userId);
console.log(history);
```

## Возможные проблемы

### Проблема: Таблица не создается
**Решение**: Проверьте права доступа в Supabase, выполните миграцию от имени postgres

### Проблема: RLS блокирует запросы
**Решение**: Проверьте, что пользователь аутентифицирован и политики применены

### Проблема: API ключ не работает
**Решение**: Проверьте актуальность ключа LMNT, получите новый если нужно

### Проблема: Нет звука
**Решение**: Проверьте HTTPS, разрешения браузера, LMNT API статус

## Следующие шаги

1. ✅ Применить миграцию
2. ✅ Задеплоить на Vercel
3. ⏳ Протестировать функционал
4. ⏳ Собрать обратную связь
5. ⏳ Оптимизировать на основе использования

## Поддержка

Документация: `TUTOR_CALL_SYSTEM_GUIDE.md`
Техподдержка: `/support` в приложении
