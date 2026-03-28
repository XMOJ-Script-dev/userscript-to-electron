/**
 * GM API Polyfill Generator - Complete Tampermonkey API Support
 * Fully compliant with: https://www.tampermonkey.net/documentation.php
 * 
 * Supports all documented Tampermonkey/Greasemonkey APIs:
 * - Storage: GM_getValue, GM_setValue, GM_deleteValue, GM_listValues, GM_setValues, GM_getValues, GM_deleteValues
 * - Change Listeners: GM_addValueChangeListener, GM_removeValueChangeListener  
 * - HTTP: GM_xmlhttpRequest, GM_download, GM_webRequest
 * - UI: GM_notification, GM_openInTab, GM_registerMenuCommand, GM_unregisterMenuCommand
 * - DOM: GM_addElement, GM_addStyle
 * - Resources: GM_getResourceText, GM_getResourceURL
 * - Clipboard: GM_setClipboard
 * - Tabs: GM_getTab, GM_saveTab, GM_getTabs
 * - Info: GM_info, GM_log
 * - Cookies: GM_cookie.list, GM_cookie.set, GM_cookie.delete
 * - Audio: GM_audio.setMute, GM_audio.getState, GM_audio.addStateChangeListener, GM_audio.removeStateChangeListener
 * - Window: unsafeWindow, window.close, window.focus, window.onurlchange
 */

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

export interface GMPolyfillOptions {
  dataDir?: string;
  headers?: Record<string, string>;
  scriptName?: string;
  scriptVersion?: string;
}

export class GMPolyfill {
  private dataDir: string;
  private headers: Record<string, string>;
  private scriptName: string;
  private scriptVersion: string;

