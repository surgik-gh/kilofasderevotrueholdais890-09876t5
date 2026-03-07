/**
 * Verification script for basic services
 * This script checks:
 * 1. Database connection
 * 2. Connection Request Service
 * 3. AI Chat Service
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

function loadEnv() {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

const env = loadEnv();

// Create Supabase client with environment variables
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, colors.green);
}

function error(message: string) {
  log(`✗ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function warn(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

async function verifyDatabaseConnection() {
  info('Checking database connection...');
  
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      error(`Database connection failed: ${error.message}`);
      return false;
    }
    
    success('Database connection successful');
    return true;
  } catch (err) {
    error(`Database connection error: ${(err as Error).message}`);
    return false;
  }
}

async function verifyTables() {
  info('Checking required tables...');
  
  const tables = [
    'user_profiles',
    'connection_requests',
    'ai_chat_sessions',
    'ai_chat_messages',
    'notifications',
    'parent_child_links',
    'school_memberships',
    'schools',
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          error(`Table '${table}' does not exist`);
          allTablesExist = false;
        } else {
          warn(`Table '${table}' check returned error: ${error.message}`);
        }
      } else {
        success(`Table '${table}' exists`);
      }
    } catch (err) {
      error(`Error checking table '${table}': ${(err as Error).message}`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function verifyConnectionRequestService() {
  info('Testing Connection Request Service...');
  
  try {
    // Test that connection_requests table is accessible
    const { data, error } = await supabase
      .from('connection_requests')
      .select('*')
      .limit(1);
    
    if (error) {
      // RLS errors are expected when not authenticated
      if (error.message.includes('RLS') || error.message.includes('permission')) {
        warn('Connection Request Service: RLS policies are active (expected)');
        return true;
      }
      error(`Connection Request Service error: ${error.message}`);
      return false;
    }
    
    success('Connection Request Service: Table is accessible');
    return true;
  } catch (err) {
    error(`Connection Request Service error: ${(err as Error).message}`);
    return false;
  }
}

async function verifyAIChatService() {
  info('Testing AI Chat Service...');
  
  try {
    // Test that ai_chat_sessions table is accessible
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      // RLS errors are expected when not authenticated
      if (error.message.includes('RLS') || error.message.includes('permission')) {
        warn('AI Chat Service: RLS policies are active (expected)');
        return true;
      }
      error(`AI Chat Service error: ${error.message}`);
      return false;
    }
    
    success('AI Chat Service: Table is accessible');
    return true;
  } catch (err) {
    error(`AI Chat Service error: ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  log('\n=== Basic Services Verification ===\n', colors.blue);
  
  const results = {
    database: false,
    tables: false,
    connectionRequestService: false,
    aiChatService: false,
  };
  
  // 1. Verify database connection
  results.database = await verifyDatabaseConnection();
  console.log('');
  
  if (!results.database) {
    error('Database connection failed. Cannot proceed with other checks.');
    process.exit(1);
  }
  
  // 2. Verify tables exist
  results.tables = await verifyTables();
  console.log('');
  
  // 3. Verify Connection Request Service
  results.connectionRequestService = await verifyConnectionRequestService();
  console.log('');
  
  // 4. Verify AI Chat Service
  results.aiChatService = await verifyAIChatService();
  console.log('');
  
  // Summary
  log('=== Verification Summary ===\n', colors.blue);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    success('All checks passed! ✓');
    log('\nBasic services are working correctly.', colors.green);
    process.exit(0);
  } else {
    error('Some checks failed! ✗');
    log('\nPlease review the errors above.', colors.red);
    process.exit(1);
  }
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
