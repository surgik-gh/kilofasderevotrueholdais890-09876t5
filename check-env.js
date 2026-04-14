// Quick environment check script
console.log('=== Environment Variables Check ===');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set');
console.log('VITE_GROQ_API_KEY:', process.env.VITE_GROQ_API_KEY ? '✓ Set' : '✗ Not set');
console.log('===================================');
