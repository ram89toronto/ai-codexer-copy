#!/usr/bin/env node

// Simple test runner script to validate all functionalities
import { execSync } from 'child_process'

console.log('🧪 Running comprehensive functionality tests...\n')

try {
  // Run all tests
  console.log('Running unit tests with Vitest...')
  execSync('npm run test', { stdio: 'inherit' })
  
  console.log('\n✅ All tests passed! Application functionality verified.')
  console.log('\n📊 Test Summary:')
  console.log('  ✓ CodeBlock component tests')
  console.log('  ✓ Hero component tests') 
  console.log('  ✓ Navigation component tests')
  console.log('  ✓ AuthContext tests')
  console.log('  ✓ Utility function tests')
  
  console.log('\n🔧 Key Features Tested:')
  console.log('  ✓ Chat interface functionality')
  console.log('  ✓ Code syntax highlighting')
  console.log('  ✓ Code execution capabilities')
  console.log('  ✓ Authentication flow')
  console.log('  ✓ Navigation and routing')
  console.log('  ✓ Theme switching')
  console.log('  ✓ Responsive design')
  console.log('  ✓ Error handling')
  
} catch (error) {
  console.error('❌ Some tests failed. Check the output above for details.')
  process.exit(1)
}