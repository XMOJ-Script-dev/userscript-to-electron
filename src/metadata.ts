/**
 * Userscript metadata parser - Full Tampermonkey header support
 * Conforms to: https://www.tampermonkey.net/documentation.php
 */

export interface UserscriptMetadata {
  // Required fields
  name: string;
  namespace: string;
  version: string;

  // Common optional fields
  description?: string;
  author?: string;
  
  // URL patterns
  match: string[];
  include?: string[];
  exclude?: string[];
  
  // Permissions & features
  grant: string[];
  require?: string[];
  resource?: Record<string, string>;
  
  // Execution control
  runAt?: string;
  runIn?: string[];
  sandbox?: string;
  
  // Display & metadata
  icon?: string;
  icon64?: string;
  copyright?: string;
  homepage?: string;
  supportURL?: string;
  
  // Deployment & updates
  downloadURL?: string;
  updateURL?: string;
  
  // Features
  noframes?: boolean;
  unwrap?: boolean;
  connect?: string[];
  antifeature?: Record<string, string>;
  tag?: string[];
  
  // Internationalization (i18n) variants
  nameI18n?: Record<string, string>;
  descriptionI18n?: Record<string, string>;
}

export class MetadataParser {
  /**
   * Parse userscript metadata from comment block
   * Supports all documented Tampermonkey @header tags
   * 
   * @example
   * // ==UserScript==
   * // @name       My Script
   * // @namespace  http://example.com/
   * // @version    1.0
   * // @match      https://example.com/*
   * // @grant      GM_getValue
   * // ==/UserScript==
   */
  static parse(scriptContent: string): UserscriptMetadata {
    const metadataBlock = this.extractMetadataBlock(scriptContent);
    const metadata: Partial<UserscriptMetadata> = {
      match: [],
      include: [],
      exclude: [],
      grant: [],
      require: [],
      resource: {},
      connect: [],
      tag: [],
      antifeature: {},
      nameI18n: {},
      descriptionI18n: {},
    };

    const lines = metadataBlock.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const match = line.match(/\/\/\s*@([\w:-]+)(:\w+)?\s+(.*)/);
      if (!match) continue;

      const [, key, locale, value] = match;
      const normalizedKey = key.toLowerCase();
      
      // Handle internationalization variants
      if (locale) {
        const localeCode = locale.substr(1); // Remove leading colon
        switch (normalizedKey) {
          case 'name':
            metadata.nameI18n![localeCode] = value.trim();
            break;
          case 'description':
            metadata.descriptionI18n![localeCode] = value.trim();
            break;
        }
        continue;
      }

      // Parse main fields
      switch (normalizedKey) {
        // Required fields
        case 'name':
          metadata.name = value.trim();
          break;
        case 'namespace':
          metadata.namespace = value.trim();
          break;
        case 'version':
          metadata.version = value.trim();
          break;

        // Description & metadata
        case 'description':
          metadata.description = value.trim();
          break;
        case 'author':
          metadata.author = value.trim();
          break;
        case 'copyright':
          metadata.copyright = value.trim();
          break;

        // Icon
        case 'icon':
        case 'icon-url':
        case 'iconurl':
          metadata.icon = value.trim();
          break;
        case 'icon64':
        case 'icon64-url':
        case 'icon64url':
          metadata.icon64 = value.trim();
          break;

        // URL patterns
        case 'match':
          metadata.match!.push(value.trim());
          break;
        case 'include':
          metadata.include!.push(value.trim());
          break;
        case 'exclude':
          metadata.exclude!.push(value.trim());
          break;

        // Permissions
        case 'grant':
          metadata.grant!.push(value.trim());
          break;

        // Dependencies
        case 'require':
          metadata.require!.push(value.trim());
          break;
        case 'resource':
          const resourceMatch = value.match(/(\S+)\s+(.*)/);
          if (resourceMatch) {
            metadata.resource![resourceMatch[1]] = resourceMatch[2].trim();
          }
          break;

        // Execution control
        case 'run-at':
          metadata.runAt = value.trim();
          break;
        case 'run-in':
          metadata.runIn = metadata.runIn || [];
          metadata.runIn!.push(value.trim());
          break;
        case 'sandbox':
          metadata.sandbox = value.trim();
          break;

        // URLs
        case 'homepage':
        case 'homepage-url':
        case 'homepageurl':
        case 'website':
        case 'source':
          metadata.homepage = value.trim();
          break;
        case 'support-url':
        case 'supporturl':
          metadata.supportURL = value.trim();
          break;
        case 'download-url':
        case 'downloadurl':
          metadata.downloadURL = value.trim();
          break;
        case 'update-url':
        case 'updateurl':
          metadata.updateURL = value.trim();
          break;

        // Features
        case 'noframes':
          metadata.noframes = true;
          break;
        case 'unwrap':
          metadata.unwrap = true;
          break;
        case 'connect':
          metadata.connect!.push(value.trim());
          break;
        case 'antifeature':
          const afMatch = value.match(/(\w+)\s+(.*)/);
          if (afMatch) {
            metadata.antifeature![afMatch[1]] = afMatch[2].trim();
          }
          break;
        case 'tag':
          metadata.tag!.push(value.trim());
          break;
      }
    }

    // Validation
    if (!metadata.name) {
      throw new Error('Userscript must have a @name tag');
    }
    if (!metadata.namespace) {
      throw new Error('Userscript must have a @namespace tag');
    }
    if (!metadata.version) {
      throw new Error('Userscript must have a @version tag');
    }

    // Set defaults
    if (metadata.runAt === undefined) {
      metadata.runAt = 'document-end';
    }
    if (metadata.runIn === undefined) {
      metadata.runIn = ['normal-tabs'];
    }

    return metadata as UserscriptMetadata;
  }

  private static extractMetadataBlock(content: string): string {
    const match = content.match(/^\/\/\s*==UserScript==\n([\s\S]*?)\/\/\s*==\/UserScript==/m);
    return match ? match[1] : '';
  }
}
