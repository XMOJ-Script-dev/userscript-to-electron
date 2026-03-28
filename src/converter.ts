/**
 * Main converter - transforms userscript to Electron-compatible JavaScript
 */

import { MetadataParser, UserscriptMetadata } from './metadata';
import { GMPolyfill, GMPolyfillOptions } from './gm-polyfill';
import * as fs from 'fs';
import * as path from 'path';

export interface ConvertOptions {
  /**
   * Directory for storing data (GM storage, downloads, etc.)
   */
  dataDir?: string;

  /**
   * Custom headers for HTTP requests
   */
  headers?: Record<string, string>;

  /**
   * Whether to wrap the code in a function
   * Useful when you need to avoid polluting the global scope
   */
  wrap?: boolean;

  /**
   * Module format for require statements
   * 'commonjs' or 'esm'
   */
  format?: 'commonjs' | 'esm';

  /**
   * Include source map
   */
  sourceMap?: boolean;
}

export interface ConvertResult {
  code: string;
  metadata: UserscriptMetadata;
  sourceMap?: string;
}

export class UserscriptConverter {
  private polyfill: GMPolyfill;
  private options: Required<ConvertOptions>;

  constructor(options: ConvertOptions = {}) {
    this.options = {
      dataDir: options.dataDir || path.join(process.env.APPDATA || '', 'userscript-data'),
      headers: options.headers || {},
      wrap: options.wrap ?? false,
      format: options.format || 'commonjs',
      sourceMap: options.sourceMap ?? false,
    };

    this.polyfill = new GMPolyfill({
      dataDir: this.options.dataDir || '',
      headers: this.options.headers,
    });
  }

  /**
   * Convert a userscript string to Electron-compatible JavaScript
   */
  convert(scriptContent: string): ConvertResult {
    // Parse metadata
    const metadata = MetadataParser.parse(scriptContent);

    // Remove metadata block from code
    const codeWithoutMetadata = this.removeMetadataBlock(scriptContent);

    // Generate polyfills
    const polyfill = this.polyfill.generatePolyfill(metadata.grant);

    // Generate wrapper code
    const contextCode = this.generateContextCode(metadata);

    // Combine all parts
    let finalCode = '';

    if (this.options.format === 'esm') {
      finalCode = this.generateESMCode(polyfill, contextCode, codeWithoutMetadata, metadata);
    } else {
      finalCode = this.generateCommonJSCode(polyfill, contextCode, codeWithoutMetadata, metadata);
    }

    if (this.options.wrap) {
      finalCode = this.wrapInFunction(finalCode);
    }

    const result: ConvertResult = {
      code: finalCode,
      metadata,
    };

    if (this.options.sourceMap) {
      result.sourceMap = this.generateSourceMap(scriptContent, finalCode);
    }

    return result;
  }

  /**
   * Convert a userscript file
   */
  convertFile(filePath: string, options?: ConvertOptions): ConvertResult {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.convert(content);
  }

  /**
   * Save converted script to file
   */
  save(result: ConvertResult, outputPath: string): void {
    fs.writeFileSync(outputPath, result.code, 'utf-8');

    if (result.sourceMap) {
      fs.writeFileSync(outputPath + '.map', result.sourceMap, 'utf-8');
    }
  }

  private removeMetadataBlock(content: string): string {
    return content.replace(/^\/\/\s*==UserScript==\n[\s\S]*?\/\/\s*==\/UserScript==\n/m, '');
  }

  private generateContextCode(metadata: UserscriptMetadata): string {
    return `
// Script: ${metadata.name}
// Version: ${metadata.version}
// Namespace: ${metadata.namespace}
${metadata.description ? `// Description: ${metadata.description}` : ''}
${metadata.author ? `// Author: ${metadata.author}` : ''}
`;
  }

  private generateCommonJSCode(
    polyfill: string,
    contextCode: string,
    userCode: string,
    metadata: UserscriptMetadata
  ): string {
    return `${contextCode}

// ===== Polyfills for GM APIs =====
${polyfill}

// ===== Userscript Code =====
${userCode}
`;
  }

  private generateESMCode(
    polyfill: string,
    contextCode: string,
    userCode: string,
    metadata: UserscriptMetadata
  ): string {
    return `${contextCode}

// ===== Polyfills for GM APIs =====
${polyfill}

// ===== Userscript Code =====
${userCode}

export { GM_getValue, GM_setValue, GM_deleteValue, GM_listValues, GM_xmlhttpRequest, GM_download, GM_notification, GM_openInTab, unsafeWindow };
`;
  }

  private wrapInFunction(code: string): string {
    return `
(async function() {
${code
  .split('\n')
  .map((line) => '  ' + line)
  .join('\n')}
})();
`;
  }

  private generateSourceMap(original: string, converted: string): string {
    // Simple source map - maps converted lines to original lines
    const originalLines = original.split('\n').length;
    const mappings = 'A';

    return JSON.stringify({
      version: 3,
      sources: ['userscript.js'],
      sourcesContent: [original],
      mappings,
      names: [],
    });
  }
}

export default UserscriptConverter;
