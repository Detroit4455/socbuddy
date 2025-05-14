/**
 * Test file to check notification settings handling
 * Run with: node src/app/api/test-notification.js
 */

// Simulate different setting values that might come from the database
const testSettings = [
  { key: 'test1', value: true },
  { key: 'test2', value: false },
  { key: 'test3', value: 'true' },
  { key: 'test4', value: 'false' },
  { key: 'test5', value: 1 },
  { key: 'test6', value: 0 },
  { key: 'test7', value: null },
  { key: 'test8', value: undefined }
];

console.log('============= NOTIFICATION SETTINGS TEST =============');
console.log('Testing how different value formats affect notification status');
console.log('------------------------------------------------------');

testSettings.forEach(setting => {
  // Simple check - this is what the code was doing before
  const simpleCheck = setting.value ? true : false;
  
  // Better check - explicit comparison with different possible values
  const explicitCheck = setting.value === true || 
                        setting.value === 'true' || 
                        setting.value === 1;
  
  // Direct boolean conversion
  const booleanConversion = Boolean(setting.value);
  
  console.log(`\nKey: ${setting.key}, Value: ${setting.value} (type: ${typeof setting.value})`);
  console.log(`- Simple check (value ? true : false): ${simpleCheck}`);
  console.log(`- Explicit check (value === true || value === 'true' || value === 1): ${explicitCheck}`);
  console.log(`- Boolean conversion (Boolean(value)): ${booleanConversion}`);
});

console.log('\n======================================================');
console.log('RECOMMENDATION:');
console.log('For strict checking of notification settings being enabled:');
console.log('setting.value === true || setting.value === "true" || setting.value === 1');
console.log('This ensures that only explicitly enabled values activate notifications');
console.log('======================================================'); 