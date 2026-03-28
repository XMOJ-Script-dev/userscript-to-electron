# userscript-to-electron

一个功能完整的 npm 包，可以将 Tampermonkey/Greasemonkey Userscript 转换成 Electron 可执行的 JavaScript。

完全兼容 Tampermonkey 官方文档：https://www.tampermonkey.net/documentation.php

## 功能特性

### ✨ 完整 API 支持

**存储 API (`@grant GM_*`):**
- ✅ `GM_getValue` / `GM_setValue` - 单键存储
- ✅ `GM_deleteValue` / `GM_listValues` - 删除和列举
- ✅ `GM_setValues` / `GM_getValues` / `GM_deleteValues` - 批量操作 (v5.3+)
- ✅ `GM_addValueChangeListener` / `GM_removeValueChangeListener` - 值变化事件

**HTTP/网络 API:**
- ✅ `GM_xmlhttpRequest` - 网络请求（使用 node-fetch）
- ✅ `GM_download` - 文件下载
- ✅ `GM_webRequest` - 网络拦截（实验性）

**UI & 通知:**
- ✅ `GM_notification` - 桌面通知（Electron Notification）
- ✅ `GM_openInTab` - 打开外部链接
- ✅ `GM_registerMenuCommand` / `GM_unregisterMenuCommand` - 右键菜单命令

**DOM & 样式:**
- ✅ `GM_addElement` - 添加 DOM 元素
- ✅ `GM_addStyle` - 注入 CSS 样式

**资源 & 剪贴板:**
- ✅ `GM_getResourceText` / `GM_getResourceURL` - 资源访问
- ✅ `GM_setClipboard` - 剪贴板操作

**Tab & 数据:**
- ✅ `GM_getTab` / `GM_saveTab` / `GM_getTabs` - 跨标签通信
- ✅ `GM_info` - 脚本信息对象
- ✅ `GM_log` - 日志输出

**Cookies & Audio:**
- ✅ `GM_cookie.list` / `GM_cookie.set` / `GM_cookie.delete` - Cookie 管理
- ✅ `GM_audio.setMute` / `GM_audio.getState` / `GM_audio.addStateChangeListener` - 音频控制

**Window 全局:**
- ✅ `unsafeWindow` - 全局作用域访问
- ✅ `window.close` / `window.focus` - 窗口控制
- ✅ `window.onurlchange` - URL 变化事件

### 📋 完整 Header 支持

所有官方 Tampermonkey `@header` 标签：
- ✅ `@name` - 脚本名称（必需）
- ✅ `@namespace` - 命名空间（必需）
- ✅ `@version` - 版本号（必需）
- ✅ `@description` - 脚本描述
- ✅ `@author` - 作者信息
- ✅ `@icon` / `@icon64` - 脚本图标
- ✅ `@match` / `@include` / `@exclude` - URL 匹配规则
- ✅ `@grant` - 权限声明
- ✅ `@require` - 依赖脚本
- ✅ `@resource` - 资源声明
- ✅ `@run-at` - 执行时机
- ✅ `@run-in` - 执行上下文
- ✅ `@sandbox` - 沙箱模式
- ✅ `@connect` - 网络白名单
- ✅ `@download-url` / `@update-url` - 更新配置
- ✅ `@homepage` / `@support-url` - 链接
- ✅ `@noframes` / `@unwrap` - 特殊模式
- ✅ `@tag` - 标签分类
- ✅ `@antifeature` - 反特性声明
- ✅ 国际化支持 (`@name:zh`, `@description:en` 等)

## 安装

```bash
npm install userscript-to-electron
```

## 快速开始

### 基础使用

```javascript
import UserscriptConverter from 'userscript-to-electron';
import fs from 'fs';

const converter = new UserscriptConverter({
  dataDir: '/path/to/data',  // 数据存储目录
});

// 转换脚本字符串
const scriptContent = fs.readFileSync('myscript.user.js', 'utf-8');
const result = converter.convert(scriptContent);

console.log('脚本名称:', result.metadata.name);
console.log('权限:', result.metadata.grant);

// 保存转换结果
converter.save(result, 'output.js');
```

### 在 Electron 中使用

**主进程 (main.js):**
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const UserscriptConverter = require('userscript-to-electron');
const fs = require('fs');
const path = require('path');

const converter = new UserscriptConverter({
  dataDir: path.join(app.getPath('userData'), 'scripts')
});

ipcMain.handle('run-script', async (event, scriptPath) => {
  const result = converter.convertFile(scriptPath);
  
  // 在渲染进程中执行
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.webContents.executeJavaScript(result.code);
  }
  
  return result.metadata;
});
```

**预加载脚本 (preload.js):**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('userscript', {
  runScript: (path) => ipcRenderer.invoke('run-script', path)
});
```

## 转换选项

