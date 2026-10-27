This guide is intended for JavaScript developers who are interested in contributing to the Canadian Geospatial Platform Viewer code base. You should be comfortable with the source control tool named Git, have an account on [GitHub](https://github.com), and possess some basic experience with npm, node and Rush.

## Tools

Below is a list of the software you'll need to download and install before continuing:

- A source code editor. We use [Visual Studio Code](https://code.visualstudio.com/) with these extension (Prettier, ESLint and Better Comment), but feel free to use one you're most comfortable with.
  > 1. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  > 2. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  > 3. [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
- [Git](https://git-scm.com/downloads)
  > A version control system (VCS) for tracking changes in computer files and coordinating work on those files among multiple people.
- [Node.js](https://nodejs.org/en/) 24 LTS, version **24.22.1 or a newer patched 24.x release**, including its bundled npm. Do not use end-of-life Node 16 or Node 20.
  > Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world.

Rush installs everything else it needs, including pnpm; you don't need to install either globally.

On Windows without administrator rights, extract the complete official Node.js ZIP (not just `node.exe`) into a user folder, add it to your `PATH`, and check that `node --version` and `npm --version` both work.

## Local Setup

Let's fork the GeoView repo and setup a working local copy.

#### Fork the project

Login to your https://github.com account and navigate to https://github.com/Canadian-Geospatial-Platform/geoview. On this page click on the "Fork" button near the top right corner and follow the on screen prompts to have your own copy of GeoView.

#### Setup forked repository

Now that you have a forked copy of the repo, it is time to set it up on your local machine. Run the following commands in terminal, git bash, or wherever Git and Node are available:

**Clone the forked repo**

```
git clone git@github.com:[GITHUB USERNAME]/geoview.git LOCAL/REPO/PATH
cd LOCAL/REPO/PATH
```

Replace [GITHUB USERNAME] with your github username and LOCAL/REPO/PATH to wherever you'd like to save a copy of the forked repo on your local system. Git will create this path for you if it does not exist.

**Add remotes**

```
git remote add upstream https://github.com/Canadian-Geospatial-Platform/geoview.git
```

To make sure you are properly setup, check if both remote are ok

```
git remote -v
```

You should see

```
origin  https://github.com/[GITHUB USERNAME]/geoView (fetch)
origin  https://github.com/[GITHUB USERNAME]/geoView (push)
upstream        https://github.com/Canadian-Geospatial-Platform/geoView (fetch)
upstream        https://github.com/Canadian-Geospatial-Platform/geoView (push)
```

You'll be **pulling changes from upstream**, but **pushing to origin**.

**Fetch origin + upstream branches & tags**

```
git fetch --all
```

**Checkout + install**

```
git checkout -b BRANCH upstream/UPSTREAM-BRANCH
node common/scripts/install-run-rush.js install
```

Replace BRANCH with the name you want to create locally (i.e. **[issue#]-[DESCRIPTION]**) and UPSTREAM-BRANCH to whatever branch/tag you'd like to start working with. It will be typically develop.

If you have Rush installed globally, you can use `rush install` instead. If you already have a clone, see [Upgrading an existing clone](README-DEV.md#upgrading-an-existing-clone).

**Run locally**

To run the modifications done to the code base do the following:

```
node common/scripts/install-run-rush.js serve
```

Open your browser then navigate to http://localhost:8080 to see the viewer in action.

## Meta Documentation

We document the code with [JSDoc](https://jsdoc.app/) comments. See [JSDoc Best Practices](docs/programming/best-practices.md#documentation-standards) for the project rules.

A documentation block starts with `/**`, has a summary sentence ending with a period, then `@param` and `@returns` tags without types (TypeScript already provides them) or trailing periods:

```ts
/**
 * Adds the configured layers to the map once startup has finished.
 *
 * @param layerIds - Optional list of layer ids to add
 * @returns A promise that resolves with the layers that were added
 */
```

Omit `@returns` for functions that return nothing.

## Commits

Each commit message has a header and a footer. The header includes a type, a scope and a subject:

```
<type>(<scope>): <subject>
<footer>
```

Any line of the commit message cannot be longer 100 characters. This allows the message to be easier to read on github as well as in various git tools.

**Type**
Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug or adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

**Scope**
The scope could be anything specifying place of the commit change. For example UI, geoSearch, package, API, etc...

**Subject**
The subject contains succinct description of the change.

**Footer**
The footer is the place to reference GitHub issues that this commit Closes (e.g. Closes #11).

**Sample Commit**

```
fix(ui): Repair broken input box in footer component
Closes #100
```

## Style Guide

Code style is enforced by [ESLint](https://eslint.org/) (TypeScript, React, React Hooks and accessibility rules) and [Prettier](https://prettier.io/); the configuration is in `packages/eslint.config.js` and `packages/.prettierrc`. Install the Prettier and ESLint VS Code extensions to format and see issues as you type.

Before committing, run from the `packages/` folder:

- `npm run format` to format the code
- `npm run fix` to fix ESLint issues automatically
- `npm run check` to verify both without changing files

`rush build` runs the same check and fails if formatting or lint issues remain.

Naming conventions:

- Use camelCase for variables and functions
- Use PascalCase for types, interfaces and React components
- Do not use "I" as a prefix for interface names
- Do not export types or functions unless they are shared across files

See [Best Practices](docs/programming/best-practices.md) for the complete coding conventions.

## How to push to upstream

We follow the fork and pull model which lets anyone fork an existing repository and push changes to their personal fork without requiring access be granted to the source repository. The changes must then be pulled into the source repository by the project maintainer.

#### Create a branch

First create a branch from upstream latest version. A best practice will be to use the issue number and description to name the branch e.g. `26-aws-amplify`

```
git fetch --all
git checkout -b [issue#]-[DESCRIPTION] upstream/develop
```

#### Work on the created branch

Make modification to your branch then commit your work as describe in the previous section. If you need to do new modification to the branch, unless it is something really new, **try to amend to your existing commit**.

```
git add *
git commit --amend
```

#### Ready to push to upstream

When your work is ready to be pushed to upstream, make sure the latest version has been push to your origin then navigate to the **Pull requests** section of the repository and click create a new pull request. Make sure left branch is `base:develop` and right branch is `compare:[BRANCH NAME]` then click create pull request button.

In the new window, make sure to **connect the issue** you are working on and **assign a reviewer**. Once this is done, you can create the pull request

#### Reviewable

On the page, after few seconds, a Reviewable button will appear. You can click on it and it will open the tool we use to review the code. On Reviewable, the reviewer may ask for modifications or information. You will have to apply the changes and push back a new version to Reviewable. Once all modifications are done, reply to all the messages in Reviewable with **Done**. If we need precision do not hesitate to add comments to the message. When you are ready to push a new version...

```
git add *
git commit --amend
git push -f origin [BRANCH NAME]
```

Reviewable will see a new commit has been push and will update with the new information. This process can be done in loop until everything is resolve. Then the reviewer will merge the **Pull Request** and the code will be available to all the other developers.

#### Rebase and conflicts

In Git, there are two main ways to integrate changes from one branch into another: the merge and the rebase. We use rebase instead of merge since it integrates new changes into one clean timeline.

If you were working from an outdated version of the base branch, your commit history has diverged from the upstream base branch. When you rebase, you are updating your base branch to the latest commit, and then placing your commits on top of that. If you are in this case, you will need to do this prior of your Pull Request.

```
git fetch --all
git rebase upstream/develop
```

You may have conflicts and this will abort the rebase. You will have to solve them before finishing it. To do so, resolve any conflicts. Make sure not to remove anything that may be needed, in doubt, ask a question. Once this is done...

```
git add *
git rebase --continue
```

Your branch is now clean and you can proceed with the Pull Request.

## Translations

The viewer can support multiple languages. We currently support both English and French. Use this guide to understand how to add, remove, or change language translations as well as how to use these translations in your code.

We use the [i18next](https://www.i18next.com/) localization library.

**Translations files**

The translation files are in `packages/geoview-core/public/locales/<language>/translation.json`, one per language (`en` and `fr`). Each file is a JSON object of translation keys and values.

Translation key is string identifier that we'll use later in this guide to tell the translation service to fetch this particular translation. It contains no spaces or special characters. We can create nested object to organize translations into groupings.

Here is a sample translation for en:

```json
{
  "mapnav": {
    "fullscreen": "Full Screen",
    "home": "Home",
    "zoomIn": "Zoom in",
    "zoomOut": "zoom out"
  },
  "mapctrl": {
    "mouseposition": {
      "east": "E",
      "west": "W",
      "north": "N",
      "south": "S"
    }
  }
}
```

Both files must have the same key hierarchy. When you add or change a key, update `en` and `fr` together.

**Updating a language**

Find the key in `packages/geoview-core/public/locales/<language>/translation.json` and update its value in each language.

**Using translations**

You should refer to the [i18next](https://www.i18next.com/) localization library documentation for a complete guide. Here we'll go through the most useful use cases:

- Import the hook: `import { useTranslation } from 'react-i18next';`
- Create the translation function: `const { t } = useTranslation();`
- Call it with the key, either in code or in JSX:

```tsx
const myValue = t('mapctrl.mouseposition.north');

<ButtonGroup orientation="vertical" aria-label={t('mapnav.ariaNavbar')} variant="contained">
```

`t()` returns the value for the language selected by the user. Never hard-code user-facing text.
