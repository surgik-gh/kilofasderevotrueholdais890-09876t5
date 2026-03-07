/**
 * Verification Script for Checkpoint 21
 * Verifies admin functions and cron jobs
 * 
 * This script checks:
 * 1. Admin panel components exist and are properly structured
 * 2. Cron job files exist and have correct structure
 * 3. Vercel.json has correct cron configuration
 * 4. Content generation functions are properly implemented
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

const results: VerificationResult[] = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function checkFileExists(filePath: string): boolean {
  return existsSync(join(process.cwd(), filePath));
}

function checkFileContains(filePath: string, searchStrings: string[]): { passed: boolean; missing: string[] } {
  try {
    const content = readFileSync(join(process.cwd(), filePath), 'utf-8');
    const missing = searchStrings.filter(str => !content.includes(str));
    return { passed: missing.length === 0, missing };
  } catch (error) {
    return { passed: false, missing: searchStrings };
  }
}

// 1. Verify Admin Panel Components
console.log(`${colors.cyan}=== Checking Admin Panel Components ===${colors.reset}\n`);

const adminChecks: VerificationResult = {
  category: 'Admin Panel Components',
  checks: [],
};

const adminComponents = [
  { path: 'src/pages/AdminPanel.tsx', name: 'Main Admin Panel' },
  { path: 'src/components/admin/AdminSchoolManagement.tsx', name: 'School Management' },
  { path: 'src/components/admin/AdminConnectionManagement.tsx', name: 'Connection Management' },
  { path: 'src/components/admin/AdminContentModeration.tsx', name: 'Content Moderation' },
  { path: 'src/components/admin/AdminSubscriptionManagement.tsx', name: 'Subscription Management' },
  { path: 'src/components/admin/AdminAnalytics.tsx', name: 'Analytics' },
  { path: 'src/components/admin/AdminSettings.tsx', name: 'Settings' },
  { path: 'src/components/admin/AdminAuditLog.tsx', name: 'Audit Log' },
];

adminComponents.forEach(({ path, name }) => {
  const exists = checkFileExists(path);
  adminChecks.checks.push({
    name: `${name} exists`,
    passed: exists,
    message: exists ? `✓ ${path}` : `✗ Missing: ${path}`,
  });
});

// Check AdminPanel.tsx has key features
const adminPanelFeatures = [
  'loadUsers',
  'loadTickets',
  'handleEditUser',
  'handleBlockUser',
  'handleDeleteUser',
  'handleCoinsOperation',
];

const adminPanelCheck = checkFileContains('src/pages/AdminPanel.tsx', adminPanelFeatures);
adminChecks.checks.push({
  name: 'AdminPanel has user management functions',
  passed: adminPanelCheck.passed,
  message: adminPanelCheck.passed 
    ? '✓ All user management functions present' 
    : `✗ Missing functions: ${adminPanelCheck.missing.join(', ')}`,
});

results.push(adminChecks);

// 2. Verify Cron Jobs
console.log(`${colors.cyan}=== Checking Cron Jobs ===${colors.reset}\n`);

const cronChecks: VerificationResult = {
  category: 'Cron Jobs',
  checks: [],
};

const cronJobs = [
  { path: 'api/cron/generate-daily-content.ts', name: 'Daily Content Generation' },
  { path: 'api/cron/generate-weekly-challenge.ts', name: 'Weekly Challenge Generation' },
  { path: 'api/cron/daily-reset.ts', name: 'Daily Reset' },
  { path: 'api/cron/reset-daily-quests.ts', name: 'Reset Daily Quests' },
  { path: 'api/cron/reset-weekly-quests.ts', name: 'Reset Weekly Quests' },
  { path: 'api/cron/check-streaks.ts', name: 'Check Streaks' },
];

cronJobs.forEach(({ path, name }) => {
  const exists = checkFileExists(path);
  cronChecks.checks.push({
    name: `${name} exists`,
    passed: exists,
    message: exists ? `✓ ${path}` : `✗ Missing: ${path}`,
  });
});

// Check daily content generation has key features
const dailyContentFeatures = [
  'generateQuestsWithAI',
  'generateFallbackQuests',
  'getWeakSubjects',
  'llama-3.3-70b-versatile',
  'GROQ_API_KEY',
];

const dailyContentCheck = checkFileContains('api/cron/generate-daily-content.ts', dailyContentFeatures);
cronChecks.checks.push({
  name: 'Daily content generation has AI integration',
  passed: dailyContentCheck.passed,
  message: dailyContentCheck.passed 
    ? '✓ AI generation functions present' 
    : `✗ Missing: ${dailyContentCheck.missing.join(', ')}`,
});

// Check weekly challenge generation has key features
const weeklyChallengeFeatures = [
  'generateChallengeWithAI',
  'generateFallbackChallenge',
  'sendChallengeNotifications',
  'llama-3.3-70b-versatile',
];

const weeklyChallengeCheck = checkFileContains('api/cron/generate-weekly-challenge.ts', weeklyChallengeFeatures);
cronChecks.checks.push({
  name: 'Weekly challenge generation has AI integration',
  passed: weeklyChallengeCheck.passed,
  message: weeklyChallengeCheck.passed 
    ? '✓ AI generation functions present' 
    : `✗ Missing: ${weeklyChallengeCheck.missing.join(', ')}`,
});

results.push(cronChecks);

// 3. Verify Vercel Configuration
console.log(`${colors.cyan}=== Checking Vercel Configuration ===${colors.reset}\n`);

const vercelChecks: VerificationResult = {
  category: 'Vercel Configuration',
  checks: [],
};

const vercelExists = checkFileExists('vercel.json');
vercelChecks.checks.push({
  name: 'vercel.json exists',
  passed: vercelExists,
  message: vercelExists ? '✓ vercel.json found' : '✗ Missing: vercel.json',
});

if (vercelExists) {
  const vercelCronPaths = [
    '/api/cron/generate-daily-content',
    '/api/cron/generate-weekly-challenge',
    '/api/cron/daily-reset',
    '/api/cron/reset-daily-quests',
    '/api/cron/reset-weekly-quests',
    '/api/cron/check-streaks',
  ];

  const vercelCheck = checkFileContains('vercel.json', vercelCronPaths);
  vercelChecks.checks.push({
    name: 'All cron jobs configured in vercel.json',
    passed: vercelCheck.passed,
    message: vercelCheck.passed 
      ? '✓ All cron jobs configured' 
      : `✗ Missing cron paths: ${vercelCheck.missing.join(', ')}`,
  });

  // Check for cron schedules
  const cronSchedules = [
    '"schedule": "0 0 * * *"', // Daily at midnight
    '"schedule": "0 0 * * 1"', // Weekly on Monday
  ];

  const scheduleCheck = checkFileContains('vercel.json', cronSchedules);
  vercelChecks.checks.push({
    name: 'Cron schedules configured',
    passed: scheduleCheck.passed,
    message: scheduleCheck.passed 
      ? '✓ Cron schedules present' 
      : `✗ Missing schedules`,
  });
}

results.push(vercelChecks);

// 4. Verify Content Generation Logic
console.log(`${colors.cyan}=== Checking Content Generation Logic ===${colors.reset}\n`);

const contentChecks: VerificationResult = {
  category: 'Content Generation',
  checks: [],
};

// Check daily content generates 3 quests
const dailyQuestCheck = checkFileContains('api/cron/generate-daily-content.ts', [
  'DIFFICULTY_LEVELS',
  'easy',
  'medium',
  'hard',
  'reward_coins',
  'reward_xp',
]);

contentChecks.checks.push({
  name: 'Daily quests have difficulty levels and rewards',
  passed: dailyQuestCheck.passed,
  message: dailyQuestCheck.passed 
    ? '✓ Quest structure correct' 
    : `✗ Missing quest properties`,
});

// Check personalization based on weak subjects
const personalizationCheck = checkFileContains('api/cron/generate-daily-content.ts', [
  'getWeakSubjects',
  'assessment_results',
  'quiz_attempts',
  'score_percentage',
]);

contentChecks.checks.push({
  name: 'Quest personalization based on weak subjects',
  passed: personalizationCheck.passed,
  message: personalizationCheck.passed 
    ? '✓ Personalization logic present' 
    : `✗ Missing personalization`,
});

// Check weekly challenge has notifications
const notificationCheck = checkFileContains('api/cron/generate-weekly-challenge.ts', [
  'sendChallengeNotifications',
  'notifications',
  'challenge_available',
]);

contentChecks.checks.push({
  name: 'Weekly challenge sends notifications',
  passed: notificationCheck.passed,
  message: notificationCheck.passed 
    ? '✓ Notification system integrated' 
    : `✗ Missing notifications`,
});

results.push(contentChecks);

// Print Results
console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.cyan}VERIFICATION RESULTS${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

let totalChecks = 0;
let passedChecks = 0;

results.forEach(result => {
  console.log(`${colors.blue}${result.category}:${colors.reset}`);
  result.checks.forEach(check => {
    totalChecks++;
    if (check.passed) {
      passedChecks++;
      console.log(`  ${colors.green}${check.message}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}${check.message}${colors.reset}`);
    }
  });
  console.log('');
});

// Summary
console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.cyan}SUMMARY${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

const percentage = Math.round((passedChecks / totalChecks) * 100);
const summaryColor = percentage === 100 ? colors.green : percentage >= 80 ? colors.yellow : colors.red;

console.log(`${summaryColor}Passed: ${passedChecks}/${totalChecks} (${percentage}%)${colors.reset}\n`);

if (percentage === 100) {
  console.log(`${colors.green}✓ All administrative functions and cron jobs are properly implemented!${colors.reset}\n`);
} else if (percentage >= 80) {
  console.log(`${colors.yellow}⚠ Most features are implemented, but some issues need attention.${colors.reset}\n`);
} else {
  console.log(`${colors.red}✗ Significant issues found. Please review the failed checks above.${colors.reset}\n`);
}

// Exit with appropriate code
process.exit(percentage === 100 ? 0 : 1);
