# Dependency Management

This guide covers the two dependency management workflows for the GeoView Rush monorepo: **full audit** and **specific dependency update**.

> **Agent shortcut:** Run `@DepUpdate` in Copilot chat for interactive assistance with either workflow.

## Report Storage

All audit and migration reports are saved as markdown files in `docs/programming/dependency-reports/`:

| Report Type         | File Name Pattern         | Example                    |
| ------------------- | ------------------------- | -------------------------- |
| Full audit          | `audit-YYYY-MM-DD.md`     | `audit-2026-04-30.md`      |
| Specific dependency | `[package]-YYYY-MM-DD.md` | `openlayers-2026-04-30.md` |

These files are **committed to git** (not gitignored). They serve as historical records of dependency state, migration decisions, and risk assessments — similar to Architecture Decision Records (ADRs).

## Prerequisites

- Rush monorepo with `ensureConsistentVersions: true` in `common/config/rush/common-versions.json`
- **Never** run `npm install` directly for repository dependencies — use `rush install` for the committed lockfile or `rush update` for intentional dependency changes.
- **Node.js 24 LTS, version 24.22.1 or a newer patched 24.x release**, including its bundled npm. Node 16 and Node 20 are end-of-life and are not the developer baseline.
- Rush automatically installs and uses the Rush/pnpm versions pinned in `rush.json`; no separate pnpm installation is needed. The pins are not automatically upgraded to the latest releases.
- A global Rush launcher is optional: from the repository root, use `node common/scripts/install-run-rush.js <command>` instead of `rush <command>`. See [local setup](../../CONTRIBUTING.md#local-setup).

The `rush.json` Node range and Rush/pnpm pins define this repository's supported toolchain. Only maintainers change them; see [Upgrading the toolchain](#upgrading-the-toolchain-maintainers).

## Upgrading the toolchain (maintainers)

Changing the pnpm major is a tooling change, not a dependency update: resolved versions must stay unchanged.

1. Change `pnpmVersion` (and `rushVersion` if needed) in `rush.json`, then run `rush update` from the repository root. Avoid `--full`: it re-resolves every dependency and pulls newer versions within the declared ranges.
2. If the new pnpm cannot read the current lockfile format, convert it first with an intermediate pnpm release that reads the old format and writes the new one: run `rush update` with that version, copy `common/temp/pnpm-lock.yaml` to `common/config/rush/pnpm-lock.yaml`, then switch to the target version and run `rush update` again.
3. A Rush upgrade regenerates `common/scripts/install-run*.js`; commit those generated files.
4. Confirm the lockfile diff changes only its format, then verify with `node common/scripts/install-run-rush.js install` and `node common/scripts/install-run-rush.js build`.
5. Tell developers to follow [Upgrading an existing clone](../../README-DEV.md#upgrading-an-existing-clone).

## Workflow 1 — Full Dependency Audit

Use this workflow periodically (e.g., quarterly) or before a major release to assess overall dependency health.

### Step 1 — Gather Data

1. Collect all `package.json` files:
   - `packages/geoview-core/package.json` (primary — most dependencies)
   - `packages/geoview-*/package.json` (plugins)
   - `packages/package.json` (workspace root)
2. Run update check (do **not** apply):
   ```bash
   npx npm-check-updates --packageFile packages/geoview-core/package.json
   ```
3. List managed packages:
   ```bash
   rush list --json
   ```

### Step 2 — Classify Dependencies

Assign each dependency a risk tier:

| Tier | Label           | Criteria                                                           |
| ---- | --------------- | ------------------------------------------------------------------ |
| 🔴   | **Critical**    | Known CVE, end-of-life, or >2 major versions behind                |
| 🟠   | **High Risk**   | 1+ major version behind with documented breaking changes           |
| 🟡   | **Medium Risk** | Minor versions behind, new features available, no breaking changes |
| 🟢   | **Low Risk**    | Patch versions behind or fully up-to-date                          |

### Step 3 — Analyze Key Dependencies

Focus on these categories first:

| Category             | Dependencies                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Map Engine**       | `ol` (OpenLayers)                                                                                                          |
| **UI Framework**     | `@mui/material`, `@mui/icons-material`, `@mui/lab`, `@mui/system`, `@mui/x-date-pickers`, `@mui/x-tree-view`, `@emotion/*` |
| **State Management** | `zustand`                                                                                                                  |
| **Build**            | `webpack`, `typescript`, `ts-loader`                                                                                       |
| **React Ecosystem**  | `react`, `react-dom`, `react-i18next`, `i18next`                                                                           |
| **Data/Tables**      | `material-react-table`                                                                                                     |
| **Utilities**        | `lodash`, `axios`, `linkify-html`                                                                                          |

For each key dependency, document:

- **Current version** vs **latest version**
- **Changelog highlights** (breaking changes between current and latest)
- **Impact on GeoView** (which packages/files would be affected)
- **Can it be updated independently?** Or does it require coordinated changes?

### Step 4 — Cross-Package Consistency

1. Verify all `packages/geoview-*/package.json` files use consistent versions of shared dependencies
2. Flag any version mismatches
3. Check `peerDependencies` alignment (especially React, OpenLayers)

### Step 5 — Report

Produce a structured report:

```
## Dependency Audit Report — [Date]

### Summary
- Total dependencies: X (Y direct, Z dev)
- 🔴 Critical: N
- 🟠 High Risk: N
- 🟡 Medium Risk: N
- 🟢 Low Risk: N

### 🔴 Critical — Immediate Action Required
| Package | Current | Latest | Issue |
|---------|---------|--------|-------|

### 🟠 High Risk — Plan Migration
| Package | Current | Latest | Breaking Changes |
|---------|---------|--------|------------------|

### 🟡 Medium Risk — Schedule Update
| Package | Current | Latest | Notes |
|---------|---------|--------|-------|

### Cross-Package Mismatches
| Package | geoview-core | geoview-geochart | ... |
|---------|-------------|-----------------|-----|
```

### Step 6 — Prioritize Updates

Organize updates into three categories:

1. **Quick wins** — Patch/minor updates with no breaking changes → single PR
2. **Coordinated updates** — Dependencies that must be updated together (e.g., all `@mui/*` packages) → single PR with testing
3. **Major migrations** — Large efforts requiring feature branch, extensive testing, staged rollout → dedicated sprint item

---

## Workflow 2 — Specific Dependency Update

Use this workflow when evaluating whether to update a particular dependency to a new version.

### Step 1 — Define the Update

Document the basics:

| Field                     | Value                                                                    |
| ------------------------- | ------------------------------------------------------------------------ |
| **Package**               | e.g., `ol`                                                               |
| **Current version**       | e.g., `9.2.0`                                                            |
| **Target version**        | e.g., `10.0.0`                                                           |
| **Motivation**            | New feature needed / Security fix / Peer dependency / Staying current    |
| **Appetite for breakage** | None (drop-in) / Minor refactoring acceptable / Major rewrite acceptable |
| **Timeline**              | Urgent / Next sprint / When convenient                                   |

### Step 2 — Research the Upgrade

1. Read the changelog or migration guide for the target version
2. Identify all breaking changes between current and target versions
3. Check the dependency's GitHub issues for reported problems with the target version
4. Verify TypeScript type compatibility with the project's TypeScript version

### Step 3 — Impact Analysis

Search the codebase for usage patterns:

```bash
# Find all imports of the package
grep -r "from 'package-name" packages/ --include="*.ts" --include="*.tsx" | wc -l

# Find configuration references
grep -r "package-name" packages/ --include="*.js" --include="*.json" | head -20
```

Document:

1. **Direct usage** — How many files import from this package? Which API patterns are used?
2. **Indirect impact** — Does this package have peer dependencies that also need updating?
3. **Plugin cascade** — Will plugin packages need changes?
4. **Build impact** — Does this affect webpack config, TypeScript config, or build scripts?
5. **Type changes** — Are there TypeScript signature changes that would cause compile errors?

### Step 4 — Migration Decision

Use this decision matrix:

| Factor                 | ✅ Migrate      | ⚠️ Migrate with caution   | ❌ Do not migrate yet        |
| ---------------------- | --------------- | ------------------------- | ---------------------------- |
| **Breaking changes**   | None or trivial | Moderate, well-documented | Extensive, poorly documented |
| **Files affected**     | <10             | 10–50                     | >50                          |
| **Peer deps**          | None change     | Minor updates needed      | Major cascade                |
| **Test coverage**      | Covered areas   | Partially covered         | Untested areas               |
| **Community adoption** | Widely adopted  | Early adopters            | Brand new release            |

### Step 5 — Migration Plan

If proceeding, create a concrete plan:

```
## Migration Plan: [package] v[current] → v[target]

### Recommendation: ✅ / ⚠️ / ❌

### Breaking Changes Affecting GeoView
1. [Change] — [Which files/patterns affected]
2. ...

### Migration Steps
1. Update version in package.json
2. Run `rush update`
3. Fix breaking changes:
   - [ ] File X: change pattern Y to Z
   - [ ] File A: update import from B to C
   - ...
4. Run `rush build` and fix compile errors
5. Test in browser:
   - [ ] Map rendering
   - [ ] Layer loading
   - [ ] UI interactions
   - [ ] Plugin functionality

### Dependencies to Update Together
- [List packages that must be updated in the same PR]

### Rollback Plan
- Revert package.json changes
- Run `rush update`
- Verify build passes

### Estimated Scope
- Files to modify: ~N
- Risk level: Low / Medium / High
- Approach: Single PR / Feature branch / Staged rollout
```

### Step 6 — Execute

1. Create a feature branch: `git checkout -b dep/package-name-vX upstream/develop`
2. Update `package.json` version(s)
3. Run `rush update`
4. Run `rush build` — fix all compile errors (the build also fails on formatting or lint issues)
5. Run `rush serve` — test in browser
6. Run `npm run format` and `npm run fix` from `packages/` to correct issues
7. Commit and create PR

---

## Rush-Specific Considerations

### Version Consistency

With `ensureConsistentVersions: true`, Rush enforces that all packages use the same version of any shared dependency. When updating a dependency used by multiple packages:

1. Update **all** `package.json` files that reference it
2. Or update the one in `geoview-core` and let Rush flag inconsistencies on `rush update`

### Update Commands

```bash
# Install dependencies after version changes
rush update

# Clean reinstall from the committed lockfile (if something seems wrong)
rush purge
rush install

# Build all packages to verify no compile errors
rush build

# Check formatting and linting without changing files
cd packages && npm run check
```

### Dependencies with Install Scripts

pnpm only runs dependency install scripts for approved packages. If `rush update` fails with `ERR_PNPM_IGNORED_BUILDS` after adding a dependency, review the package and, if it is trusted and needs its script, run `rush-pnpm --subspace default approve-builds`. Rush records the approval in `globalAllowBuilds` in `common/config/rush/pnpm-config.json`; commit that file with the lockfile.

### Common Coordinated Updates

These dependencies must always be updated together:

| Group       | Packages                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| **MUI**     | `@mui/material`, `@mui/icons-material`, `@mui/lab`, `@mui/system`, `@mui/x-date-pickers`, `@mui/x-tree-view` |
| **Emotion** | `@emotion/react`, `@emotion/styled`                                                                          |
| **React**   | `react`, `react-dom`, `@types/react`, `@types/react-dom`                                                     |
| **i18next** | `i18next`, `react-i18next`                                                                                   |
| **Webpack** | `webpack`, `webpack-cli`, `webpack-dev-server`                                                               |

---

## Security Auditing

### pnpm vs npm audit

GeoView uses **pnpm** (via Rush) as its package manager — **not npm**. This has important implications for security auditing:

- **`npm audit`** reads the local `node_modules/` tree but does **not** understand pnpm's symlinked/hoisted structure. Results may include false positives or miss actual issues.
- **`pnpm audit`** is the correct tool, but must be run through Rush's pnpm wrapper:
  ```bash
  # From the repo root — uses Rush's managed pnpm
  common/temp/pnpm-local audit --dir packages/geoview-core
  ```
- **`npm audit fix` does NOT work in Rush** — it tries to modify a `package-lock.json` (which doesn't exist in pnpm workspaces) and would corrupt Rush's dependency management.

### Fixing Vulnerabilities in Rush

| Vulnerability Type                                                  | Fix Approach                                       |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| **Direct dependency** (in our `package.json`)                       | Bump version in `package.json`, run `rush update`  |
| **Transitive dependency** (locked by a parent)                      | Update the parent package, or add pnpm overrides   |
| **No fix available** (e.g., lodash <=4.17.23 but latest is 4.17.21) | Document in audit report, monitor for upstream fix |

#### pnpm Overrides (for transitive dependencies)

When a transitive dependency has a vulnerability but the parent hasn't updated yet, force the version via pnpm overrides in `common/config/rush/.pnpmfile.cjs`:

```javascript
function readPackage(pkg) {
  // Force serialize-javascript to patched version
  if (pkg.dependencies && pkg.dependencies["serialize-javascript"]) {
    pkg.dependencies["serialize-javascript"] = ">=6.0.3";
  }
  return pkg;
}
module.exports = { hooks: { readPackage } };
```

After adding overrides, run `rush update` to apply them to the lockfile. Use `rush update --full` only if you also want every dependency re-resolved to its newest allowed version.

### Audit Checklist (include in every full audit report)

1. Run `pnpm audit` (or `npm audit` as approximation) on `packages/geoview-core`
2. Classify each vulnerability:
   - **Fixable directly** — bump our version
   - **Fixable via override** — force transitive version
   - **Needs parent update** — document and track upstream issue
   - **No fix available** — document, assess actual risk (dev-only? runtime?)
3. Separate **dev dependencies** from **production dependencies** — dev-only vulnerabilities (webpack, typedoc, etc.) have lower risk since they don't ship to users
4. Add a Security Vulnerabilities section to the audit report
