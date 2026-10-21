import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

const RESTRICTED_IMPORT_PATTERNS = ['@material-ui/*/*/*', '!@material-ui/core/test-utils/*'];

// Aggregate indexes ("barrels") that geoview-core source must not import: they re-export modules that import back into them (runtime cycles)
const BARREL_IMPORT_MESSAGE =
  'Import from the module that defines the symbol (e.g. @/ui/button/button, @/ui/icons, @/ui/layout, @/ui/mui-reexports/mui-reexports), not from a barrel. Barrels are public entry points only. See docs/programming/best-practices.md §7.';
const RESTRICTED_BARREL_PATHS = ['@/ui', '@/app', '@/api', '@/geo', '@/core/components', '@/core/stores', '.', '..'].map((name) => ({
  name,
  message: BARREL_IMPORT_MESSAGE,
}));

// Plugins keep the public entries (geoview-core, geoview-core/ui) but import everything else from defining modules
const PLUGIN_BARREL_IMPORT_MESSAGE =
  'Import from the module that defines the symbol (e.g. geoview-core/core/utils/logger, ./components/legend-item), not from a folder index. Only geoview-core and geoview-core/ui are public entry points. See docs/programming/best-practices.md §7.';
const RESTRICTED_PLUGIN_BARREL_PATHS = [
  'geoview-core/app',
  'geoview-core/api',
  'geoview-core/geo',
  'geoview-core/core/components',
  'geoview-core/core/stores',
  '.',
  '..',
].map((name) => ({ name, message: PLUGIN_BARREL_IMPORT_MESSAGE }));

