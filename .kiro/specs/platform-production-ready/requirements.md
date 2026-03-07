# Requirements Document

## Introduction

Данный документ описывает требования для приведения платформы AILesson к полной production-ready готовности. Включает устранение всех заглушек, реализацию полного функционала администрирования, расширенную систему связей между пользователями, сохранение истории чатов с AI, новые предметы, интеллектуальную аналитику прогресса и автоматическую генерацию образовательного контента.

## Glossary

- **System**: Платформа AILesson
- **User**: Любой пользователь системы (ученик, родитель, учитель, администратор)
- **Student**: Ученик - основной пользователь платформы
- **Parent**: Родитель - пользователь, отслеживающий прогресс детей
- **Teacher**: Учитель - пользователь, создающий контент и управляющий учениками
- **Administrator**: Администратор - пользователь с полными правами управления
- **School**: Школа - образовательное учреждение
- **AI_Chat**: Чат с нейросетью Alies AI
- **Wisdom_Coins**: Монеты мудрости - внутренняя валюта платформы
- **Learning_Roadmap**: Программа обучения - персонализированный план развития
- **Subject**: Предмет обучения
- **Grade**: Класс обучения (1-11, техникум, ВУЗ)
- **Assessment_Quiz**: Оценочный квиз для определения уровня знаний
- **Connection_Request**: Запрос на привязку аккаунтов
- **Sidebar**: Боковая панель навигации
- **Admin_Panel**: Панель администратора
- **Progress_Analytics**: Аналитика прогресса обучения
- **GPT_OSS_120B**: Нейросеть для генерации контента (gpt-oss-120b)

## Requirements

### Requirement 1: Регистрация и начальная оценка

**User Story:** Как новый пользователь, я хочу пройти регистрацию с указанием класса и автоматической оценкой моего уровня, чтобы система могла предложить персонализированную программу обучения.

#### Acceptance Criteria

1. WHEN Student регистрируется, THE System SHALL запросить класс (1-11, техникум, ВУЗ) и букву класса
2. WHEN Student завершает регистрацию, THE System SHALL автоматически создать Assessment_Quiz с двумя вопросами по каждому базовому предмету
3. WHEN Student проходит Assessment_Quiz, THE System SHALL сохранить результаты для формирования Learning_Roadmap
4. THE System SHALL включать следующие базовые предметы: Русский, Английский, Математика, Геометрия (7+ класс), Физика, Химия, Биология, История, Обществознание, Информатика
5. THE System SHALL включать дополнительные языки: Французский, Немецкий, Итальянский, Корейский, Китайский, Японский
6. WHEN Student выбирает класс ниже 7, THE System SHALL исключить Геометрию из Assessment_Quiz
7. THE System SHALL использовать GPT_OSS_120B для генерации вопросов Assessment_Quiz соответствующих уровню класса

### Requirement 2: Система связей между пользователями

**User Story:** Как родитель/учитель/школа, я хочу управлять связями с учениками через систему запросов, чтобы безопасно отслеживать их прогресс.

#### Acceptance Criteria

1. WHEN Parent отправляет Connection_Request ученику по ID, THE System SHALL создать запрос со статусом "pending"
2. WHEN Student получает Connection_Request от Parent, THE System SHALL отобразить уведомление с возможностью принять/отклонить
3. WHEN Student принимает Connection_Request от Parent, THE System SHALL создать неразрывную связь parent_child_links
4. WHEN Parent связан с Student, THE System SHALL запретить отвязку без участия Administrator
5. WHEN Teacher отправляет Connection_Request школе по ID, THE System SHALL создать запрос на присоединение к School
6. WHEN School принимает Connection_Request от Teacher, THE System SHALL добавить Teacher в school_memberships
7. WHEN School отправляет Connection_Request ученику, THE System SHALL создать запрос на присоединение Student к School
8. WHEN Student принимает Connection_Request от School, THE System SHALL добавить Student в school_memberships
9. WHEN Parent имеет детей в School, THE System SHALL автоматически привязать Parent к этим School
10. THE System SHALL позволять Parent быть привязанным к нескольким School одновременно
11. THE System SHALL создавать роли только для Student, Parent, Teacher (Administrator создается отдельно)

