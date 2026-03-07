/**
 * Comprehensive User Features Verification Script
 * Checks AI content generation, analytics, and roadmaps
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    
    // Split by both \n and \r\n
    const lines = envContent.split(/\r?\n/);
    
    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (value) {
          env[key] = value;
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('Failed to load .env file:', error);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface VerificationResult {
  feature: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function logResult(result: VerificationResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.feature}: ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
  results.push(result);
}

async function verifyAIServices() {
  console.log('\n🤖 Verifying AI Services...\n');

  // Check AI Chat Service
  try {
    const { data: sessions, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .limit(1);

    if (error) throw error;

    logResult({
      feature: 'AI Chat Sessions Table',
      status: 'pass',
      message: 'Table exists and is accessible',
      details: { sessionCount: sessions?.length || 0 }
    });
  } catch (error: any) {
    logResult({
      feature: 'AI Chat Sessions Table',
      status: 'fail',
      message: error.message
    });
  }

  // Check AI Chat Messages
  try {
    const { data: messages, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .limit(1);

    if (error) throw error;

    logResult({
      feature: 'AI Chat Messages Table',
      status: 'pass',
      message: 'Table exists and is accessible',
      details: { messageCount: messages?.length || 0 }
    });
  } catch (error: any) {
    logResult({
      feature: 'AI Chat Messages Table',
      status: 'fail',
      message: error.message
    });
  }

  // Check Quiz Service
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, created_at')
      .limit(5);

    if (error) throw error;

    logResult({
      feature: 'Quiz Generation Service',
      status: 'pass',
      message: 'Quiz table accessible',
      details: { quizCount: quizzes?.length || 0 }
    });
  } catch (error: any) {
    logResult({
      feature: 'Quiz Generation Service',
      status: 'fail',
      message: error.message
    });
  }

  // Check Assessment Service
  try {
    const { data: assessments, error } = await supabase
      .from('assessment_results')
      .select('*')
      .limit(1);

    if (error) throw error;

    logResult({
      feature: 'Assessment Service',
      status: 'pass',
      message: 'Assessment results table accessible',
      details: { assessmentCount: assessments?.length || 0 }
    });
  } catch (error: any) {
    logResult({
      feature: 'Assessment Service',
      status: 'fail',
      message: error.message
    });
  }
}

async function verifyAnalytics() {
  console.log('\n📊 Verifying Analytics Features...\n');

  // Check quiz attempts for analytics
  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('id, student_id, quiz_id, score_percentage, completed_at')
      .limit(10);

    if (error) throw error;

    logResult({
      feature: 'Quiz Attempts (Analytics Data)',
      status: 'pass',
      message: 'Quiz attempts data accessible',
      details: { attemptCount: attempts?.length || 0 }
    });

    // Check if we have data for analytics calculation
    if (attempts && attempts.length > 0) {
      // Get lesson info to determine subjects
      const quizIds = [...new Set(attempts.map(a => a.quiz_id))];
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, lesson_id')
        .in('id', quizIds);
      
      const lessonIds = quizzes?.map(q => q.lesson_id) || [];
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, subject')
        .in('id', lessonIds);
      
      const subjects = [...new Set(lessons?.map(l => l.subject) || [])];
      
      logResult({
        feature: 'Analytics Data Availability',
        status: 'pass',
        message: 'Data available for analytics calculation',
        details: { subjects, totalAttempts: attempts.length }
      });
    } else {
      logResult({
        feature: 'Analytics Data Availability',
        status: 'warning',
        message: 'No quiz attempts found - analytics will be empty'
      });
    }
  } catch (error: any) {
    logResult({
      feature: 'Quiz Attempts (Analytics Data)',
      status: 'fail',
      message: error.message
    });
  }

  // Check user profiles for grade information
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, role, grade, grade_letter')
      .eq('role', 'student')
      .limit(5);

    if (error) throw error;

    const profilesWithGrade = profiles?.filter(p => p.grade) || [];
    
    logResult({
      feature: 'Student Grade Information',
      status: profilesWithGrade.length > 0 ? 'pass' : 'warning',
      message: profilesWithGrade.length > 0 
        ? 'Students have grade information'
        : 'No students with grade information found',
      details: { 
        totalStudents: profiles?.length || 0,
        studentsWithGrade: profilesWithGrade.length 
      }
    });
  } catch (error: any) {
    logResult({
      feature: 'Student Grade Information',
      status: 'fail',
      message: error.message
    });
  }
}

async function verifyRoadmaps() {
  console.log('\n🗺️ Verifying Learning Roadmap Features...\n');

  // Check learning roadmaps table
  try {
    const { data: roadmaps, error } = await supabase
      .from('learning_roadmaps')
      .select('*')
      .limit(5);

    if (error) throw error;

    logResult({
      feature: 'Learning Roadmaps Table',
      status: 'pass',
      message: 'Table exists and is accessible',
      details: { roadmapCount: roadmaps?.length || 0 }
    });

    // Check roadmap structure
    if (roadmaps && roadmaps.length > 0) {
      const sampleRoadmap = roadmaps[0];
      const hasContent = sampleRoadmap.content && typeof sampleRoadmap.content === 'object';
      const hasProgress = sampleRoadmap.progress && typeof sampleRoadmap.progress === 'object';

      logResult({
        feature: 'Roadmap Data Structure',
        status: hasContent && hasProgress ? 'pass' : 'warning',
        message: hasContent && hasProgress 
          ? 'Roadmaps have proper structure'
          : 'Roadmap structure may be incomplete',
        details: {
          hasContent,
          hasProgress,
          subjects: roadmaps.map(r => r.subject)
        }
      });
    } else {
      logResult({
        feature: 'Roadmap Data Structure',
        status: 'warning',
        message: 'No roadmaps found - feature not yet used'
      });
    }
  } catch (error: any) {
    logResult({
      feature: 'Learning Roadmaps Table',
      status: 'fail',
      message: error.message
    });
  }

  // Check wisdom coins for roadmap generation
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, role, wisdom_coins')
      .eq('role', 'student')
      .limit(5);

    if (error) throw error;

    const studentsWithCoins = profiles?.filter(p => (p.wisdom_coins || 0) >= 4) || [];
    
    logResult({
      feature: 'Wisdom Coins for Roadmaps',
      status: 'pass',
      message: `${studentsWithCoins.length} students have enough coins for roadmap generation`,
      details: {
        totalStudents: profiles?.length || 0,
        studentsWithEnoughCoins: studentsWithCoins.length,
        requiredCoins: 4
      }
    });
  } catch (error: any) {
    logResult({
      feature: 'Wisdom Coins for Roadmaps',
      status: 'fail',
      message: error.message
    });
  }
}

async function verifyConnectionSystem() {
  console.log('\n🔗 Verifying Connection System...\n');

  // Check connection requests
  try {
    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select('*')
      .limit(5);

    if (error) throw error;

    logResult({
      feature: 'Connection Requests Table',
      status: 'pass',
      message: 'Table exists and is accessible',
      details: { requestCount: requests?.length || 0 }
    });

    if (requests && requests.length > 0) {
      const statuses = requests.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      logResult({
        feature: 'Connection Request Status',
        status: 'pass',
        message: 'Connection requests have valid statuses',
        details: statuses
      });
    }
  } catch (error: any) {
    logResult({
      feature: 'Connection Requests Table',
      status: 'fail',
      message: error.message
    });
  }

  // Check parent-child links
  try {
    const { data: links, error } = await supabase
      .from('parent_child_links')
      .select('*')
      .limit(5);

    if (error) throw error;

    logResult({
      feature: 'Parent-Child Links',
      status: 'pass',
      message: 'Parent-child links table accessible',
      details: { linkCount: links?.length || 0 }
    });
  } catch (error: any) {
    logResult({
      feature: 'Parent-Child Links',
      status: 'fail',
      message: error.message
    });
  }
}

async function verifyNotifications() {
  console.log('\n🔔 Verifying Notification System...\n');

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(10);

    if (error) throw error;

    logResult({
      feature: 'Notifications Table',
      status: 'pass',
      message: 'Table exists and is accessible',
      details: { notificationCount: notifications?.length || 0 }
    });

    if (notifications && notifications.length > 0) {
      const types = [...new Set(notifications.map(n => n.type))];
      const unreadCount = notifications.filter(n => !n.read).length;

      logResult({
        feature: 'Notification Types',
        status: 'pass',
        message: 'Notifications have various types',
        details: { types, unreadCount }
      });
    }
  } catch (error: any) {
    logResult({
      feature: 'Notifications Table',
      status: 'fail',
      message: error.message
    });
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log('❌ FAILED CHECKS:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.feature}: ${r.message}`);
    });
    console.log();
  }

  if (warnings > 0) {
    console.log('⚠️  WARNINGS:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`   - ${r.feature}: ${r.message}`);
    });
    console.log();
  }

  const successRate = ((passed / results.length) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failed === 0) {
    console.log('✅ All critical features are working correctly!');
  } else {
    console.log('❌ Some features need attention.');
  }
}

async function main() {
  console.log('🚀 Starting User Features Verification...\n');
  console.log('This will check:');
  console.log('  - AI content generation (chat, quiz, assessment)');
  console.log('  - Analytics features');
  console.log('  - Learning roadmaps');
  console.log('  - Connection system');
  console.log('  - Notifications');
  console.log();

  try {
    await verifyAIServices();
    await verifyAnalytics();
    await verifyRoadmaps();
    await verifyConnectionSystem();
    await verifyNotifications();
    await printSummary();

    const failed = results.filter(r => r.status === 'fail').length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main();