```typescript
new UserscriptConverter({
  // 数据存储目录
  dataDir: string = '${APPDATA}/userscript-data'
  
  // 自定义 HTTP 请求头
  headers: Record<string, string> = {}
  
  // 脚本名称（用于日志）
  scriptName: string = 'userscript'
  
  // 脚本版本信息
  scriptVersion: string = '1.0'
})
```

### ConvertOptions

```typescript
converter.convert(scriptContent, {
  // 将代码包装在 async 函数中
  wrap?: boolean = false
  
  // 输出格式
  format?: 'commonjs' | 'esm' = 'commonjs'
  
  // 生成 source map
  sourceMap?: boolean = false
})
```

## Userscript 示例

**原始脚本 (page-counter.user.js):**
```javascript
// ==UserScript==
// @name        Page Counter
// @namespace   http://example.com/
// @version     1.0
// @description 统计页面访问次数
// @match       *://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_notification
// @grant       GM_registerMenuCommand
// ==/UserScript==

(function() {
  let count = GM_getValue('pageCount', 0);
  count++;
  GM_setValue('pageCount', count);

  if (count % 10 === 0) {
    GM_notification('已访问 ' + count + ' 个页面！', 'Page Counter');
  }

  // 添加菜单命令
  GM_registerMenuCommand('显示计数', () => {
    alert('页面计数: ' + count);
  }, 'c');
})();
```

**转换并在 Electron 中运行:**
```javascript
const converter = new UserscriptConverter();
const result = converter.convertFile('page-counter.user.js');

// 转换后的代码包含:
// ✅ GM_getValue/setValue 的本地存储实现
// ✅ GM_notification 的 Electron Notification 支持
// ✅ GM_registerMenuCommand 的菜单支持
// ✅ 文件系统持久化

window.eval(result.code);
```

## API 文档

### UserscriptConverter

#### 构造函数
```typescript
new UserscriptConverter(options?: ConvertOptions)
```

#### 方法

**`convert(scriptContent: string): ConvertResult`**

转换 userscript 字符串。

```typescript
interface ConvertResult {
  code: string;                  // 转换后的代码
  metadata: UserscriptMetadata;  // 脚本元数据
  sourceMap?: string;            // Source map (可选)
}
```

**`convertFile(filePath: string): ConvertResult`**

从文件转换 userscript。

**`save(result: ConvertResult, outputPath: string): void`**

保存转换结果到文件。

### MetadataParser

```typescript
static parse(scriptContent: string): UserscriptMetadata
```

解析 userscript 元数据。

### GMPolyfill

```typescript
new GMPolyfill(options?: GMPolyfillOptions)

generatePolyfill(grants: string[]): string
```

为指定的 GM grants 生成 polyfill 代码。

## 存储和数据持久化

### 本地存储

所有 `GM_*Value` 操作自动持久化到磁盘：

```javascript
// 数据保存在: ${dataDir}/__gm_storage.json
GM_setValue('key', { data: 'value' });

// 跨会话加载
const val = GM_getValue('key', {}); // { data: 'value' }
```

### Tab 存储

跨标签通信数据：

```javascript
// 保存 tab 特定数据
GM_getTab(tab => {
  tab.myData = 'shared across tabs';
  GM_saveTab(tab);
});

// 其他标签可以访问
GM_getTabs(allTabs => {
  console.log(allTabs);
});
```

### 下载目录

所有下载文件保存在：

```
${dataDir}/downloads/
```

## 常见问题

### Q: 如何处理 DOM 操作？

A: 需要 DOM，使用 jsdom：

```javascript
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><body></body>');
global.document = dom.window.document;
global.window = dom.window;

eval(result.code);
```

### Q: 如何安全地执行用户脚本？

A: 使用 VM 沙箱：

```javascript
import vm from 'vm';

const sandbox = { 
  console,
  require,
  // ... 其他 globals
};

vm.createContext(sandbox);
vm.runInContext(result.code, sandbox);
```

### Q: 支持哪些 Node.js 版本？

A: Node.js 16+ (因为使用现代 ES 特性和 fetch API)

### Q: Electron context 中如何访问 DOM？

A: 预加载脚本中使用：

```javascript
// preload.js
window.addEventListener('DOMContentLoaded', () => {
  eval(window.scriptCode);
});
```

## 限制和已知问题

⚠️ **重要提示**

1. **DOM 访问** - 需要额外的 jsdom 或 Electron 渲染进程支持
2. **跨域请求** - node-fetch 支持但需要 @connect 白名单
3. **CSP 限制** - Electron 中不适用
4. **窗口/标签控制** - 部分受限于 Electron API
5. **Cookie** - 需要 Electron session API 支持

## 贡献

欢迎提交 Issue 和 Pull Request！

```bash
# 开发
npm run build
npm run dev    # 监视模式
npm test       # 运行测试

# 发布
npm version patch
npm publish
```

## 许可证

MIT - 详见 [LICENSE](LICENSE)

## 相关资源