### Requirement 3: Сохранение истории чатов с AI

**User Story:** Как пользователь, я хочу, чтобы все мои диалоги с Alies AI сохранялись в базе данных, чтобы я мог вернуться к предыдущим разговорам.

#### Acceptance Criteria

1. WHEN User отправляет сообщение в AI_Chat, THE System SHALL сохранить сообщение в таблицу ai_chat_messages
2. WHEN AI отвечает на сообщение, THE System SHALL сохранить ответ в таблицу ai_chat_messages
3. WHEN User открывает AI_Chat, THE System SHALL загрузить историю сообщений из базы данных
4. THE System SHALL хранить для каждого сообщения: user_id, content, role (user/assistant), timestamp, chat_session_id
5. THE System SHALL группировать сообщения по chat_session_id для организации диалогов
6. WHEN User создает новый диалог, THE System SHALL создать новый chat_session_id
7. THE System SHALL отображать список предыдущих сессий чата в интерфейсе

### Requirement 4: Универсальная боковая панель навигации

**User Story:** Как пользователь, я хочу видеть боковую панель навигации на всех страницах, чтобы легко перемещаться по платформе.

#### Acceptance Criteria

1. THE System SHALL отображать Sidebar на всех страницах платформы после авторизации
2. THE Sidebar SHALL содержать те же элементы навигации, что и на главной странице
3. THE Sidebar SHALL адаптироваться под роль пользователя (Student, Parent, Teacher, Administrator)
4. THE Sidebar SHALL быть responsive и сворачиваться на мобильных устройствах
5. THE Sidebar SHALL подсвечивать текущую активную страницу
6. THE Sidebar SHALL отображать баланс Wisdom_Coins пользователя
7. THE Sidebar SHALL содержать быстрый доступ к AI_Chat

### Requirement 5: Полная панель администратора

**User Story:** Как администратор, я хочу иметь полный контроль над всеми аспектами платформы через Admin_Panel, чтобы эффективно управлять системой.

#### Acceptance Criteria

1. WHEN Administrator открывает Admin_Panel, THE System SHALL отображать все разделы управления
2. THE Admin_Panel SHALL включать управление пользователями: просмотр, редактирование, блокировка, удаление
3. THE Admin_Panel SHALL включать управление школами: создание, редактирование, удаление, просмотр участников
4. THE Admin_Panel SHALL включать управление связями: просмотр всех Connection_Request, принудительная отвязка
5. THE Admin_Panel SHALL включать управление контентом: модерация уроков, квизов, чатов
6. THE Admin_Panel SHALL включать управление подписками: изменение тарифов, начисление Wisdom_Coins
7. THE Admin_Panel SHALL включать просмотр аналитики: статистика по пользователям, активности, доходам
8. THE Admin_Panel SHALL включать управление тикетами поддержки: просмотр, назначение, закрытие
9. THE Admin_Panel SHALL включать настройки системы: конфигурация AI, лимиты, тарифы
10. THE Admin_Panel SHALL включать логи действий: аудит всех критических операций
11. THE Admin_Panel SHALL быть доступна только пользователям с ролью Administrator

### Requirement 6: Интеллектуальная аналитика прогресса

**User Story:** Как пользователь (ученик/родитель/учитель), я хочу видеть детальную аналитику прогресса с рекомендациями, чтобы понимать, какие предметы требуют больше внимания.

#### Acceptance Criteria

1. THE System SHALL анализировать результаты всех Quiz_Attempts для каждого Student
2. THE System SHALL вычислять средний балл по каждому Subject
3. THE System SHALL определять слабые предметы (средний балл < 60%)
4. THE System SHALL определять сильные предметы (средний балл > 80%)
5. WHEN Parent просматривает прогресс ребенка, THE System SHALL отображать Progress_Analytics с визуализацией
6. WHEN Teacher просматривает прогресс учеников, THE System SHALL отображать сводную аналитику по классу
7. THE Progress_Analytics SHALL включать графики динамики по времени
8. THE Progress_Analytics SHALL включать сравнение с средними показателями класса/школы
9. THE Progress_Analytics SHALL включать рекомендации по улучшению (какие темы изучить)
10. THE System SHALL обновлять Progress_Analytics в реальном времени после каждого Quiz_Attempt

