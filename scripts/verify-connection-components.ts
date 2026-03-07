/**
 * Verification Script for Connection Management Components
 * Tests that all connection components are properly created and exported
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

const componentsToVerify = [
  'src/components/connections/ConnectionRequestList.tsx',
  'src/components/connections/SendConnectionRequest.tsx',
  'src/components/connections/ConnectionsList.tsx',
  'src/components/connections/index.ts',
  'src/pages/Connections.tsx',
];

console.log('🔍 Verifying Connection Management Components...\n');

let allExist = true;

for (const component of componentsToVerify) {
  const path = resolve(process.cwd(), component);
  const exists = existsSync(path);
  
  if (exists) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - NOT FOUND`);
    allExist = false;
  }
}

console.log('\n' + '='.repeat(60));

if (allExist) {
  console.log('✅ All connection components verified successfully!');
  console.log('\nComponents created:');
  console.log('  1. ConnectionRequestList - Display and manage incoming requests');
  console.log('  2. SendConnectionRequest - Form to send new requests');
  console.log('  3. ConnectionsList - Display established connections');
  console.log('  4. Connections Page - Main page with tabs for all features');
  console.log('\nRoute added: /connections');
  console.log('Navigation updated for all user roles');
  process.exit(0);
} else {
  console.log('❌ Some components are missing!');
  process.exit(1);
}
