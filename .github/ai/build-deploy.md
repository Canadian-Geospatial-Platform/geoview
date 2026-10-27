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

- **Package manager:** Rush uses pnpm; read the pinned version from `pnpmVersion` in `rush.json`.
- **Lockfile**: `common/config/rush/pnpm-lock.yaml` is the committed source of truth; `common/temp/pnpm-lock.yaml` is Rush's generated installation copy.
- **`npm audit`** is unreliable in pnpm workspaces — it reads `node_modules/` but doesn't understand pnpm's symlinked structure, producing false positives. Always cross-reference findings against the pnpm lockfile.
- **Fixing vulnerabilities**:
  - Direct dependencies: bump version in `package.json`, run `rush update`
  - Transitive dependencies: update the parent package, or add pnpm overrides in `common/config/rush/.pnpmfile.cjs`
  - After overrides: run `rush update` to apply them; `--full` also re-resolves every dependency

### CI Workflow Maintenance

Public workflow behavior, administrator prerequisites, and known limits:
[CI workflows](../../docs/programming/ci-workflows.md).

- Keep `main.yml` caller permissions aligned with reusable build/deploy jobs.
  Pass the exact SHA and immutable artifact ID; never restore `dist` from a cache
  or check out a moving branch for a SHA-labelled build.
- `build-check.yml` deliberately uses only `pull_request: locked`; preserve its
  `build-geoview` check identity and never switch to privileged fork execution.
- `rush build` uses non-mutating `packages/` checks before the existing production
  pipeline. Local auto-fixes remain explicit commands.
- `type-build.yml` emits `types/src/app.d.ts`, not `types/app.d.ts`; retain that
  layout on the `types` branch. Exclude incremental compiler state, remove obsolete
  declarations, and preserve branch metadata.
- Pin full verified action SHAs with release comments; review weekly Actions-only
  Dependabot PRs. Node patch pins need separate security review.
- `setup-node` and the runner's internal JavaScript action runtime are separate;
  checking one does not prove the other is patched.

#### Action audit and intentional exceptions

Reviewed for #3702 on 2026-10-23 against upstream release notes and action manifests.
All selected actions use `node24`; workflow files own the exact full-SHA pins and
readable release comments. Selected releases: checkout 7.0.1, setup-node 7.1.0,
upload-artifact 7.0.2, download-artifact 8.0.2, CodeQL 4.39.1,
JamesIves/github-pages-deploy-action 4.9.0, create-pull-request 8.1.1.

- Checkout retains safer fork defaults with credentials disabled. Setup-node's
  ESM migration needs no registry authentication here; automatic npm caching is off.
- Artifact uploads archive directories. Download-artifact extracts a single ID
  directly into the destination and errors on digest mismatch. Deployment also
  requires a numeric ID, matching `build-revision.txt`, and nonempty main bundle.
- CodeQL uses `build-mode: none` for JavaScript/TypeScript, without dependency
  installation or autobuild. Existing push/PR/weekly coverage is retained.
- Pages retains branch/subfolder/single-commit publication. Create-pull-request
  replaces repo-sync to support fixed-branch updates and successful no-op runs.
- Removed redundant pnpm/action-setup: Rush provisions pinned pnpm. Removed cache
  handoff for `dist`; dependency caching is deferred until timings justify it.
  Future store caches must be keyed by OS, Node, Rush/pnpm, and committed lockfile,
  and must never substitute for deployment artifacts.
- Removed inactive, fully commented `main-deprecated`; history retains it.
- Weekly Dependabot updates only `github-actions` against `develop`, including
  SHA pins. It does not update `node-version` values or application dependencies.

#### Publication edge cases

- Both caller and callee declare permissions. Builds get `contents: read`; Pages
  gets `contents: write`; type publication adds `pull-requests: write`; CodeQL adds
  `security-events: write`. Defaults are empty and checkout never persists credentials.
- Preview uses the caller SHA, not moving `develop`. The complete chain is
  serialized without cancellation. Since concurrency queues are not FIFO, check
  the current branch head immediately before publishing. A later push is handled
  by the next run; publication is not atomic with branch advancement.