### Requirement 7: Автоматическая генерация программ обучения

**User Story:** Как ученик, я хочу получить персонализированную программу обучения (roadmap) за монеты мудрости, чтобы систематически улучшать свои знания.

#### Acceptance Criteria

1. WHEN Student запрашивает Learning_Roadmap для Subject, THE System SHALL списать 4 Wisdom_Coins
2. WHEN Student имеет недостаточно Wisdom_Coins, THE System SHALL отклонить запрос с сообщением об ошибке
3. WHEN запрос принят, THE System SHALL использовать GPT_OSS_120B для генерации Learning_Roadmap
4. THE Learning_Roadmap SHALL основываться на результатах Assessment_Quiz и Quiz_Attempts
5. THE Learning_Roadmap SHALL включать последовательность тем для изучения
6. THE Learning_Roadmap SHALL включать рекомендуемые уроки и материалы
7. THE Learning_Roadmap SHALL включать промежуточные контрольные точки (milestones)
8. THE Learning_Roadmap SHALL быть сохранен в базе данных для повторного просмотра
9. THE System SHALL отображать прогресс выполнения Learning_Roadmap
10. WHEN Student завершает тему в Learning_Roadmap, THE System SHALL отмечать ее как выполненную

### Requirement 8: Автоматическая генерация квизов через AI

**User Story:** Как учитель/ученик, я хочу использовать AI для создания квизов, чтобы быстро генерировать качественные тесты.

#### Acceptance Criteria

1. WHEN User создает Quiz через AI, THE System SHALL использовать GPT_OSS_120B вместо текущей модели
2. THE System SHALL принимать тему и уровень сложности как входные параметры
3. THE System SHALL генерировать вопросы соответствующие указанному уровню класса
4. THE System SHALL генерировать 5-10 вопросов с 4 вариантами ответов каждый
5. THE System SHALL включать правильный ответ и объяснение для каждого вопроса
6. THE System SHALL списывать Wisdom_Coins за генерацию Quiz (2 монеты)
7. THE System SHALL сохранять сгенерированный Quiz в базе данных
8. THE System SHALL позволять редактировать сгенерированный Quiz перед публикацией

### Requirement 9: Ежедневная генерация челленджей и квестов

**User Story:** Как ученик, я хочу получать ежедневные челленджи и квесты, автоматически созданные AI, чтобы поддерживать мотивацию к обучению.

#### Acceptance Criteria

1. THE System SHALL запускать cron-задачу ежедневно в 00:00 UTC для генерации контента
2. WHEN cron-задача выполняется, THE System SHALL использовать GPT_OSS_120B для генерации 3 ежедневных квестов
3. THE System SHALL генерировать квесты разной сложности (легкий, средний, сложный)
4. THE System SHALL генерировать квесты для разных предметов
5. THE System SHALL генерировать 1 еженедельный челлендж для всех пользователей
6. THE System SHALL учитывать уровень класса Student при генерации квестов
7. THE System SHALL учитывать слабые предметы Student при генерации персонализированных квестов
8. WHEN квест сгенерирован, THE System SHALL добавить его в таблицу quests со статусом "active"
9. WHEN челлендж сгенерирован, THE System SHALL добавить его в таблицу challenges со статусом "active"
10. THE System SHALL отправлять уведомления о новых квестах и челленджах

### Requirement 10: Устранение заглушек и demo-режима

**User Story:** Как разработчик, я хочу удалить все заглушки и demo-режимы, чтобы платформа работала только с реальной базой данных Supabase.

#### Acceptance Criteria

1. THE System SHALL удалить все demo-школы из кода
2. THE System SHALL удалить demo-режим авторизации
3. THE System SHALL удалить все mock-данные из компонентов
4. THE System SHALL удалить все TODO и FIXME комментарии после реализации функционала
5. THE System SHALL использовать только реальные данные из Supabase
6. THE System SHALL корректно обрабатывать ошибки подключения к Supabase
7. THE System SHALL отображать понятные сообщения об ошибках пользователю
8. THE System SHALL логировать все критические ошибки для администратора

### Requirement 11: Расширенная система уведомлений

