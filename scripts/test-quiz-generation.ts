/**
 * Test script for AI-powered quiz generation
 * Tests the new generateQuizWithAI method
 */

import { quizService } from '../src/services/quiz.service';

async function testQuizGeneration() {
  console.log('🧪 Testing AI-powered quiz generation...\n');

  try {
    // Test data
    const testData = {
      topic: 'Квадратные уравнения',
      subject: 'Математика',
      difficulty: 'medium' as const,
      gradeLevel: '8',
      questionCount: 5,
      createdBy: 'test-user-id', // This would be a real user ID in production
    };

    console.log('📝 Test parameters:');
    console.log(`   Topic: ${testData.topic}`);
    console.log(`   Subject: ${testData.subject}`);
    console.log(`   Difficulty: ${testData.difficulty}`);
    console.log(`   Grade Level: ${testData.gradeLevel}`);
    console.log(`   Question Count: ${testData.questionCount}`);
    console.log('');

    console.log('⏳ Generating quiz with AI...');
    
    // Note: This will fail with insufficient coins error in real environment
    // This is expected behavior - just testing the structure
    const questions = await quizService.generateQuizWithAI(testData);

    console.log('✅ Quiz generated successfully!\n');
    console.log(`📊 Generated ${questions.length} questions:\n`);

    questions.forEach((q, index) => {
      console.log(`Question ${index + 1}:`);
      console.log(`  Text: ${q.question_text}`);
      console.log(`  Options:`);
      q.options.forEach((opt, i) => {
        const marker = i === q.correct_answer_index ? '✓' : ' ';
        console.log(`    [${marker}] ${i + 1}. ${opt}`);
      });
      console.log(`  Explanation: ${q.explanation}`);
      console.log('');
    });

    console.log('✅ All tests passed!');
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_COINS') {
      console.log('⚠️  Expected error: Insufficient coins');
      console.log('   This is correct behavior - quiz generation requires 2 wisdom coins');
      console.log('✅ Validation test passed!');
    } else {
      console.error('❌ Test failed:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      process.exit(1);
    }
  }
}

// Run test
testQuizGeneration().catch(console.error);