- Artifacts are named with SHA/run attempt and retained seven days. All-job reruns
  create new IDs; deployment-only retries use the original ID and fail after expiry.
- Type generation is read-only and does not build the browser bundle. Publication
  runs only from the default branch, retains `src/` layout and branch metadata,
  removes obsolete declarations, and excludes incremental compiler state. No
  dependency scripts run in the write-enabled job.
- Type publication checks the current default-branch SHA to reject stale retries,
  updates `new-types` targeting `types` in place, and uses github-actions[bot].
  No diff succeeds; an unnecessary PR closes and its branch is deleted on a
  subsequent no-diff run, not immediately on merge.

#### Shared-tooling migration and rollout evidence

Rush 5.181.0 and pnpm 11.1.1 are pinned for Node 24. `rush.json` requires Node
`>=24.22.1 <25.0.0`; `ensureConsistentVersions` now lives in
`common/config/rush/common-versions.json` per the newer Rush configuration format.

pnpm settings moved from `rush.json` `pnpmOptions` to `common/config/rush/pnpm-config.json`
(required by `rush-pnpm approve-builds`). pnpm 11 fails with `ERR_PNPM_IGNORED_BUILDS`
unless dependency build scripts are approved; `globalAllowBuilds` allows `@swc/core`
(used by `swc-loader`). Rush writes it to `common/temp/pnpm-workspace.yaml` as
`allowBuilds`; a placeholder there means a stale failed run, so rerun `rush update`.

Lockfile migration: pnpm 11 cannot read format `6.0` and `rush update --full`
re-resolved 11 direct dependencies within their ranges. Instead, pnpm 9.15.9 converted
`6.0` → `9.0` in `common/temp`, which was promoted and re-saved by pnpm 11.1.1. All 933
resolved versions are unchanged; only the `geochart` git dependency URL changed form
(same commit). Rush 5.181.0 regenerated `common/scripts/install-run*.js`; the old
5.113.4 scripts spawned `npm.cmd` without a shell, which Node 24 rejects on Windows.
Removed obsolete `always-auth=false` from `common/config/rush/.npmrc` (npm 11 warning).

- **geochart loader gotcha:** `geochart` is a git dependency shipping TypeScript source,
  compiled by a dedicated `swc-loader` rule in `webpack.common.js`. pnpm 11 changed its
  store folder from `github.com+Canadian-Geospatial-Platform+geochart…` to
  `geochart@https+++codeload…`, so a rule matching the folder name fails with
  "Module parse failed: Unexpected token". Match `node_modules/geochart/` instead.

Do not suppress Rush runtime support warnings or revert CI to Node 20.

Local checks passed: source format/lint, declaration generation, six-workflow YAML
parsing/security assertions with 18 SHA references, changed-file formatting, editor
diagnostics, whitespace, and `ai:check`. The maintainer confirmed a successful
Windows `rush build` on Node 24.22.1 after restoring missing portable npm dependencies.
After the Rush 5.181.0 / pnpm 11.1.1 migration, the bootstrap `install` and full `build`
passed on Windows Node 24.22.1 (all 11 projects; "success with warnings" is webpack
progress on stderr, not real warnings). Source files were not modified by the build.
This is not a clean-install or live CI result. Actionlint was unavailable.

Administrators must verify Actions policy allows these pins, hosted Ubuntu 24.04
runners have patched bundled Node (Node 24 actions require runner 2.327.1+), and
**Actions → General → Workflow permissions → Allow GitHub Actions to create and
approve pull requests** is enabled. The workflow creates PRs, not approvals.
Branch rules must allow `new-types` and `gh-pages` pushes. Keep fork approval
restrictions, existing required checks, branch-based Pages, advanced CodeQL, and
Dependabot configuration on the default branch. Bot-created PRs need a maintainer
action or approved App if branch rules require automatically triggered checks.

Live validation remains pending. Record run URLs for locked internal/fork PRs,
CodeQL PR/push/schedule, develop push/manual publication, other-ref build-only runs,
missing/wrong-revision/digest-invalid artifact rejection, stale-run retries, and
scheduled/manual types (new/existing PR, no diff, merged branch remaining).
