// ==UserScript==
// @name        Page Counter
// @namespace   http://tampermonkey.net/
// @version     1.0
// @description Counts and displays usage statistics
// @author      User
// @match       *://*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_notification
// @run-at      document-end
// ==/UserScript==

(function() {
  'use strict';

  let count = GM_getValue('pageCount', 0);
  count++;
  GM_setValue('pageCount', count);

  console.log('Pages visited: ' + count);

  if (count % 10 === 0) {
    GM_notification('You have visited ' + count + ' pages!', 'Page Counter');
  }

  // Display counter on page
  const counter = document.createElement('div');
  counter.style.cssText = 'position:fixed;bottom:10px;right:10px;background:blue;color:white;padding:10px;z-index:9999;border-radius:5px;';
  counter.textContent = 'Pages: ' + count;
  document.body.appendChild(counter);
})();