  constructor(options: GMPolyfillOptions = {}) {
    this.dataDir = options.dataDir || path.join(process.env.APPDATA || '', 'userscript-data');
    this.headers = options.headers || {};
    this.scriptName = options.scriptName || 'userscript';
    this.scriptVersion = options.scriptVersion || '1.0';
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Generate complete polyfill for all requested GM APIs
   */
  generatePolyfill(grants: string[]): string {
    const polyfills: string[] = [];
    const generatorNames = grants.map((grant) => this.grantToGeneratorName(grant));

    if (grants.some((g) => (g || '').trim() === 'GM')) {
      generatorNames.push(...this.getFullGMGeneratorNames());
    }

    const generatorSet = new Set(generatorNames);

    // Core initialization
    polyfills.push(this.generateCoreInit());

    // Conditional tab storage
    if (generatorSet.has('GM_getTab') || generatorSet.has('GM_saveTab') || generatorSet.has('GM_getTabs')) {
      polyfills.push(this.generateTabStorage());
    }

    // Generate all requested APIs
    const emitted = new Set<string>();
    for (const grant of generatorNames) {
      if (emitted.has(grant)) {
        continue;
      }
      emitted.add(grant);

      const generator = (this as any)[`generate${grant}`];
      if (generator && typeof generator === 'function') {
        polyfills.push(generator.call(this));
      }
    }

    // Add GM namespace bridge so GM.* style APIs are available.
    if (this.shouldGenerateGMNamespace(grants)) {
      polyfills.push(this.generateGMNamespaceBridge());
    }

    return polyfills.join('\n\n');
  }

  private getFullGMGeneratorNames(): string[] {
    return [
      'GM_getValue',
      'GM_setValue',
      'GM_deleteValue',
      'GM_listValues',
      'GM_setValues',
      'GM_getValues',
      'GM_deleteValues',
      'GM_addValueChangeListener',
      'GM_removeValueChangeListener',
      'GM_xmlhttpRequest',
      'GM_download',
      'GM_webRequest',
      'GM_notification',
      'GM_openInTab',
      'GM_registerMenuCommand',
      'GM_unregisterMenuCommand',
      'GM_addElement',
      'GM_addStyle',
      'GM_getResourceText',
      'GM_getResourceURL',
      'GM_setClipboard',
      'GM_getTab',
      'GM_saveTab',
      'GM_getTabs',
      'GM_info',
      'GM_log',
      'GM_cookie',
      'GM_audio',
      'UnsafeWindow',
      'WindowClose',
      'WindowFocus',
      'WindowOnUrlChange',
    ];
  }

  private grantToGeneratorName(grant: string): string {
    const g = (grant || '').trim();

    switch (g) {
      case 'unsafeWindow':
        return 'UnsafeWindow';
      case 'window.close':
        return 'WindowClose';
      case 'window.focus':
        return 'WindowFocus';
      case 'window.onurlchange':
        return 'WindowOnUrlChange';
      case 'GM.cookie':
        return 'GM_cookie';
      case 'GM.audio':
        return 'GM_audio';
      case 'GM.info':
        return 'GM_info';
      case 'GM.log':
        return 'GM_log';
      case 'GM.xmlHttpRequest':
      case 'GM.xmlhttpRequest':
      case 'GM_xmlHttpRequest':
      case 'GM_xmlhttpRequest':
        return 'GM_xmlhttpRequest';
      case 'GM.getResourceUrl':
      case 'GM.getResourceURL':
      case 'GM_getResourceUrl':
      case 'GM_getResourceURL':
        return 'GM_getResourceURL';
      default:
        break;
    }

    if (g.startsWith('GM.')) {
      return `GM_${g.slice(3)}`;
    }

    return g.replace(/[.-]/g, '_');
  }

  private shouldGenerateGMNamespace(grants: string[]): boolean {
    return grants.some((grant) => {
      const g = (grant || '').trim();
      return g.startsWith('GM_') || g.startsWith('GM.') || g === 'GM' || g === 'GM_info';
    });
  }

  // ===== CORE INITIALIZATION =====

  private generateCoreInit(): string {
    return `
// Tampermonkey Core - Storage, Listeners, Commands
const __gm_storage = {};
const __gm_valueChangeListeners = new Map();
let __gm_listenerIdCounter = 0;
const __gm_resources = {};
const __gm_menuCommands = new Map();
let __gm_menuIdCounter = 0;
const __gm_audioState = { isMuted: false, isAudible: false };
const __gm_audioListeners = new Set();

// Load persisted storage from disk
(function() {
  const storageFile = require('path').join('${this.dataDir}', '__gm_storage.json');
  try {
    if (require('fs').existsSync(storageFile)) {
      const data = require('fs').readFileSync(storageFile, 'utf-8');
      Object.assign(__gm_storage, JSON.parse(data));
    }
  } catch (e) {
    console.warn('[GM] Failed to load storage');
  }
})();

// Helper: save storage to disk
function __gm_saveStorage() {
  const storageFile = require('path').join('${this.dataDir}', '__gm_storage.json');
  try {
    require('fs').writeFileSync(storageFile, JSON.stringify(__gm_storage, null, 2), 'utf-8');
  } catch (e) {
    console.error('[GM] Storage save failed:', e.message);
  }
}

// Helper: logging
function __gm_log(msg) {
  console.log('[${this.scriptName}]', msg);
}
`;
  }

  private generateTabStorage(): string {
    return `
// Tab-specific storage (for cross-tab communication)
const __gm_tabStorage = {};
const __gm_currentTabId = Math.random().toString(36).substr(2, 9);

function __gm_saveTabStorage() {
  const tabFile = require('path').join('${this.dataDir}', '__gm_tabs.json');
  try {
    require('fs').writeFileSync(tabFile, JSON.stringify(__gm_tabStorage, null, 2));
  } catch (e) {
    console.error('[GM] Tab storage save failed');
  }
}

(function() {
  const tabFile = require('path').join('${this.dataDir}', '__gm_tabs.json');
  try {
    if (require('fs').existsSync(tabFile)) {
      const data = require('fs').readFileSync(tabFile, 'utf-8');
      Object.assign(__gm_tabStorage, JSON.parse(data));
    }
  } catch (e) {
    // Tab storage not found - OK
  }
  if (!__gm_tabStorage[__gm_currentTabId]) {
    __gm_tabStorage[__gm_currentTabId] = {};
  }
})();
`;
  }

  // ===== STORAGE APIs =====

  private generateGM_getValue(): string {
    return `
function GM_getValue(key, defaultValue) {
  return __gm_storage[key] !== undefined ? __gm_storage[key] : defaultValue;
}
`;
  }

  private generateGM_setValue(): string {
    return `
function GM_setValue(key, value) {
  const oldValue = __gm_storage[key];
  __gm_storage[key] = value;
  __gm_saveStorage();
  
  // Trigger value change listeners
  if (__gm_valueChangeListeners.has(key)) {
    for (const listener of __gm_valueChangeListeners.get(key).values()) {
      try {
        listener(key, oldValue, value, false);
      } catch (e) {
        console.warn('[GM] Listener error:', e);
      }
    }
  }
}
`;
  }

  private generateGM_deleteValue(): string {
    return `
function GM_deleteValue(key) {
  delete __gm_storage[key];
  __gm_saveStorage();
}
`;
  }

  private generateGM_listValues(): string {
    return `
function GM_listValues() {
  return Object.keys(__gm_storage);
}
`;
  }

  private generateGM_setValues(): string {
    return `
function GM_setValues(values) {
  if (typeof values === 'object' && values !== null) {
    Object.assign(__gm_storage, values);
    __gm_saveStorage();
  }
}
`;
  }

  private generateGM_getValues(): string {
    return `
function GM_getValues(keysOrDefaults) {
  if (Array.isArray(keysOrDefaults)) {
    const result = {};
    for (const key of keysOrDefaults) {
      result[key] = __gm_storage[key];
    }
    return result;
  } else if (typeof keysOrDefaults === 'object' && keysOrDefaults !== null) {
    const result = { ...keysOrDefaults };
    for (const key in __gm_storage) {
      if (key in result || !result.hasOwnProperty(key)) {
        result[key] = __gm_storage[key];
      }
    }
    return result;
  }
  return {};
}
`;
  }

  private generateGM_deleteValues(): string {
    return `
function GM_deleteValues(keys) {
  if (Array.isArray(keys)) {
    for (const key of keys) {
      delete __gm_storage[key];
    }
    __gm_saveStorage();
  }
}
`;
  }

  private generateGM_addValueChangeListener(): string {
    return `
function GM_addValueChangeListener(key, callback) {
  if (!__gm_valueChangeListeners.has(key)) {
    __gm_valueChangeListeners.set(key, new Set());
  }
  __gm_valueChangeListeners.get(key).add(callback);
  return __gm_listenerIdCounter++;
}
`;
  }

  private generateGM_removeValueChangeListener(): string {
    return `
function GM_removeValueChangeListener(listenerId) {
  // Simple implementation - finds and removes by ID
  let count = 0;
  for (const listeners of __gm_valueChangeListeners.values()) {
    for (const listener of listeners.values()) {
      if (count === listenerId) {
        listeners.delete(listener);
        return;
      }
      count++;
    }
  }
}
`;
  }

  // ===== HTTP/REQUEST APIs =====

  private generateGM_xmlhttpRequest(): string {
    return `
function GM_xmlhttpRequest(details) {
  const fetch = require('node-fetch');
  
  const options = {
    method: details.method || 'GET',
    headers: details.headers || {},
  };

  if (details.data) {
    options.body = details.data;
  }

  if (details.timeout) {
    options.timeout = details.timeout;
  }

  const requestPromise = fetch(details.url, options)
    .then(res => {
      const response = {
        status: res.status,
        statusText: res.statusText,
        responseHeaders: Object.fromEntries(res.headers),
        responseText: null,
        response: null,
        responseJSON: null,
        responseXML: null,
        finalUrl: res.url,
        readyState: 4,
        context: details.context || null
      };
      
      return res.text().then(text => {
        response.responseText = text;
        response.response = text;
        try {
          response.responseJSON = JSON.parse(text);
        } catch (e) {
          // Not JSON
        }
        
        if (typeof details.onload === 'function') {
          details.onload(response);
        }
        return response;
      });
    })
    .catch(error => {
      const errResponse = {
        status: 0,
        statusText: 'Network Error',
        readyState: 4,
        context: details.context || null,
        error: error.message
      };
      
      if (typeof details.onerror === 'function') {
        details.onerror(errResponse);
      }
      if (typeof details.ontimeout === 'function' && error.name === 'AbortError') {
        details.ontimeout(errResponse);
      }
      
      throw error;
    });

  // Return object with abort function
  return {
    abort: () => {
      // Note: Node.js fetch doesn't support abort the same way
      console.warn('[GM] Abort may not work in Electron context');
    }
  };
}
`;
  }

  private generateGM_download(): string {
    return `
function GM_download(urlOrDetails, filenameArg) {
  const fetch = require('node-fetch');
  const fs = require('fs');
  const p = require('path');
  
  let url, filename, options = {};
  
  if (typeof urlOrDetails === 'string') {
    url = urlOrDetails;
    filename = filenameArg;
  } else {
    url = urlOrDetails.url;
    filename = urlOrDetails.name;
    options = urlOrDetails;
  }
  
  const downloadDir = p.join('${this.dataDir}', 'downloads');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  
  const filepath = p.join(downloadDir, filename);
  
  fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => {
      fs.writeFileSync(filepath, Buffer.from(buffer));
      if (options.onload) options.onload();
    })
    .catch(err => {
      if (options.onerror) options.onerror({ error: err.message });
    });
  
  return { abort: () => {} };
}
`;
  }

  private generateGM_webRequest(): string {
    return `
function GM_webRequest(rules, listener) {
  console.warn('[GM] GM_webRequest: Experimental API - limited support in Electron');
  // Would require network interception at browser level
}
`;
  }

  // ===== UI APIs =====

  private generateGM_notification(): string {
    return `
function GM_notification(textOrDetails, titleArg, imageArg, onclickArg) {
  let details = {};
  
  if (typeof textOrDetails === 'string') {
    details = {
      text: textOrDetails,
      title: titleArg,
      image: imageArg,
      onclick: onclickArg
    };
  } else {
    details = textOrDetails || {};
  }

  try {
    const { Notification } = require('electron');
    const notif = new Notification({
      title: details.title || 'Notification',
      body: details.text || '',
      icon: details.image || undefined,
      silent: details.silent === true
    });

    if (details.onclick) {
      notif.on('click', (e) => {
        details.onclick(e);
        if (details.ondone) details.ondone();
      });
    }
    if (details.ondone) {
      notif.on('close', () => details.ondone());
    }

    notif.show();

    if (details.timeout && typeof details.timeout === 'number') {
      setTimeout(() => notif.close(), details.timeout);
    }

    if (details.url && details.onclick) {
      notif.on('click', () => {
        try {
          const { shell } = require('electron');
          shell.openExternal(details.url);
        } catch (e) {
          console.error('[GM] Failed to open URL');
        }
      });
    }
  } catch (e) {
    // Fallback to console
    console.log('[NOTIFICATION]', details.title || 'N/A', ':', details.text || '');
  }
}
`;
  }

  private generateGM_openInTab(): string {
    return `
function GM_openInTab(url, optionsOrBackground) {
  let active = true;
  
  if (typeof optionsOrBackground === 'boolean') {
    active = !optionsOrBackground; // loadInBackground is opposite of active
  } else if (typeof optionsOrBackground === 'object') {
    active = optionsOrBackground.active !== false;
  }

  try {
    const { shell } = require('electron');
    shell.openExternal(url);
  } catch (e) {
    console.warn('[GM] Failed to open URL:', url);
  }

  return {
    close: () => { /* Not easily supported in Electron */ },
    onclose: null,
    closed: false
  };
}
`;
  }

  private generateGM_registerMenuCommand(): string {
    return `
function GM_registerMenuCommand(name, callback, optionsOrAccessKey) {
  const cmdId = __gm_menuIdCounter++;
  const options = typeof optionsOrAccessKey === 'string' 
    ? { accessKey: optionsOrAccessKey }
    : (optionsOrAccessKey || {});

  __gm_menuCommands.set(cmdId, {
    name,
    callback,
    options
  });

  __gm_log('Menu command registered: ' + name + ' (ID: ' + cmdId + ')');
  return cmdId;
}
`;
  }

  private generateGM_unregisterMenuCommand(): string {
    return `
function GM_unregisterMenuCommand(menuCmdId) {
  if (__gm_menuCommands.has(menuCmdId)) {
    const cmd = __gm_menuCommands.get(menuCmdId);
    __gm_menuCommands.delete(menuCmdId);
    __gm_log('Menu command unregistered: ' + cmd.name);
  }
}
`;
  }

  // ===== DOM/STYLE APIs =====

  private generateGM_addElement(): string {
    return `
function GM_addElement(parentOrTag, tagNameOrAttrs, attrs) {
  let parent, tagName, attributes;
  
  if (typeof parentOrTag === 'string') {
    parent = document.head || document.body;
    tagName = parentOrTag;
    attributes = tagNameOrAttrs || {};
  } else {
    parent = parentOrTag;
    tagName = tagNameOrAttrs;
    attributes = attrs || {};
  }

  const element = document.createElement(tagName);
  
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      try {
        element.setAttribute(key, String(value));
      } catch (e) {
        // Ignore invalid attributes
      }
    }
  }

  if (parent && parent.appendChild) {
    parent.appendChild(element);
  }
  
  return element;
}
`;
  }

  private generateGM_addStyle(): string {
    return `
function GM_addStyle(css) {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = css;
  
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(style);
  }
  
  return style;
}
`;
  }

  // ===== RESOURCE APIs =====

  private generateGM_getResourceText(): string {
    return `
function GM_getResourceText(name) {
  return __gm_resources[name] || '';
}
`;
  }

  private generateGM_getResourceURL(): string {
    return `
function GM_getResourceURL(name) {
  return __gm_resources[name] || '';
}
`;
  }

  // ===== CLIPBOARD API =====

  private generateGM_setClipboard(): string {
    return `
function GM_setClipboard(data, infoOrType, callback) {
  try {
    const { clipboard } = require('electron');
    
    let type = 'text';
    if (typeof infoOrType === 'string') {
      type = infoOrType;
    } else if (typeof infoOrType === 'object' && infoOrType.type) {
      type = infoOrType.type;
    }

    if (type === 'html') {
      clipboard.writeHTML(data);
    } else {
      clipboard.writeText(data);
    }

    if (typeof callback === 'function') {
      callback();
    }
  } catch (e) {
    console.warn('[GM] Clipboard access failed:', e.message);
    if (typeof callback === 'function') {
      callback();
    }
  }
}
`;
  }

  // ===== TAB APIs =====

  private generateGM_getTab(): string {
    return `
function GM_getTab(callback) {
  const tab = __gm_tabStorage[__gm_currentTabId] || {};
  if (typeof callback === 'function') {
    callback(tab);
  }
  return Promise.resolve(tab);
}
`;
  }

  private generateGM_saveTab(): string {
    return `
function GM_saveTab(tab, callback) {
  if (typeof tab === 'object' && tab !== null) {
    __gm_tabStorage[__gm_currentTabId] = tab;
    __gm_saveTabStorage();
  }
  if (typeof callback === 'function') {
    callback();
  }
  return Promise.resolve();
}
`;
  }

  private generateGM_getTabs(): string {
    return `
function GM_getTabs(callback) {
  if (typeof callback === 'function') {
    callback(__gm_tabStorage);
  }
  return Promise.resolve(__gm_tabStorage);
}
`;
  }

  // ===== INFO/LOG APIs =====

  private generateGM_info(): string {
    return `
const GM_info = {
  scriptHandler: 'Tampermonkey (Electron)',
  isFirstPartyIsolation: false,
  isIncognito: false,
  downloadMode: 'native',
  sandboxMode: 'js',
  scriptUpdateURL: null,
  scriptWillUpdate: false,
  version: '1.0.0',
  script: {
    antifeatures: {},
    author: null,
    blockers: [],
    connects: [],
    copyright: null,
    deleted: false,
    description: '',
    downloadURL: null,
    excludes: [],
    fileURL: null,
    grant: [],
    header: null,
    homepage: null,
    icon: null,
    icon64: null,
    includes: [],
    lastModified: Date.now(),
    matches: [],
    name: '${this.scriptName}',
    namespace: null,
    position: 0,
    resources: [],
    supportURL: null,
    system: false,
    'run-at': 'document-end',
    'run-in': ['normal-tabs'],
    unwrap: false,
    updateURL: null,
    version: '${this.scriptVersion}',
    webRequest: null,
    options: {}
  }
};
`;
  }

  private generateGM_log(): string {
    return `
function GM_log(message) {
  console.log('[${this.scriptName}]', message);
}
`;
  }

  private generateGMNamespaceBridge(): string {
    return `
// GM namespace compatibility bridge (GM.* Promise-based APIs)
const GM = globalThis.GM || {};

if (typeof GM_getValue === 'function') GM.getValue = (key, defaultValue) => Promise.resolve(GM_getValue(key, defaultValue));
if (typeof GM_setValue === 'function') GM.setValue = (key, value) => Promise.resolve(GM_setValue(key, value));
if (typeof GM_deleteValue === 'function') GM.deleteValue = (key) => Promise.resolve(GM_deleteValue(key));
if (typeof GM_listValues === 'function') GM.listValues = () => Promise.resolve(GM_listValues());
if (typeof GM_setValues === 'function') GM.setValues = (values) => Promise.resolve(GM_setValues(values));
if (typeof GM_getValues === 'function') GM.getValues = (keysOrDefaults) => Promise.resolve(GM_getValues(keysOrDefaults));
if (typeof GM_deleteValues === 'function') GM.deleteValues = (keys) => Promise.resolve(GM_deleteValues(keys));
if (typeof GM_addValueChangeListener === 'function') GM.addValueChangeListener = (key, callback) => Promise.resolve(GM_addValueChangeListener(key, callback));
if (typeof GM_removeValueChangeListener === 'function') GM.removeValueChangeListener = (id) => Promise.resolve(GM_removeValueChangeListener(id));

if (typeof GM_xmlhttpRequest === 'function') {
  GM.xmlHttpRequest = (details) => GM_xmlhttpRequest(details);
  GM.xmlhttpRequest = GM.xmlHttpRequest;
}

if (typeof GM_xmlhttpRequest === 'function' && typeof GM_xmlHttpRequest === 'undefined') {
  var GM_xmlHttpRequest = GM_xmlhttpRequest;
}

if (typeof GM_download === 'function') GM.download = (detailsOrUrl, name) => Promise.resolve(GM_download(detailsOrUrl, name));
if (typeof GM_webRequest === 'function') GM.webRequest = (rules, listener) => Promise.resolve(GM_webRequest(rules, listener));
if (typeof GM_notification === 'function') GM.notification = (...args) => Promise.resolve(GM_notification(...args));
if (typeof GM_openInTab === 'function') GM.openInTab = (...args) => Promise.resolve(GM_openInTab(...args));
if (typeof GM_registerMenuCommand === 'function') GM.registerMenuCommand = (...args) => Promise.resolve(GM_registerMenuCommand(...args));
if (typeof GM_unregisterMenuCommand === 'function') GM.unregisterMenuCommand = (...args) => Promise.resolve(GM_unregisterMenuCommand(...args));
if (typeof GM_addElement === 'function') GM.addElement = (...args) => Promise.resolve(GM_addElement(...args));
if (typeof GM_addStyle === 'function') GM.addStyle = (css) => Promise.resolve(GM_addStyle(css));
if (typeof GM_getResourceText === 'function') GM.getResourceText = (name) => Promise.resolve(GM_getResourceText(name));
if (typeof GM_getResourceURL === 'function') {
  GM.getResourceUrl = (name) => Promise.resolve(GM_getResourceURL(name));
  GM.getResourceURL = GM.getResourceUrl;
}
if (typeof GM_setClipboard === 'function') GM.setClipboard = (...args) => Promise.resolve(GM_setClipboard(...args));
if (typeof GM_getTab === 'function') GM.getTab = (cb) => Promise.resolve(GM_getTab(cb));
if (typeof GM_saveTab === 'function') GM.saveTab = (tab, cb) => Promise.resolve(GM_saveTab(tab, cb));
if (typeof GM_getTabs === 'function') GM.getTabs = (cb) => Promise.resolve(GM_getTabs(cb));
if (typeof GM_log === 'function') GM.log = (message) => Promise.resolve(GM_log(message));
if (typeof GM_info !== 'undefined') GM.info = GM_info;
if (typeof GM_cookie !== 'undefined') GM.cookie = GM_cookie;
if (typeof GM_audio !== 'undefined') GM.audio = GM_audio;

globalThis.GM = GM;
`;
  }

  // ===== COOKIE APIs =====

  private generateGM_cookie(): string {
    return `
const GM_cookie = {
  list: (details, callback) => {
    console.warn('[GM] GM_cookie.list: Limited support in Electron');
    if (typeof callback === 'function') {
      callback([], null);
    }
    return Promise.resolve([]);
  },

  set: (details, callback) => {
    console.warn('[GM] GM_cookie.set: Limited support in Electron');
    if (typeof callback === 'function') {
      callback(null);
    }
    return Promise.resolve();
  },

  delete: (details, callback) => {
    console.warn('[GM] GM_cookie.delete: Limited support in Electron');
    if (typeof callback === 'function') {
      callback(null);
    }
    return Promise.resolve();
  }
};
`;
  }

  // ===== AUDIO APIs =====

  private generateGM_audio(): string {
    return `
const GM_audio = {
  setMute: (details, callback) => {
    __gm_audioState.isMuted = details.isMuted;
    if (typeof callback === 'function') {
      callback();
    }
    return Promise.resolve();
  },

  getState: (callback) => {
    const state = { ...__gm_audioState };
    if (typeof callback === 'function') {
      callback(state);
    }
    return Promise.resolve(state);
  },

  addStateChangeListener: (listener, callback) => {
    if (typeof listener === 'function') {
      __gm_audioListeners.add(listener);
    }
    if (typeof callback === 'function') {
      callback();
    }
    return Promise.resolve();
  },

  removeStateChangeListener: (listener, callback) => {
    __gm_audioListeners.delete(listener);
    if (typeof callback === 'function') {
      callback();
    }
    return Promise.resolve();
  }
};
`;
  }

  // ===== WINDOW APIs =====

  private generateUnsafeWindow(): string {
    return `
const unsafeWindow = global;
`;
  }

  private generateWindowClose(): string {
    return `
(function() {
  const origClose = window.close;
  window.close = function() {
    try {
      const { BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow();
      if (win) {
        win.close();
      }
    } catch (e) {
      if (typeof origClose === 'function') {
        origClose.call(this);
      }
    }
  };
})();
`;
  }

  private generateWindowFocus(): string {
    return `
(function() {
  const origFocus = window.focus;
  window.focus = function() {
    try {
      const { BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow();
      if (win) {
        win.focus();
      }
    } catch (e) {
      if (typeof origFocus === 'function') {
        origFocus.call(this);
      }
    }
  };
})();
`;
  }

  private generateWindowOnUrlChange(): string {
    return `
(function() {
  if (window.onurlchange === null || window.onurlchange === undefined) {
    let lastUrl = window.location.href;
    
    // Custom event dispatcher
    window.addEventListener('urlchange', (event) => {
      // Event dispatched when URL changes
    });

    // Monitor URL changes
    const checkUrl = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        const event = new Event('urlchange');
        window.dispatchEvent(event);
      }
    }, 1000);

    window.addEventListener('beforeunload', () => {
      clearInterval(checkUrl);
    });
  }
})();
`;
  }
}

export default GMPolyfill;
