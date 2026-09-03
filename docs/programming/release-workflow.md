# Release Workflow

GeoView follows a **release branch** workflow (based on Git Flow) that allows release stabilization and feature development to happen in parallel.

## Branch Strategy

| Branch             | Purpose                                               | Lifetime              |
| ------------------ | ----------------------------------------------------- | --------------------- |
| `upstream/develop` | Main development branch — all feature PRs target here | Permanent             |
| `upstream/main`    | Production-ready code — only release merges land here | Permanent             |
| `release/vX.Y.Z`   | Release candidate stabilization and testing           | Temporary (2-3 weeks) |

## Release Cycle Overview

```
upstream/develop ──PR──PR──PR──┬───PR──PR──PR──────────────────merge main──►
                               │                                    ↑
                        cut release branch                          │
                               │                                    │
release/vX.Y.Z ────────fix──fix──fix──retest──────► merge → main ──┘
                               │      │      │          tag vX.Y.Z
                               │      │      │
                          cherry-pick to develop
```

### Phase 1 — Feature Freeze & Branch Cut

When the team decides to start a release cycle:

```bash
# Ensure develop is up to date
git fetch upstream develop

# Create the release branch from develop
git checkout -b release/v1.0.0 upstream/develop
git push upstream release/v1.0.0
```

From this point:

- **No new features** merge into `release/vX.Y.Z` — only bug fixes found during testing
- **Feature PRs continue** targeting `upstream/develop` — developers are unblocked

### Phase 2 — Release Testing (2-3 Weeks)

1. Create a **Release Testing Issue** from the [issue template](../../.github/ISSUE_TEMPLATE/release-testing.md) targeting the release branch
2. Deploy the release branch to a testing environment
3. Testers run the [release testing checklist](release-testing/README.md) against the deployed release branch
4. Failures become bug fix PRs targeting `release/vX.Y.Z`

### Phase 3 — Bug Fixes with Cherry-Pick to Develop

When a bug is found during release testing, the fix must land on **both** the release branch and develop.

#### Option A — PR targets release branch, cherry-pick to develop (recommended)

This is the standard approach when the fix is straightforward:

```bash
# 1. Developer creates fix branch from the release branch
git fetch upstream
git checkout -b fix/issue-1234 upstream/release/v1.0.0

# 2. Make the fix, commit, push
git add .
git commit -m "fix: resolve layer visibility bug (#1234)"
git push origin fix/issue-1234

# 3. Create PR targeting upstream/release/v1.0.0
#    → PR is reviewed, approved, merged

# 4. Cherry-pick the merge commit to develop
git fetch upstream
git checkout -b cherry-pick/issue-1234 upstream/develop

# Find the merge commit hash from the release branch
git log upstream/release/v1.0.0 --oneline -5
# Example output:
# abc1234 Merge pull request #1235 from fix/issue-1234
# def5678 fix: resolve layer visibility bug (#1234)

# Cherry-pick the fix commit (NOT the merge commit)
git cherry-pick def5678

# If there are conflicts, resolve them
git status
# Edit conflicting files...
git add .
git cherry-pick --continue

# Push and create PR targeting develop
git push origin cherry-pick/issue-1234
# → Create PR targeting upstream/develop
```

#### Option B — PR targets develop, cherry-pick to release (for complex fixes)

Use this when the fix involves code that has diverged between branches:

```bash
# 1. Developer creates fix branch from develop
git checkout -b fix/issue-1234 upstream/develop

# 2. Make the fix, PR to develop (standard flow)
# 3. After merge to develop, cherry-pick to release
git checkout -b cherry-pick/issue-1234-release upstream/release/v1.0.0
git cherry-pick <commit-hash-from-develop>
git push origin cherry-pick/issue-1234-release
# → Create PR targeting upstream/release/v1.0.0
```

#### Cherry-Pick Tips

**Finding the right commit to cherry-pick:**

```bash
# List recent commits on the release branch
git log upstream/release/v1.0.0 --oneline -10

# Show the diff of a specific commit
git show <commit-hash>

# Cherry-pick multiple related commits
git cherry-pick abc1234 def5678

# Cherry-pick a range (oldest..newest, exclusive of oldest)
git cherry-pick abc1234..ghi9012
```

**Handling cherry-pick conflicts:**

```bash
# If cherry-pick fails with conflicts
git cherry-pick <commit-hash>
# CONFLICT (content): Merge conflict in src/file.ts

# See what's conflicting
git status

# Resolve conflicts in your editor, then
git add .
git cherry-pick --continue

# Or abort if it's too messy (use Option B instead)
git cherry-pick --abort
```

