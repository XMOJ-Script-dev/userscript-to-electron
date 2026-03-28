# userscript-to-electron

一个 npm 包，用于将 Tampermonkey 或 Greasemonkey userscript 转换为可在 Electron 中执行的 JavaScript。

本项目参考 Tampermonkey 官方文档并提供较完整的 GM API 兼容层。

English documentation: [README.md](README.md)

## 功能概览

### GM API 支持

兼容性说明:

- 同时支持经典 `GM_*` 与现代 `GM.*` 两种调用风格。
- 支持 `@grant GM`，会展开为完整 GM 命名空间桥接。
- 支持 `GM.xmlHttpRequest` 与 `GM_xmlHttpRequest` 兼容别名。

存储 API:

- `GM_getValue`, `GM_setValue`, `GM_deleteValue`, `GM_listValues`
- `GM_setValues`, `GM_getValues`, `GM_deleteValues`
- `GM_addValueChangeListener`, `GM_removeValueChangeListener`

网络 API:

- `GM_xmlhttpRequest`
- `GM_download`
- `GM_webRequest`（实验性）

UI API:

- `GM_notification`
- `GM_openInTab`
- `GM_registerMenuCommand`, `GM_unregisterMenuCommand`

DOM 与样式 API:

- `GM_addElement`
- `GM_addStyle`

资源与剪贴板 API:

- `GM_getResourceText`, `GM_getResourceURL`
- `GM_setClipboard`

标签页与信息 API:

- `GM_getTab`, `GM_saveTab`, `GM_getTabs`
- `GM_info`
- `GM_log`

Cookie 与音频 API:

- `GM_cookie.list`, `GM_cookie.set`, `GM_cookie.delete`
- `GM_audio.setMute`, `GM_audio.getState`
- `GM_audio.addStateChangeListener`, `GM_audio.removeStateChangeListener`

Window 全局:

- `unsafeWindow`
- `window.close`, `window.focus`
- `window.onurlchange`

### 元数据头支持

支持常见 Tampermonkey 头部标签，包括:

- `@name`, `@namespace`, `@version`, `@description`, `@author`
- `@match`, `@include`, `@exclude`, `@connect`
- `@grant`, `@require`, `@resource`
- `@run-at`, `@run-in`, `@sandbox`
- `@updateURL`, `@downloadURL`, `@supportURL`, `@homepage`
- `@noframes`, `@unwrap`, `@tag`, `@antifeature`
- 国际化变体，如 `@name:zh-CN`, `@description:en`

## 安装

```bash
npm install userscript-to-electron
```

## 快速开始

```js
import UserscriptConverter from 'userscript-to-electron';
import fs from 'fs';

const converter = new UserscriptConverter({
  dataDir: './userscript-data'
});

const scriptContent = fs.readFileSync('my-script.user.js', 'utf-8');
const result = converter.convert(scriptContent);

console.log(result.metadata.name);
converter.save(result, 'output.js');
```

## Electron 集成示例

```js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const UserscriptConverter = require('userscript-to-electron');

const converter = new UserscriptConverter({
  dataDir: path.join(app.getPath('userData'), 'userscripts')
});

ipcMain.handle('userscript:run', async (_event, scriptPath) => {
  const result = converter.convertFile(scriptPath);
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    await win.webContents.executeJavaScript(result.code);
  }
  return result.metadata;
});
```

## API 概览

### UserscriptConverter

```ts
new UserscriptConverter(options?: ConvertOptions)
```

方法:

- `convert(scriptContent: string): ConvertResult`
- `convertFile(filePath: string): ConvertResult`
- `save(result: ConvertResult, outputPath: string): void`

`ConvertResult`:

```ts
interface ConvertResult {
  code: string;
  metadata: UserscriptMetadata;
  sourceMap?: string;
}
```

### MetadataParser

```ts
MetadataParser.parse(scriptContent: string): UserscriptMetadata
```

### GMPolyfill

```ts
new GMPolyfill(options?: GMPolyfillOptions)
generatePolyfill(grants: string[]): string
```

## 持久化行为

- GM 值存储持久化到 `${dataDir}/__gm_storage.json`。
- 标签页状态持久化到 `${dataDir}/__gm_tabs.json`。
- 下载文件保存到 `${dataDir}/downloads/`。

## 已知限制

- 依赖 DOM 的脚本应在 Electron 渲染进程中运行，或结合 jsdom。
- 某些浏览器专有的 Cookie 与标签页行为在 Electron 中可能有差异。
- `GM_webRequest` 受运行上下文影响，目前为实验性支持。

## 开发

```bash
npm run build
npm run dev
npm test
```

## 许可证

MIT，详见 [LICENSE](LICENSE)。

## 参考资料

- [Tampermonkey 官方文档](https://www.tampermonkey.net/documentation.php)
- [Electron 文档](https://www.electronjs.org/docs)