export default [
  js.configs.recommended,
  // Ignores (actually recommended to be first in the whole config logic)
  {
    ignores: ['node_modules/', 'dist/', 'eslint.config.js', 'global.d.ts', 'react-jsx-global.d.ts'],
  },

  // Core logic for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: true,
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        performance: 'readonly',
        navigator: 'readonly',
        crypto: 'readonly',
        self: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        Image: 'readonly',
        TrustedHTML: 'readonly',
        btoa: 'readonly',
        structuredClone: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      prettier: prettier,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      // Map MUI / @/ui components to the DOM element they render so jsx-a11y can see them
      'jsx-a11y': {
        polymorphicPropName: 'component',
        components: {
          Box: 'div',
          Stack: 'div',
          Grid: 'div',
          Paper: 'div',
          Card: 'div',
          CardContent: 'div',
          Avatar: 'div',
          Typography: 'p',
          List: 'ul',
          ListItem: 'li',
          SvgIcon: 'svg',
          CardMedia: 'img',
        },
      },
      // Resolves the `@/` alias and relative paths so import/no-cycle can follow internal imports
      'import/resolver': {
        [fileURLToPath(new URL('./eslint-import-resolver-geoview.cjs', import.meta.url))]: {},
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      // React rules
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [
        1, // Warning
        {
          extensions: ['.js', '.ts', '.tsx'],
        },
      ],
      'react/no-find-dom-node': 0,
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/no-array-index-key': 'error',
      'react/no-danger': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unused-prop-types': 'error',

      // TypeScript rules
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'all', argsIgnorePattern: '^_|^event$|^sender$' }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off', // Think about turning this on eventually
      '@typescript-eslint/no-unsafe-member-access': 'off', // Think about turning this on eventually
      '@typescript-eslint/no-unsafe-call': 'off', // Think about turning this on eventually
      '@typescript-eslint/class-methods-use-this': [
        1, // Warning
        {
          ignoreOverrideMethods: true,
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'require-await': 1, // Warning
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreVoid: false
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        1,
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
      'react-hooks/exhaustive-deps': 'error', // Checks effect dependencies

      // Import rules
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'import/no-cycle': 'error',

      // JSX A11y rules
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['to', 'hrefLeft', 'hrefRight'],
          aspects: ['noHref', 'invalidHref', 'preferButton'],
        },
      ],
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      // Only pointer/click-style handlers count as "interactions"; keyboard delegation, blur, hover and drag/drop containers are legitimate
      'jsx-a11y/no-static-element-interactions': [
        'error',
        { handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp', 'onKeyPress'] },
      ],
      'jsx-a11y/no-noninteractive-element-interactions': [
        'error',
        { handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onPointerDown', 'onPointerUp', 'onKeyPress'] },
      ],
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      // Same allowances as jsx-a11y recommended so valid ARIA composites (e.g. List role="listbox") are not flagged
      'jsx-a11y/no-noninteractive-element-to-interactive-role': [
        'error',
        {
          ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
          ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
          li: ['menuitem', 'menuitemradio', 'menuitemcheckbox', 'option', 'row', 'tab', 'treeitem'],
          table: ['grid'],
          td: ['gridcell'],
          fieldset: ['radiogroup', 'presentation'],
        },
      ],

      // General rules
      'no-plusplus': 'off',
      'no-param-reassign': ['error', { props: true }],
      'no-nested-ternary': 'error',
      'no-else-return': 'error',
      'max-classes-per-file': ['error', 1],
      'no-underscore-dangle': ['error', { enforceInMethodNames: true }],
      'func-names': ['error', 'as-needed'],
      'no-await-in-loop': 'error',
      'no-promise-executor-return': 'error',
      camelcase: 'error',
      'no-restricted-globals': ['error', 'event', 'name', 'length', 'isNaN'],
      'prefer-destructuring': ['error', { array: false, object: true }],
      'prefer-const': 'error',
      'no-console': 'error',
      'no-alert': 'error',
      'no-cond-assign': ['error', 'always'],
      'no-loop-func': 'error',
      'no-bitwise': 'error',
      'no-continue': 'error',
      eqeqeq: 'error',
      'eol-last': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: RESTRICTED_IMPORT_PATTERNS,
        },
      ],
      'no-restricted-syntax': [
        1, // Warning
        {
          selector: ":matches(PropertyDefinition, MethodDefinition)[accessibility='private']",
          message: 'Use # prefix for private instead',
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='getElementById']",
          message:
            'Do not use document.getElementById directly. Use getGVElementById(mapId, suffix) / getGVElementByFullId(mapId, fullId) / getGVRootElement(mapId) from @/core/utils/dom-helper, or the useGVElementById() hook. This keeps DOM ids map-scoped and avoids cross-map collisions.',
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name=/^querySelector(All)?$/]",
          message:
            'Do not use document.querySelector(All) directly. Use queryGVSelector(mapId, selector) / queryGVSelectorAll(mapId, selector) from @/core/utils/dom-helper. This keeps DOM queries map-scoped and avoids cross-map collisions.',
        },
        {
          selector: "JSXAttribute[name.name='role'][value.value='button']",
          message:
            'Do not hand-roll role="button". Use ButtonBase (cards/rows), ListItemButton (list rows), IconButton (icons) or Button from their @/ui/... module, which provide focus, Enter/Space and disabled semantics natively. See "Use Semantic Elements for Interactions" in docs/app/accessibility.md.',
        },
        {
          selector: 'Property[key.name=/^border(Top|Bottom)?(Left|Right)?Radius$/] > Literal',
          message:
            'Use a border-radius token: theme.shape.borderRadius{None,Sm,Md,Lg,Full} in style modules, or GEOVIEW_SHAPE.* from @/ui/style/default in @/ui, theme overrides and cssText. See docs/programming/styling-best-practices.md §3. Literal values are off-scale, and numbers are multiplied by the base inside sx.',
        },
        {
          selector: 'Property[key.name=/^border(Top|Bottom)?(Left|Right)?Radius$/] > TemplateLiteral[expressions.length=0]',
          message:
            'Use a border-radius token: theme.shape.borderRadius{None,Sm,Md,Lg,Full} in style modules, or GEOVIEW_SHAPE.* from @/ui/style/default in @/ui, theme overrides and cssText. See docs/programming/styling-best-practices.md §3.',
        },
        {
          selector: "Property[key.name=/^border(Top|Bottom)?(Left|Right)?Radius$/] > MemberExpression[property.name='borderRadius']",
          message:
            'Use a border-radius token: theme.shape.borderRadius{None,Sm,Md,Lg,Full} in style modules, or GEOVIEW_SHAPE.* from @/ui/style/default in @/ui, theme overrides and cssText. See docs/programming/styling-best-practices.md §3. theme.shape.borderRadius is a number, so inside sx it renders 6 × 6 = 36px.',
        },
      ],

      // Prettier rules
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },

  // The dom-helper module is the single place allowed to touch document.* directly — it IS the wrapper.
  {
    files: ['**/core/utils/dom-helper.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // geoview-core internal source imports from defining modules, never from barrels
  {
    files: ['geoview-core/src/**/*.{ts,tsx}'],
    // Public entry points / re-export files that intentionally aggregate the barrels
    ignores: [
      'geoview-core/src/app.tsx',
      'geoview-core/src/index.ts',
      'geoview-core/src/core/types/external-types.ts',
      'geoview-core/src/core/types/global-types.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', { paths: RESTRICTED_BARREL_PATHS, patterns: RESTRICTED_IMPORT_PATTERNS }],
    },
  },

  // Plugin source imports from defining modules too; folder index barrels are not allowed
  {
    files: ['geoview-*/src/**/*.{ts,tsx}'],
    ignores: ['geoview-core/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: RESTRICTED_PLUGIN_BARREL_PATHS, patterns: RESTRICTED_IMPORT_PATTERNS }],
    },
  },

  // TODO: CYCLES - Remaining runtime import cycles (#3711). Each group only uses the other side inside function/method bodies
  // TO.DOCONT: so it is load-order safe today. Remove a group from this list once its cycle is broken; do not add new files.
  {
    files: [
      // Recursive React components rendering each other
      'geoview-core/src/core/components/layers/left-panel/layers-list.tsx',
      'geoview-core/src/core/components/layers/left-panel/single-layer.tsx',
      'geoview-custom-legend/src/components/group-item.tsx',
      'geoview-custom-legend/src/components/legend-item.tsx',
      // Export canvas layout and export utilities call each other
      'geoview-core/src/core/components/export/canvas-layout.tsx',
      'geoview-core/src/core/components/export/utilities.ts',
      // Generic utilities use Fetch, and Fetch uses delay/XML/encoding helpers from utilities
      'geoview-core/src/core/utils/fetch-helper.ts',
      'geoview-core/src/core/utils/utilities.ts',
      // MapViewer creates the ControllerRegistry; controllers use MapViewer statics (computeEffectiveLayerScales, DEFAULT_STOPS)
      'geoview-core/src/geo/map/map-viewer.ts',
      'geoview-core/src/core/controllers/base/controller-registry.ts',
      'geoview-core/src/core/controllers/layer-controller.ts',
      'geoview-core/src/core/controllers/layer-set-controller.ts',
      // Projection, GeoUtilities and GeometryApi static helpers call each other
      'geoview-core/src/geo/utils/projection.ts',
      'geoview-core/src/geo/utils/utilities.ts',
      'geoview-core/src/geo/layer/geometry/geometry.ts',
      // Layer config entry classes and GeoView/GV layer classes reference each other
      'geoview-core/src/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config.ts',
      'geoview-core/src/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config.ts',
      'geoview-core/src/geo/layer/geoview-layers/esri-layer-common.ts',
      'geoview-core/src/geo/layer/geoview-layers/raster/esri-dynamic.ts',
      'geoview-core/src/geo/layer/geoview-layers/raster/wms.ts',
      'geoview-core/src/geo/layer/geoview-layers/raster/wmts.ts',
      'geoview-core/src/geo/layer/geoview-layers/vector/esri-feature.ts',
      'geoview-core/src/geo/layer/geoview-layers/vector/ogc-feature.ts',
      'geoview-core/src/geo/layer/geoview-layers/vector/wfs.ts',
      'geoview-core/src/geo/layer/gv-layers/raster/gv-esri-dynamic.ts',
      'geoview-core/src/geo/layer/gv-layers/raster/gv-wms.ts',
      // FIXME: AbstractBaseGVLayer imports its subclass GVGroupLayer (instanceof); evaluating the base first would hit a TDZ error
      'geoview-core/src/geo/layer/gv-layers/abstract-base-layer.ts',
      'geoview-core/src/geo/layer/gv-layers/abstract-gv-layer.ts',
      'geoview-core/src/geo/layer/gv-layers/gv-group-layer.ts',
    ],
    rules: {
      'import/no-cycle': 'off',
    },
  },

  // JavaScript files (without type-aware linting)
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      // General JS linting rules (no type-aware rules)
      'no-console': 'off',
      'no-unused-vars': 'warn',
    },
  },
];
