/**
 * Supabase Connection Diagnostics
 * Run this to check if Supabase is configured correctly
 */

import { supabase } from '../lib/supabase';

export async function runSupabaseDiagnostics() {
  console.log('=== Supabase Diagnostics ===');
  
  // Check environment variables
  const env = (import.meta as any).env || {};
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  
  console.log('1. Environment Variables:');
  console.log('   VITE_SUPABASE_URL:', supabaseUrl);
  console.log('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set (' + supabaseKey.substring(0, 20) + '...)' : '✗ Not set');
  
  // Check URL format
  console.log('\n2. URL Format Check:');
  if (supabaseUrl) {
    console.log('   Has https://:', supabaseUrl.startsWith('https://') ? '✓' : '✗ MISSING!');
    console.log('   Has .supabase.co:', supabaseUrl.includes('.supabase.co') ? '✓' : '✗');
    console.log('   Full URL:', supabaseUrl);
  } else {
    console.log('   ✗ URL not configured');
  }
  
  // Test connection
  console.log('\n3. Connection Test:');
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('   ✗ Connection failed:', error.message);
      console.log('   Error details:', error);
    } else {
      console.log('   ✓ Connection successful!');
      console.log('   Response:', data);
    }
  } catch (err) {
    console.log('   ✗ Connection error:', err);
  }
  
  // Test auth
  console.log('\n4. Auth Check:');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('   ✗ Auth check failed:', error.message);
    } else {
      console.log('   ✓ Auth service accessible');
      console.log('   Current session:', session ? 'Logged in' : 'Not logged in');
    }
  } catch (err) {
    console.log('   ✗ Auth error:', err);
  }
  
  console.log('\n=== End Diagnostics ===');
}

// Auto-run in development
if (import.meta.env.DEV) {
  // Run diagnostics after a short delay to let the app initialize
  setTimeout(() => {
    runSupabaseDiagnostics();
  }, 2000);
}
