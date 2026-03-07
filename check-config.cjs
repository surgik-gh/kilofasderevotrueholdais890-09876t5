// Простая проверка конфигурации Supabase
const fs = require('fs');
const path = require('path');

console.log('\n=== Проверка конфигурации Supabase ===\n');

// Читаем .env файл
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Файл .env не найден!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let url = null;
let key = null;

lines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    url = line.split('=')[1].trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    key = line.split('=')[1].trim();
  }
});

// Проверка URL
if (!url) {
  console.error('❌ VITE_SUPABASE_URL не найден в .env');
} else if (url === 'https://your-project.supabase.co') {
  console.error('❌ VITE_SUPABASE_URL не настроен (используется placeholder)');
} else {
  console.log('✅ VITE_SUPABASE_URL:', url);
}

// Проверка ключа
if (!key) {
  console.error('❌ VITE_SUPABASE_ANON_KEY не найден в .env');
} else if (key === 'your-anon-key') {
  console.error('❌ VITE_SUPABASE_ANON_KEY не настроен (используется placeholder)');
} else if (!key.startsWith('eyJ')) {
  console.error('❌ VITE_SUPABASE_ANON_KEY имеет неправильный формат');
  console.error('   Текущий ключ:', key.substring(0, 50) + '...');
  console.error('   Должен начинаться с: eyJ');
  console.error('\n📖 Как получить правильный ключ:');
  console.error('   1. Откройте: https://supabase.com/dashboard/project/pnhmrddjsoyatqwvkgvr/settings/api');
  console.error('   2. Скопируйте ключ "anon" / "public"');
  console.error('   3. Вставьте в .env файл');
  console.error('   4. Перезапустите dev сервер\n');
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY: правильный формат (JWT)');
  console.log('   Длина:', key.length, 'символов');
}

console.log('\n=== Результат ===\n');

if (url && url !== 'https://your-project.supabase.co' && 
    key && key !== 'your-anon-key' && key.startsWith('eyJ')) {
  console.log('✅ Конфигурация выглядит правильно!');
  console.log('\n📝 Следующие шаги:');
  console.log('   1. Перезапустите dev сервер (если он запущен)');
  console.log('   2. Откройте http://localhost:5173/debug');
  console.log('   3. Проверьте статус Supabase');
  console.log('   4. Попробуйте зарегистрироваться\n');
} else {
  console.log('❌ Конфигурация требует исправления');
  console.log('\n📖 См. файлы:');
  console.log('   - FIX_SUPABASE_KEY.md');
  console.log('   - ПРОВЕРКА_SUPABASE.md');
  console.log('   - ИСПРАВЛЕНИЕ_ОШИБКИ_РЕГИСТРАЦИИ.md\n');
}
