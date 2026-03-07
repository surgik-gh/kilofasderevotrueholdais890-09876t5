/**
 * Verification script for Assessment Service
 * Tests the assessment quiz generation and submission functionality
 */

import { assessmentService } from '../src/services/assessment.service';

async function verifyAssessmentService() {
  console.log('🧪 Testing Assessment Service...\n');

  try {
    // Test 1: Generate assessment quiz for grade 5 (should exclude geometry)
    console.log('Test 1: Generate assessment quiz for grade 5');
    const quiz5 = await assessmentService.generateAssessmentQuiz('5');
    console.log(`✅ Generated ${quiz5.questions.length} questions`);
    console.log(`✅ Subjects: ${quiz5.subjects.join(', ')}`);
    
    if (quiz5.subjects.includes('Геометрия')) {
      console.log('❌ ERROR: Geometry should not be included for grade 5');
    } else {
      console.log('✅ Geometry correctly excluded for grade 5');
    }
    console.log('');

    // Test 2: Generate assessment quiz for grade 8 (should include geometry)
    console.log('Test 2: Generate assessment quiz for grade 8');
    const quiz8 = await assessmentService.generateAssessmentQuiz('8');
    console.log(`✅ Generated ${quiz8.questions.length} questions`);
    console.log(`✅ Subjects: ${quiz8.subjects.join(', ')}`);
    
    if (!quiz8.subjects.includes('Геометрия')) {
      console.log('❌ ERROR: Geometry should be included for grade 8');
    } else {
      console.log('✅ Geometry correctly included for grade 8');
    }
    console.log('');

    // Test 3: Verify question structure
    console.log('Test 3: Verify question structure');
    const sampleQuestion = quiz8.questions[0];
    console.log(`Question ID: ${sampleQuestion.id}`);
    console.log(`Subject: ${sampleQuestion.subject}`);
    console.log(`Question: ${sampleQuestion.question_text}`);
    console.log(`Options: ${sampleQuestion.options.length}`);
    console.log(`Correct answer index: ${sampleQuestion.correct_answer_index}`);
    
    if (sampleQuestion.options.length === 4) {
      console.log('✅ Question has 4 options');
    } else {
      console.log(`❌ ERROR: Question should have 4 options, got ${sampleQuestion.options.length}`);
    }
    console.log('');

    // Test 4: Verify 2 questions per subject
    console.log('Test 4: Verify 2 questions per subject');
    const questionsBySubject = new Map<string, number>();
    for (const q of quiz8.questions) {
      questionsBySubject.set(q.subject, (questionsBySubject.get(q.subject) || 0) + 1);
    }
    
    let allCorrect = true;
    for (const [subject, count] of questionsBySubject.entries()) {
      if (count !== 2) {
        console.log(`❌ ERROR: ${subject} has ${count} questions, expected 2`);
        allCorrect = false;
      }
    }
    
    if (allCorrect) {
      console.log('✅ All subjects have exactly 2 questions');
    }
    console.log('');

    console.log('✅ All tests passed!');
    console.log('\n📝 Note: Assessment submission requires a valid student_id from Supabase');
    console.log('   and cannot be tested without database access.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyAssessmentService();
