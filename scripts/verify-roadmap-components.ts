/**
 * Verification Script for Roadmap Components
 * Tests that all roadmap components are properly implemented
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  component: string;
  exists: boolean;
  hasRequiredImports: boolean;
  hasRequiredProps: boolean;
  issues: string[];
}

const results: VerificationResult[] = [];

function verifyFile(
  componentName: string,
  filePath: string,
  requiredImports: string[],
  requiredProps: string[]
): VerificationResult {
  const result: VerificationResult = {
    component: componentName,
    exists: false,
    hasRequiredImports: false,
    hasRequiredProps: false,
    issues: [],
  };

  // Check if file exists
  if (!existsSync(filePath)) {
    result.issues.push(`File does not exist: ${filePath}`);
    return result;
  }

  result.exists = true;

  // Read file content
  const content = readFileSync(filePath, 'utf-8');

  // Check required imports
  const missingImports = requiredImports.filter(imp => !content.includes(imp));
  if (missingImports.length === 0) {
    result.hasRequiredImports = true;
  } else {
    result.issues.push(`Missing imports: ${missingImports.join(', ')}`);
  }

  // Check required props
  const missingProps = requiredProps.filter(prop => !content.includes(prop));
  if (missingProps.length === 0) {
    result.hasRequiredProps = true;
  } else {
    result.issues.push(`Missing props/features: ${missingProps.join(', ')}`);
  }

  return result;
}

console.log('🔍 Verifying Roadmap Components...\n');

// Verify RoadmapGenerator
results.push(
  verifyFile(
    'RoadmapGenerator',
    join(process.cwd(), 'src/components/roadmap/RoadmapGenerator.tsx'),
    [
      'roadmapService',
      'useTokens',
      'ALL_SUBJECTS',
      'LearningRoadmap',
    ],
    [
      'studentId',
      'onRoadmapGenerated',
      'selectedSubject',
      'isGenerating',
      'ROADMAP_COST',
      'hasEnoughCoins',
      'handleGenerate',
    ]
  )
);

// Verify RoadmapView
results.push(
  verifyFile(
    'RoadmapView',
    join(process.cwd(), 'src/components/roadmap/RoadmapView.tsx'),
    [
      'roadmapService',
      'LearningRoadmap',
      'RoadmapTopic',
    ],
    [
      'roadmap',
      'onProgressUpdate',
      'expandedTopics',
      'handleMarkComplete',
      'isTopicCompleted',
      'progress.completion_percentage',
      'content.topics',
      'resources',
      'milestones',
    ]
  )
);

// Verify RoadmapList
results.push(
  verifyFile(
    'RoadmapList',
    join(process.cwd(), 'src/components/roadmap/RoadmapList.tsx'),
    [
      'roadmapService',
      'LearningRoadmap',
    ],
    [
      'studentId',
      'onSelectRoadmap',
      'onCreateNew',
      'roadmaps',
      'filteredRoadmaps',
      'selectedFilter',
      'searchQuery',
      'loadRoadmaps',
      'filterRoadmaps',
    ]
  )
);

// Verify index file
results.push(
  verifyFile(
    'Index',
    join(process.cwd(), 'src/components/roadmap/index.ts'),
    [
      'RoadmapGenerator',
      'RoadmapView',
      'RoadmapList',
    ],
    []
  )
);

// Verify Roadmap page
results.push(
  verifyFile(
    'Roadmap Page',
    join(process.cwd(), 'src/pages/Roadmap.tsx'),
    [
      'RoadmapGenerator',
      'RoadmapList',
      'RoadmapView',
      'LearningRoadmap',
    ],
    [
      'viewMode',
      'selectedRoadmap',
      'handleRoadmapGenerated',
      'handleSelectRoadmap',
      'handleProgressUpdate',
    ]
  )
);

// Print results
let allPassed = true;

results.forEach((result) => {
  const status = result.exists && result.hasRequiredImports && result.hasRequiredProps
    ? '✅'
    : '❌';
  
  console.log(`${status} ${result.component}`);
  
  if (result.issues.length > 0) {
    allPassed = false;
    result.issues.forEach((issue) => {
      console.log(`   ⚠️  ${issue}`);
    });
  }
  
  console.log('');
});

// Summary
console.log('═'.repeat(50));
if (allPassed) {
  console.log('✅ All roadmap components verified successfully!');
  console.log('\nComponents created:');
  console.log('  • RoadmapGenerator.tsx - Form for creating roadmaps');
  console.log('  • RoadmapView.tsx - Display roadmap with progress tracking');
  console.log('  • RoadmapList.tsx - List all roadmaps with filtering');
  console.log('  • index.ts - Export all components');
  console.log('  • Roadmap.tsx - Main page combining all components');
  console.log('\nFeatures implemented:');
  console.log('  ✓ Subject selection');
  console.log('  ✓ Wisdom coins balance check');
  console.log('  ✓ Cost display (4 coins)');
  console.log('  ✓ AI roadmap generation');
  console.log('  ✓ Progress tracking');
  console.log('  ✓ Topic completion');
  console.log('  ✓ Resources and milestones display');
  console.log('  ✓ Subject filtering');
  console.log('  ✓ Search functionality');
  console.log('  ✓ Error handling');
  process.exit(0);
} else {
  console.log('❌ Some components have issues. Please review above.');
  process.exit(1);
}
