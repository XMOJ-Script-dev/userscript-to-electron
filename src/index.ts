/**
 * Main entry point for the userscript-to-electron converter
 */

export { UserscriptConverter, ConvertOptions, ConvertResult } from './converter';
export { MetadataParser, UserscriptMetadata } from './metadata';
export { GMPolyfill, GMPolyfillOptions } from './gm-polyfill';

import UserscriptConverter from './converter';

export default UserscriptConverter;
