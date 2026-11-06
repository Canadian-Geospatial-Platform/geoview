# CI workflows

## Tooling

CI uses **Node 24.22.1**, the Rush/pnpm versions pinned in `rush.json`, and the
committed lockfile. Rush installs pnpm automatically; no global installation is
needed. `rush build` checks formatting and lint without changing source files.

Actions are SHA-pinned. Dependabot proposes weekly Actions updates; maintainers
must review Node patch updates separately.

## Workflow files

- **`main.yml`** — builds and publishes the `develop` preview. Manual runs from other refs build only.
- **`build.yml`** — reusable production build; uploads the selected commit's output.
- **`build-check.yml`** — builds a PR **only when a maintainer locks it**; does not publish.
- **`deploy.yml`** — publishes verified output to `gh-pages/public`.
- **`codeql-analysis.yml`** — scans JavaScript/TypeScript on configured pushes, PRs, and the weekly schedule; no build required.
- **`type-build.yml`** — generates declarations on Fridays or manually; default-branch runs update `new-types` → `types`.

## Publishing

- Deployment uses the build's immutable artifact, verifies its digest and revision,
  and skips superseded commits. Missing or invalid output fails before publishing.
- Publishing is serialized and not canceled mid-run. Builds from untrusted PRs
  have no write permissions or repository secrets.
- Artifacts expire after **seven days**. If a deployment retry cannot find its
  artifact, rerun the complete workflow.
- Type publication reuses the existing PR. Unchanged declarations are a successful
  no-op; obsolete declarations are removed and commits use bot attribution.
- The preview uses the production webpack config with a development version suffix;
  see [build versioning](release-workflow.md#build-version-suffix-dev-vs-release).

## Repository settings

- Allow the pinned actions and use current runners with a patched Node 24 action runtime.
- Allow Actions to create PRs, push `new-types`, and publish to `gh-pages`.
- Keep Pages serving `gh-pages`, CodeQL enabled, and the existing required checks.
- Put the Dependabot configuration on the default branch. Bot-created type PRs do
  not trigger further workflows with `GITHUB_TOKEN`; required checks may need a
  maintainer action or an approved GitHub App.

## Dependency review and intentional exceptions

Rush **5.181.0** and pnpm **11.1.1** are pinned for Node 24. The
repository now requires Node **24.22.1 or later in the 24.x line**. The lockfile
was converted to pnpm 11's format with all 933 resolved package versions unchanged.
pnpm 11 runs dependency build scripts only for approved packages (`@swc/core`).
Live GitHub workflow validation remains pending.

The [maintenance reference](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/build-deploy.md#ci-workflow-maintenance)
contains the detailed action audit, implementation notes, and rollout checklist.
