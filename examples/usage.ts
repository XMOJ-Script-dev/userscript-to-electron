/**
 * Usage examples for userscript-to-electron converter
 */

import UserscriptConverter from '../src/converter';
import * as fs from 'fs';
import * as path from 'path';

// Example 1: Simple conversion
console.log('=== Example 1: Simple Conversion ===\n');

const simpleScript = `
// ==UserScript==
// @name        Simple Example
// @namespace   http://example.com/
// @version     1.0
// @grant       GM_log
// ==/UserScript==

console.log('Hello from Electron!');
`;

const converter = new UserscriptConverter();
const result = converter.convert(simpleScript);
console.log('Converted code length:', result.code.length);
console.log('Script name:', result.metadata.name);

// Example 2: With storage
console.log('\n=== Example 2: Storage Operations ===\n');

const storageScript = `
// ==UserScript==
// @name        Storage Example
// @namespace   http://example.com/
// @version     1.0
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// ==/UserScript==

(function() {
  // Initialize
  GM_setValue('userData', JSON.stringify({ visits: 1, lastVisit: new Date() }));
  
  // Retrieve
  const data = JSON.parse(GM_getValue('userData', '{}'));
  
  // List all keys
  const allKeys = GM_listValues();
  console.log('Stored keys:', allKeys);
  
  // Delete
  GM_deleteValue('tempData');
})();
`;

const result2 = converter.convert(storageScript);
console.log('Script name:', result2.metadata.name);
console.log('Grants:', result2.metadata.grant.join(', '));

// Example 3: HTTP requests
console.log('\n=== Example 3: HTTP Requests ===\n');

const httpScript = `
// ==UserScript==
// @name        HTTP Example
// @namespace   http://example.com/
// @version     1.0
// @match       https://api.example.com/*
// @grant       GM_xmlhttpRequest
// ==/UserScript==

(async function() {
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://api.example.com/data',
    headers: {
      'Accept': 'application/json'
    },
    onload: (response) => {
      console.log('Response status:', response.status);
      if (response.responseJSON) {
        console.log('Data:', response.responseJSON);
      }
    },
    onerror: (error) => {
      console.error('Request failed:', error.statusText);
    }
  });
})();
`;

const result3 = converter.convert(httpScript);
console.log('Script name:', result3.metadata.name);
console.log('Permissions needed: HTTP requests to protected sites');

// Example 4: Electron format
console.log('\n=== Example 4: ESM Format ===\n');

const esmConverter = new UserscriptConverter({
  format: 'esm',
});

const esmResult = esmConverter.convert(simpleScript);
console.log('Format: ESM');
console.log('Has export statements:', esmResult.code.includes('export'));

// Example 5: Wrapped execution
console.log('\n=== Example 5: Wrapped Execution ===\n');

const wrappedConverter = new UserscriptConverter({
  wrap: true,
});

const wrappedResult = wrappedConverter.convert(simpleScript);
console.log('Wrapped code starts with: (async function() {...');
console.log('Wrapped:', wrappedResult.code.startsWith('(async function'));

// Example 6: Converting from file
console.log('\n=== Example 6: File Conversion ===\n');

const exampleFilePath = path.join(__dirname, './page-counter.user.js');
if (fs.existsSync(exampleFilePath)) {
  const fileResult = converter.convertFile(exampleFilePath);
  console.log('Converted file:', fileResult.metadata.name);
  console.log('Grants:', fileResult.metadata.grant.join(', '));
  
  // Save output
  const outputPath = path.join(__dirname, './page-counter-electron.js');
  converter.save(fileResult, outputPath);
  console.log('Saved to:', outputPath);
}

console.log('\n=== All examples completed ===\n');
