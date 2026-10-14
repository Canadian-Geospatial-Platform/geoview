# Build, deployment and dependency auditing

> Reference for specialist agents. Summary rules: `.github/instructions/`. Index: `AGENTS.md`.

### gh-pages Deployment & Build Version Suffix

- **The gh-pages develop preview is built with the PRODUCTION webpack config, not `webpack.dev-build.js`.** The `.github/workflows/build.yml` job runs `rush build`, which maps to each package's `build` script; for `geoview-core` that is `webpack --config webpack.prod.js`. So the public preview at `canadian-geospatial-platform.github.io/geoview/public/` is a minified/brotli **prod** bundle deployed from the `develop` branch. Official releases use the same prod build, just deployed to the CDN (`viewer-visualiseur.services.geo.ca/apps/GeoView/{VERSION}/`). "dev vs release" is therefore a **deployment** distinction, not a webpack-config one.
- **Version suffix mechanism** (`v.2.3.0-dev.<shortHash>` on dev/preview, clean `v.2.3.0` on release): a `GEOVIEW_BUILD_IS_DEV` env flag drives it.
  - `webpack.common.js` computes `shortHash` and `versionSuffix = isDevBuild ? 'dev.<shortHash>' : ''`, injects `suffix` into `__VERSION__` via `DefinePlugin` (must be `JSON.stringify()`'d — DefinePlugin values are injected as raw code, so strings need quoting), and mirrors it in the `BannerPlugin`.
  - `webpack.dev.js` / `webpack.dev-build.js` set `process.env.GEOVIEW_BUILD_IS_DEV = 'true'` **before** `require('./webpack.common')`.
  - `webpack.prod.js` respects an external override and defaults to release: `process.env.GEOVIEW_BUILD_IS_DEV ??= 'false'`. This is why the gh-pages CI (`build.yml`) can set `GEOVIEW_BUILD_IS_DEV: 'true'` to tag the develop preview even though it uses the prod config, while an unflagged release stays clean.
  - `version.tsx` renders `__VERSION__.suffix` (typed as optional `suffix?: string` on `TypeAppVersion`) only when present.
- **Config-file `no-undef` gotcha:** in the webpack `.js` config files, `__dirname` is accepted by ESLint but `__filename` triggers `no-undef`. Use `path.resolve(__dirname, 'webpack.common.js')` instead of `__filename`.

### Package Manager & Security Auditing

- **pnpm 8.x** is the package manager under Rush (configured in `rush.json`)
- **Lockfile**: `common/temp/pnpm-lock.yaml` is the single source of truth for installed versions
- **`npm audit`** is unreliable in pnpm workspaces — it reads `node_modules/` but doesn't understand pnpm's symlinked structure, producing false positives. Always cross-reference findings against the pnpm lockfile.
- **Fixing vulnerabilities**:
  - Direct dependencies: bump version in `package.json`, run `rush update`
  - Transitive dependencies: update the parent package, or add pnpm overrides in `common/config/rush/.pnpmfile.cjs`
  - After overrides: run `rush update --full` to regenerate the lockfile