**Key rule:** Cherry-pick the **fix commit(s)**, not the merge commit. Merge commits include the full branch diff which may not apply cleanly.

### Phase 4 — Release

Once all testing passes and the release branch is stable:

```bash
# Merge release branch into main
git fetch upstream
git checkout main
git merge upstream/release/v1.0.0

# Tag the release
git tag v1.0.0
git push upstream main --tags

# Create GitHub Release from the tag
```

### Phase 5 — Post-Release Sync

After the release is tagged and merged to main:

```bash
# Merge main into develop to bring any remaining RC fixes
git fetch upstream
git checkout develop
git merge upstream/main

# Push the synced develop
git push upstream develop

# Delete the release branch (it's done)
git push upstream --delete release/v1.0.0
```

**Use merge, not rebase** for `develop ← main`. Rebasing rewrites history for every contributor's local clone.

## Rules Summary

| Rule                                          | Details                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| Release branch is cut from `upstream/develop` | Never from `main` or a feature branch                          |
| No features on the release branch             | Only bug fixes found during testing                            |
| Cherry-pick fixes immediately                 | Don't wait until release is tagged — sync to develop as you go |
| Lock the release branch                       | Only release-fix PRs can merge (use GitHub branch protection)  |
| Merge (not rebase) for syncing                | `develop ← main` sync uses merge to preserve history           |
| Delete release branch after tag               | It served its purpose — the tag preserves the state            |

## FAQ

**Q: What if a cherry-pick conflicts badly?**
Use Option B — make the fix on develop first, then cherry-pick (or manually port) to the release branch. The release branch has diverged less from develop at this point.

**Q: What if a fix on the release branch depends on new code only in develop?**
This shouldn't happen if the release branch only has bug fixes. If it does, the fix needs to be implemented differently for each branch. Make the fix on the release branch with the available code, then make a separate (potentially different) fix for develop.

**Q: Can we hotfix main directly?**
For critical production issues after a release, yes — create a `hotfix/vX.Y.Z` branch from `main`, fix, merge to main, tag `vX.Y.1`, then merge main back into develop. But this should be rare.

**Q: When do we cut the release branch?**
When the team agrees that `develop` has all the features intended for the release. This is a team decision, not automated.

## Build Version Suffix (dev vs release)

The app bar **Version** popover shows the build version. To make it obvious when a user is looking at a non-release (development) deployment — such as the gh-pages preview published from `develop` — development builds append a `-dev.<shortHash>` suffix to the version.

| Build | Config | `GEOVIEW_BUILD_IS_DEV` | Version shown | Example |
| ----- | ------ | ---------------------- | ------------- | ------- |
| `rush serve` / `npm run serve` | `webpack.dev.js` | `true` | with suffix | `v.2.3.0-dev.a1b2c3d` |
| `npm run build-dev` | `webpack.dev-build.js` | `true` | with suffix | `v.2.3.0-dev.a1b2c3d` |
| gh-pages develop preview (CI) | `webpack.prod.js` | `true` (set in `build.yml`) | with suffix | `v.2.3.0-dev.a1b2c3d` |
| Official release / local `npm run build` | `webpack.prod.js` | unset → `false` | clean | `v.2.3.0` |

**How it works:**

- The dev configs (`webpack.dev.js`, `webpack.dev-build.js`) set `process.env.GEOVIEW_BUILD_IS_DEV = 'true'` before requiring `webpack.common.js`.
- `webpack.prod.js` respects an external value and defaults to release: `process.env.GEOVIEW_BUILD_IS_DEV = process.env.GEOVIEW_BUILD_IS_DEV ?? 'false'`. The gh-pages CI build (`.github/workflows/build.yml`) sets `GEOVIEW_BUILD_IS_DEV: 'true'` so the develop preview is tagged even though it uses the production config; an official release runs the same build without the flag and stays clean.
- In `webpack.common.js`, `versionSuffix` is `dev.<shortHash>` when the flag is dev and `''` otherwise, then injected into the `__VERSION__` object via `DefinePlugin` (as `suffix`) and included in the JS banner.
- `version.tsx` appends `-${__VERSION__.suffix}` to the displayed version only when a suffix is present.

The distinction is driven by the **build/deploy context** (the `GEOVIEW_BUILD_IS_DEV` flag), not the branch. Release builds default to clean; any development or preview build opts into the suffix.

