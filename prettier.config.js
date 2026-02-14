/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig*/
/** @typedef  {import("prettier").Config} PrettierConfig*/

/** @type { PrettierConfig | SortImportsConfig } */
export default {
  printWidth: 80,
  trailingComma: 'all',
  endOfLine: 'auto',
  singleQuote: true,
  importOrder: [
    // Ensure test helpers are sorted first so that polyfills are loaded
    '___',
    '__',
    '^@platform/(server|client|config|shared)/src/__tests__(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'explicitResourceManagement'],
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
  ],
};