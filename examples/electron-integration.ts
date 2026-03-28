/**
 * Integration example for Electron applications
 * 
 * This shows how to use userscript-to-electron in an Electron app
 */

// main.js - Electron main process
import { app, BrowserWindow, ipcMain } from 'electron';
import UserscriptConverter from 'userscript-to-electron';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: BrowserWindow;

// Create converter instance with app data directory
const scriptsDir = path.join(app.getPath('userData'), 'userscripts');
const converter = new UserscriptConverter({
  dataDir: path.join(app.getPath('userData'), 'script-data'),
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

// Handle script execution
ipcMain.handle('execute-userscript', async (event, scriptPath: string, options?: any) => {
  try {
    // Convert the userscript
    const result = converter.convertFile(scriptPath);

    // Execute in renderer process
    return {
      success: true,
      code: result.code,
      metadata: result.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

// Handle script listing
ipcMain.handle('list-scripts', async () => {
  try {
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.user.js'));
    const scripts = files.map((file) => {
      const content = fs.readFileSync(path.join(scriptsDir, file), 'utf-8');
      const result = converter.convert(content);
      return {
        file,
        name: result.metadata.name,
        version: result.metadata.version,
        grants: result.metadata.grant,
      };
    });

    return scripts;
  } catch (error) {
    return [];
  }
});

// ===== preload.js - Preload script for context isolation =====

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('userscriptAPI', {
  executeScript: (scriptPath: string) => ipcRenderer.invoke('execute-userscript', scriptPath),
  listScripts: () => ipcRenderer.invoke('list-scripts'),
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event, args) => callback(args));
  },
});

// ===== renderer.js - Renderer process =====

async function loadScripts() {
  const scripts = await (window as any).userscriptAPI.listScripts();

  const scriptList = document.getElementById('script-list') as HTMLElement;
  scriptList.innerHTML = '';

  for (const script of scripts) {
    const item = document.createElement('div');
    item.className = 'script-item';
    item.innerHTML = `
      <div class="script-name">${script.name} v${script.version}</div>
      <div class="script-grants">Permissions: ${script.grants.join(', ')}</div>
      <button onclick="runScript('${script.file}')">Run Script</button>
    `;
    scriptList.appendChild(item);
  }
}

async function runScript(filename: string) {
  try {
    const result = await (window as any).userscriptAPI.executeScript(filename);

    if (result.success) {
      console.log('Script executed:', result.metadata.name);

      // Execute the converted code in a sandbox
      const sandbox = {
        console: console,
        require: require,
        process: process,
        __dirname: __dirname,
      };

      // For safety, you might want to use vm.createContext here
      const vm = require('vm');
      vm.createContext(sandbox);
      vm.runInContext(result.code, sandbox);
    } else {
      console.error('Script execution failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Load scripts on startup
document.addEventListener('DOMContentLoaded', loadScripts);
