This guide is intended for JavaScript developers who are interested in contributing to the Canadian Geospatial Platform Viewer code base. You should be comfortable with the source control tool named Git, have an account on [GitHub](https://github.com), and possess some basic experience with npm, node and Rush.

## Tools

Below is a list of the software you'll need to download and install before continuing:

- A source code editor. We use [Visual Studio Code](https://code.visualstudio.com/) with these extension (Prettier, ESLint and Better Comment), but feel free to use one you're most comfortable with.
  > 1. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  > 2. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  > 3. [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
- [Git](https://git-scm.com/downloads)
  > A version control system (VCS) for tracking changes in computer files and coordinating work on those files among multiple people.
- [Node.js](https://nodejs.org/en/) v16.15.0+ supported.
  > Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world.

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
npm install -g @microsoft/rush
git checkout -b BRANCH upstream/UPSTREAM-BRANCH
rush update
```

Replace BRANCH with the name you want to create locally (i.e. **[issue#]-[DESCRIPTION]**) and UPSTREAM-BRANCH to whatever branch/tag you'd like to start working with. It will be typically develop.

**Run locally**

To run the modifications done to the code base do the following:

```
rush serve
```

Open your browser then navigate to http://localhost:8080 to see the viewer in action.

## Meta Documentation

We are using [jsdoc](https://jsdoc.app/) notation for documenting the viewer library.

Documentation blocks for jsdoc should start with /\*\* and generally follow the javadoc format and markup style:

- Start with a clear, concise summary sentence
- For complex functions, use "This method:" or "This function does:" followed by a bulleted list of steps:

```typescript
/**
 * Deletes a MapViewer instance and cleans up all associated resources.
 * This method:
 * - Calls the MapViewer's delete method to clean up OpenLayers resources
 * - Removes the MapViewer from the API's collection
 * - Unmounts the React component from the DOM
 * - Removes the Zustand store and event processors
 * - Optionally deletes the HTML container element
 * @param {string} mapId - The unique identifier of the map to delete
 * @param {boolean} [deleteContainer=true] - Optional true to remove the div element
 * @returns {Promise<void>} Promise that resolves when deletion is complete
 * @static
 */
```

#### Documenting Functions

Javascript allows functions to be defined in a variety of ways. In the context of a service or directive the function will automatically be linked as long as the @module tag is declared on the top level item.

Function Sample

```javascript
/**
 * Add RCS config layers to configuration after startup has finished
 * @function rcsAddKeys
 * @param {Array}  keys    list of keys marking which layers to retrieve
 * @return {Promise} promise of full config nodes for newly added layers
 */
```

- `@function`can be omitted for @class contexts, the parser is smart enough to figure that out, @function should be used everywhere else
- for Promise, describe the type which it will resolve with
- `@private` can be used to document functions which are not exposed by the service, directive or class being documented

#### Required JSDoc Tags

**Every function MUST have:**

- Description (clear, concise summary sentence)
- `@param` for ALL parameters (with `[]` for optional params, e.g., `@param {string} [optional]`)
- `@return` or `@returns` for ALL functions (use `{void}` for void functions, `{Promise<void>}` for async void)

**Additionally REQUIRED based on context:**

- `@static` - On ALL static methods
- `@private` - On ALL private methods (starting with #)
- `@protected` - On ALL protected methods
- `@throws` - When function throws specific error types

**Tag Ordering (REQUIRED):**

1. Description
2. `@param` tags (all parameters)
3. `@return` or `@returns`
4. `@throws` (if applicable)
5. **Modifiers LAST**: `@static`, `@protected`, `@private`, `@override`, `@constructor`

**Examples:**

```typescript
// Void function - @return {void} REQUIRED
/**
 * Performs an action.
 * @param {string} id - The identifier
 * @return {void}
 * @static
 */
static doSomething(id: string): void { }

// Async void - @return {Promise<void>} REQUIRED
/**
 * Loads data asynchronously.
 * @param {string} id - The identifier
 * @return {Promise<void>}
 * @static
 */
static async loadData(id: string): Promise<void> { }

// Private method - @private REQUIRED
/**
 * Internal helper method.
 * @param {string} id - The identifier
 * @return {void}
 * @static
 * @private
 */
static #helperMethod(id: string): void { }

// Optional parameter - [] brackets REQUIRED
/**
 * Configures the component.
 * @param {string} id - The identifier
 * @param {boolean} [optional=false] - Optional flag with default value
 * @return {void}
 * @static
 */
static configure(id: string, optional: boolean = false): void { }
```

## Commits

Commit message format
Each commit message consists of a header and a footer. The header has a special format that includes a type, scope and subject:

```html
<type>(<scope>): <subject>
></type>
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

For styling, we use `eslint-config-airbnb` based on the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript). Make sure you are doing the following:

- Use camelCase for identifier names (variables and functions)
- Use PascalCase for type names
- Do not use "I" as a prefix for interface names
- Do not export types/functions unless you need to share it across multiple components
- All names start with a letter
- Always put spaces around operators ( = + - \* / ), and after colon:
- Remove all trailing white spaces
- Look for bad indentation
- Carriage return are mandatory
  > - Before comments
  > - Before if condition
  > - After if condition
  > - Before properties
  > - Before classes
  > - Before functions

The use of Prettier [Visual Studio Code](https://code.visualstudio.com/) extension let's you format automatically your code to remove most of the styling issue like white space and indentation.

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
git ci --amend
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

The translations file is located in /public/locales/_language_/translation.json. This file contains the translations for the specified language (en or fr)for every viewer component. The file structure is a JSON object with a translation key and a value.

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

Each files needs to have the same key hierarchy to make sure translation is applied properly.

**Updating a language**

Find the line in /public/locales/_language_/translation.json that contains the translation you want to change and make the modifications needed for each languages.

**Using translations**

You should refer to the [i18next](https://www.i18next.com/) localization library documentation for a complete guide. Here we'll go through the most useful use cases:

- Import the useTranslation to your file `import { useTranslation } from 'react-i18next';`
- Create the translation object `const { t } = useTranslation();`
- Call the object with the proper key
  - Directly inside JavaScript
    ```
    const myValue = t('mapctrl.mouseposition.north')
    ```
  - Inside HTML object
    ```html
    <ButtonGroup orientation="vertical" aria-label={t('mapnav.ariaNavbar')} variant="contained">
    ```
    This object will return the appropriate key value for the language selected by the user.