**User Story:** Как пользователь, я хочу получать уведомления о важных событиях, чтобы быть в курсе всех изменений.

#### Acceptance Criteria

1. WHEN User получает Connection_Request, THE System SHALL отправить уведомление
2. WHEN Student завершает Quiz, THE System SHALL отправить уведомление Parent
3. WHEN Teacher назначает Lesson, THE System SHALL отправить уведомление Student
4. WHEN новый Quest доступен, THE System SHALL отправить уведомление Student
5. WHEN новый Challenge доступен, THE System SHALL отправить уведомление всем участникам
6. WHEN Administrator отвечает на Support_Ticket, THE System SHALL отправить уведомление User
7. THE System SHALL хранить уведомления в таблице notifications
8. THE System SHALL отображать непрочитанные уведомления в Sidebar
9. THE System SHALL позволять отмечать уведомления как прочитанные
10. THE System SHALL позволять настраивать типы уведомлений в профиле

### Requirement 12: Полная интеграция с Supabase

**User Story:** Как система, я должна полностью использовать возможности Supabase для всех операций с данными.

#### Acceptance Criteria

1. THE System SHALL использовать Supabase Auth для всех операций аутентификации
2. THE System SHALL использовать Supabase Database для всех операций с данными
3. THE System SHALL использовать Supabase Storage для хранения файлов (аватары, вложения)
4. THE System SHALL использовать Supabase Realtime для real-time обновлений (чаты, уведомления)
5. THE System SHALL использовать Row Level Security (RLS) для всех таблиц
6. THE System SHALL корректно обрабатывать все ошибки Supabase
7. THE System SHALL использовать транзакции для критических операций
8. THE System SHALL оптимизировать запросы к базе данных (использовать индексы, join)

### Requirement 13: Мобильная адаптация

**User Story:** Как пользователь мобильного устройства, я хочу комфортно использовать все функции платформы на смартфоне.

#### Acceptance Criteria

1. THE System SHALL корректно отображаться на экранах от 320px ширины
2. THE Sidebar SHALL сворачиваться в hamburger-меню на мобильных устройствах
3. THE System SHALL использовать touch-friendly элементы управления (минимум 44x44px)
4. THE System SHALL оптимизировать загрузку изображений для мобильных устройств
5. THE System SHALL использовать responsive typography
6. THE System SHALL корректно работать с виртуальной клавиатурой
7. THE System SHALL поддерживать жесты (swipe для навигации)
8. THE System SHALL оптимизировать производительность для мобильных устройств

### Requirement 14: Безопасность и валидация

**User Story:** Как система, я должна обеспечивать безопасность данных пользователей и валидировать все входные данные.

#### Acceptance Criteria

1. THE System SHALL валидировать все пользовательские вводы на клиенте и сервере
2. THE System SHALL защищать от SQL-инъекций через параметризованные запросы
3. THE System SHALL защищать от XSS-атак через санитизацию HTML
4. THE System SHALL использовать HTTPS для всех запросов
5. THE System SHALL хранить пароли в зашифрованном виде (через Supabase Auth)
6. THE System SHALL использовать JWT токены для аутентификации
7. THE System SHALL проверять права доступа для всех операций
8. THE System SHALL логировать все попытки несанкционированного доступа
9. THE System SHALL использовать rate limiting для API запросов
10. THE System SHALL защищать от CSRF-атак

### Requirement 15: Производительность и оптимизация

**User Story:** Как пользователь, я хочу, чтобы платформа работала быстро и отзывчиво.

#### Acceptance Criteria

1. THE System SHALL загружать главную страницу менее чем за 3 секунды
2. THE System SHALL использовать lazy loading для изображений и компонентов
3. THE System SHALL кэшировать статические ресурсы
4. THE System SHALL использовать pagination для больших списков данных
5. THE System SHALL оптимизировать запросы к базе данных (использовать select только нужных полей)
6. THE System SHALL использовать debounce для поисковых запросов
7. THE System SHALL минимизировать количество re-renders в React компонентах
8. THE System SHALL использовать code splitting для уменьшения размера бандла
9. THE System SHALL использовать Service Workers для offline-режима (опционально)
10. THE System SHALL мониторить производительность через Web Vitals
