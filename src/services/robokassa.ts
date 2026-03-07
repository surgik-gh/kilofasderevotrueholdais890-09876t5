// Robokassa Payment Integration
// Documentation: https://docs.robokassa.ru/

// ВАЖНО: В продакшене эти данные должны храниться на сервере!
// Никогда не используйте секретный пароль на клиенте в реальном приложении.
const ROBOKASSA_CONFIG = {
  merchantLogin: 'AILesson', // Замените на ваш логин в Robokassa
  testMode: true, // true для тестового режима
  // Пароли для формирования подписи (в продакшене - только на сервере!)
  password1: 'your_password1', // Для запросов к Robokassa
  password2: 'your_password2', // Для проверки ответов от Robokassa
};

// Типы подписок
export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  role: 'student' | 'teacher';
  tokens: number;
  dailyTokens: number;
  expertChatLimit: number;
};

// Доступные планы подписки
export const STUDENT_PLANS: SubscriptionPlan[] = [
  { id: 'student-promium', name: 'Promium (Ученик)', price: 349, role: 'student', tokens: 150, dailyTokens: 30, expertChatLimit: 10 },
  { id: 'student-premium', name: 'Premium (Ученик)', price: 649, role: 'student', tokens: 250, dailyTokens: 50, expertChatLimit: 15 },
  { id: 'student-legend', name: 'Legend (Ученик)', price: 1299, role: 'student', tokens: 500, dailyTokens: 90, expertChatLimit: 30 },
];

export const TEACHER_PLANS: SubscriptionPlan[] = [
  { id: 'teacher-promium', name: 'Promium (Учитель)', price: 299, role: 'teacher', tokens: 200, dailyTokens: 35, expertChatLimit: 10 },
  { id: 'teacher-premium', name: 'Premium (Учитель)', price: 599, role: 'teacher', tokens: 350, dailyTokens: 55, expertChatLimit: 15 },
  { id: 'teacher-maxi', name: 'Maxi (Учитель)', price: 1399, role: 'teacher', tokens: 800, dailyTokens: 100, expertChatLimit: 30 },
];

// Генерация MD5 хеша (упрощённая версия для демо)
// В продакшене используйте crypto API или библиотеку
const generateMD5 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 32); // Берём первые 32 символа для имитации MD5
};

// Генерация URL для оплаты через Robokassa
export const generatePaymentUrl = async (
  planId: string,
  userId: string,
  userEmail: string
): Promise<string> => {
  // Находим план
  const allPlans = [...STUDENT_PLANS, ...TEACHER_PLANS];
  const plan = allPlans.find(p => p.id === planId);
  
  if (!plan) {
    throw new Error('План не найден');
  }

  // Генерируем уникальный номер счёта
  const invId = Date.now();
  const outSum = plan.price.toFixed(2);
  const description = `Подписка ${plan.name} - AILesson`;

  // Формируем подпись: MerchantLogin:OutSum:InvId:Password1
  const signatureString = `${ROBOKASSA_CONFIG.merchantLogin}:${outSum}:${invId}:${ROBOKASSA_CONFIG.password1}`;
  const signature = await generateMD5(signatureString);

  // Дополнительные параметры (shp_)
  const shpUserId = userId;
  const shpPlanId = planId;

  // Формируем URL
  const baseUrl = ROBOKASSA_CONFIG.testMode
    ? 'https://auth.robokassa.ru/Merchant/Index.aspx'
    : 'https://auth.robokassa.ru/Merchant/Index.aspx';

  const params = new URLSearchParams({
    MerchantLogin: ROBOKASSA_CONFIG.merchantLogin,
    OutSum: outSum,
    InvId: invId.toString(),
    Description: description,
    SignatureValue: signature,
    Email: userEmail,
    IsTest: ROBOKASSA_CONFIG.testMode ? '1' : '0',
    // Дополнительные параметры для идентификации пользователя
    shp_planId: shpPlanId,
    shp_userId: shpUserId,
  });

  return `${baseUrl}?${params.toString()}`;
};

// Проверка подписи от Robokassa (для webhook обработчика)
export const verifyPaymentSignature = async (
  outSum: string,
  invId: string,
  signatureValue: string,
  shpParams: Record<string, string> = {}
): Promise<boolean> => {
  // Собираем shp_ параметры в алфавитном порядке
  const sortedShpKeys = Object.keys(shpParams).sort();
  const shpString = sortedShpKeys.map(key => `${key}=${shpParams[key]}`).join(':');

  // Формируем строку для проверки: OutSum:InvId:Password2:shp_params
  const signatureString = shpString
    ? `${outSum}:${invId}:${ROBOKASSA_CONFIG.password2}:${shpString}`
    : `${outSum}:${invId}:${ROBOKASSA_CONFIG.password2}`;

  const expectedSignature = await generateMD5(signatureString);

  return expectedSignature.toUpperCase() === signatureValue.toUpperCase();
};

// Обработка успешной оплаты (для webhook)
export const processSuccessfulPayment = (
  planId: string,
  userId: string
): { success: boolean; plan: SubscriptionPlan | null } => {
  const allPlans = [...STUDENT_PLANS, ...TEACHER_PLANS];
  const plan = allPlans.find(p => p.id === planId);

  if (!plan) {
    return { success: false, plan: null };
  }

  // В реальном приложении здесь обновляется БД
  console.log(`Активирована подписка ${plan.name} для пользователя ${userId}`);

  return { success: true, plan };
};
