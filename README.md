# userscript-to-electron

An npm package that converts Tampermonkey or Greasemonkey userscripts into Electron-executable JavaScript.

This project tracks Tampermonkey documentation and implements a broad GM API compatibility layer.

Chinese documentation: [README.zh-CN.md](README.zh-CN.md)

## Features

### Full GM API Coverage

Compatibility notes:

- Supports both classic `GM_*` and modern `GM.*` API styles.
- Supports `@grant GM` and expands it to the full GM namespace bridge.
- Supports `GM.xmlHttpRequest` and `GM_xmlHttpRequest` compatibility aliases.

Storage APIs:

- `GM_getValue`, `GM_setValue`, `GM_deleteValue`, `GM_listValues`
- `GM_setValues`, `GM_getValues`, `GM_deleteValues`
- `GM_addValueChangeListener`, `GM_removeValueChangeListener`

Network APIs:

- `GM_xmlhttpRequest`
- `GM_download`
- `GM_webRequest` (experimental)

UI APIs:

- `GM_notification`
- `GM_openInTab`
- `GM_registerMenuCommand`, `GM_unregisterMenuCommand`

DOM and style APIs:

- `GM_addElement`
- `GM_addStyle`

Resources and clipboard APIs:

- `GM_getResourceText`, `GM_getResourceURL`
- `GM_setClipboard`

Tab and info APIs:

- `GM_getTab`, `GM_saveTab`, `GM_getTabs`
- `GM_info`
- `GM_log`

Cookie and audio APIs:

- `GM_cookie.list`, `GM_cookie.set`, `GM_cookie.delete`
- `GM_audio.setMute`, `GM_audio.getState`
- `GM_audio.addStateChangeListener`, `GM_audio.removeStateChangeListener`

Window globals:

- `unsafeWindow`
- `window.close`, `window.focus`
- `window.onurlchange`

### Metadata Header Support

Supports common Tampermonkey headers including:

- `@name`, `@namespace`, `@version`, `@description`, `@author`
- `@match`, `@include`, `@exclude`, `@connect`
- `@grant`, `@require`, `@resource`
- `@run-at`, `@run-in`, `@sandbox`
- `@updateURL`, `@downloadURL`, `@supportURL`, `@homepage`
- `@noframes`, `@unwrap`, `@tag`, `@antifeature`
- I18n variants like `@name:zh-CN`, `@description:en`

## Installation

```bash
npm install userscript-to-electron
```

## Quick Start

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

## Electron Integration Example

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

## API Overview

### UserscriptConverter

```ts
new UserscriptConverter(options?: ConvertOptions)
```

Methods:

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

## Persistence Behavior

- GM value storage is persisted to `${dataDir}/__gm_storage.json`.
- Tab state is persisted to `${dataDir}/__gm_tabs.json`.
- Downloads are saved to `${dataDir}/downloads/`.

## Known Limitations

- DOM-dependent userscripts should run in an Electron renderer process or with jsdom.
- Some browser-specific cookie and tab behavior may differ in Electron.
- `GM_webRequest` behavior depends on integration context and is currently experimental.

## Development

```bash
npm run build
npm run dev
npm test
```

## License

MIT. See [LICENSE](LICENSE).

## References

- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [Electron Documentation](https://www.electronjs.org/docs)