- [Tampermonkey 官方文档](https://www.tampermonkey.net/documentation.php)
- [GreasyFork 脚本库](https://greasyfork.org/)
- [Electron 文档](https://www.electronjs.org/docs)

---

**作者**: XMOJ Script Dev  
**版本**: 1.0.0  
**更新**: 2026-03-28

## 安装

```bash
npm install userscript-to-electron
```

## 使用

### 基础示例

```javascript
import UserscriptConverter from 'userscript-to-electron';
import fs from 'fs';

// 创建转换器实例
const converter = new UserscriptConverter({
  dataDir: '/path/to/data', // 存储数据的目录
});

// 转换脚本字符串
const scriptContent = fs.readFileSync('myscript.user.js', 'utf-8');
const result = converter.convert(scriptContent);

console.log('转换后的代码:');
console.log(result.code);

// 或者直接转换文件
const result2 = converter.convertFile('myscript.user.js');

// 保存转换后的脚本
converter.save(result2, 'output.js');
```

### 转换选项

```javascript
const converter = new UserscriptConverter({
  // 数据存储目录
  dataDir: '/path/to/data',
  
  // 自定义 HTTP 请求头
  headers: {
    'User-Agent': 'My App 1.0'
  },
  
  // 将代码包装在 async 函数中
  wrap: true,
  
  // 输出格式: 'commonjs' 或 'esm'
  format: 'commonjs',
  
  // 生成 source map
  sourceMap: true
});
```

### 在 Electron 中使用

**主进程 (main.js)**
```javascript
const UserscriptConverter = require('userscript-to-electron');
const fs = require('fs');
const path = require('path');

const converter = new UserscriptConverter({
  dataDir: path.join(app.getPath('userData'), 'scripts')
});

const result = converter.convertFile('my-script.user.js');

// 在窗口中执行转换后的脚本
win.webContents.executeJavaScript(result.code);
```

**或在预加载脚本中使用**
```javascript
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
  runScript: (scriptCode) => {
    eval(scriptCode); // 或使用更安全的方式
  }
});
```

## Userscript 示例

**原始 Userscript：**
```javascript
// ==UserScript==
// @name        My Script
// @namespace   http://example.com/
// @version     1.0
// @match       https://example.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_notification
// ==/UserScript==

(function() {
  let count = GM_getValue('count', 0);
  count++;
  GM_setValue('count', count);

  if (count % 10 === 0) {
    GM_notification(`Visited ${count} times!`, 'Counter');
  }

  console.log('Visit count:', count);
})();
```

**转换后的代码自动包含：**
- ✅ GM API 的 polyfill 实现
- ✅ 文件系统持久化
- ✅ node-fetch 支持的 HTTP 请求
- ✅ Electron Notification API 集成

## API 文档

### `UserscriptConverter`

#### 构造函数
```typescript
constructor(options?: ConvertOptions)
```

#### 方法

**`convert(scriptContent: string): ConvertResult`**

转换 userscript 字符串。

```typescript
interface ConvertResult {
  code: string;              // 转换后的代码
  metadata: UserscriptMetadata; // 脚本元数据
  sourceMap?: string;        // Source map (可选)
}
```

**`convertFile(filePath: string): ConvertResult`**

从文件转换 userscript。

**`save(result: ConvertResult, outputPath: string): void`**

保存转换结果到文件。

### `MetadataParser`

```typescript
static parse(scriptContent: string): UserscriptMetadata
```

解析 userscript 元数据。

### `GMPolyfill`

```typescript
generatePolyfill(grants: string[]): string
```

为指定的 GM grants 生成 polyfill 代码。

## 支持的 Metadata 字段

| 字段 | 描述 |
|------|------|
| `@name` | 脚本名称 **必需** |
| `@namespace` | 命名空间 **必需** |
| `@version` | 版本号 **必需** |
| `@description` | 脚本描述 |
| `@author` | 作者名称 |
| `@match` | URL 匹配规则 |
| `@grant` | 请求的权限 |
| `@require` | 外部依赖 |
| `@run-at` | 运行时机 |
| `@icon` | 脚本图标 |
| `@homepage` | 主页 URL |
| `@supportURL` | 支持 URL |

## 注意事项

⚠️ **重要提示**
1. **DOM 访问**：原始脚本中的 DOM 操作在 Node.js 环境中不可用，需要使用 jsdom 或类似库
2. **跨域限制**：已自动处理，使用 node-fetch
3. **沙箱隔离**：请评估安全影响，必要时使用 VM 沙箱隔离代码
4. **权限验证**：建议验证脚本权限再执行

## 常见问题

### Q：如何处理 DOM 操作？
A：如果需要 DOM，使用 jsdom：
```javascript
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<html></html>');
global.document = dom.window.document;
eval(convertedCode);
```

### Q：如何安全地执行用户脚本？
A：使用 VM 沙箱：
```javascript
import vm from 'vm';
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(result.code, sandbox);
```

### Q：支持哪些版本的 Node.js？
A：Node.js 16+（因为使用了 fetch 和现代 ES 功能）

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
