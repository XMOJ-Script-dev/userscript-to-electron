/**
 * Simple test and demo script
 */

import UserscriptConverter from './converter';
import * as fs from 'fs';
import * as path from 'path';

console.log('Testing UserScript to Electron Converter\n');

// Test basic conversion
const testScript = `
// ==UserScript==
// @name        Test Script
// @namespace   http://example.com/
// @version     1.0
// @description A test script
// @author      Test Author
// @match       https://example.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==

console.log('Hello from userscript!');

let value = GM_getValue('myKey', 'default');
console.log('Stored value:', value);

GM_setValue('myKey', 'newValue');
`;

try {
  const converter = new UserscriptConverter({
    dataDir: path.join(__dirname, '../data'),
  });

  const result = converter.convert(testScript);

  console.log('✓ Conversion successful');
  console.log('\nMetadata:');
  console.log('  Name:', result.metadata.name);
  console.log('  Version:', result.metadata.version);
  console.log('  Grants:', result.metadata.grant.join(', '));

  console.log('\n--- Generated Code Preview ---');
  console.log(result.code.substring(0, 500) + '...\n');

  // Test file conversion
  const exampleFile = path.join(__dirname, '../examples/page-counter.user.js');
  if (fs.existsSync(exampleFile)) {
    console.log('Converting example file:', exampleFile);
    const result2 = converter.convertFile(exampleFile);
    console.log('✓ Example file converted successfully');
    console.log('  Name:', result2.metadata.name);

    const outputFile = path.join(__dirname, '../dist/page-counter.js');
    converter.save(result2, outputFile);
    console.log('✓ Saved to:', outputFile);
  }

  console.log('\n✓ All tests passed!');
} catch (error) {
  console.error('✗ Test failed:', error);
  process.exit(1);
}
