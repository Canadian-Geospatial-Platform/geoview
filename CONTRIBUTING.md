This guide is intended for JavaScript developers who are interested in contributing to the Canadian Geospatial Platform Viewer code base. You should be comfortable with the source control tool named Git, have an account on [GitHub](https://github.com), and possess some basic experience with npm, node and Rush.

## Tools
Below is a list of the software you'll need to download and install before continuing:

* A source code editor. We use [Visual Studio Code](https://code.visualstudio.com/) with these extension (Prettier, ESLint and Better Comment), but feel free to use one you're most comfortable with.
> 1. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
> 2. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
> 3. [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
* [Git](https://git-scm.com/downloads)
>A version control system (VCS) for tracking changes in computer files and coordinating work on those files among multiple people.
* [Node.js](https://nodejs.org/en/) v16.15.0+ supported.
>Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world.

## Local Setup
Let's fork the GeoView repo and setup a working local copy.

#### Fork the project
Login to your https://github.com account and navigate to https://github.com/Canadian-Geospatial-Platform/geoview. On this page click on the "Fork" button near the top right corner and follow the on screen prompts to have your own copy of GeoView.

#### Setup forked repository
Now that you have a forked copy of the repo, it is time to set it up on your local machine. Run the following commands in terminal, git bash, or wherever Git and Node are available:

__Clone the forked repo__

```
git clone git@github.com:[GITHUB USERNAME]/geoview.git LOCAL/REPO/PATH
cd LOCAL/REPO/PATH
```
Replace [GITHUB USERNAME] with your github username and LOCAL/REPO/PATH to wherever you'd like to save a copy of the forked repo on your local system. Git will create this path for you if it does not exist.

__Add remotes__
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
You'll be __pulling changes from upstream__, but __pushing to origin__.

__Fetch origin + upstream branches & tags__
```
git fetch --all
```

__Checkout + install__
```
npm install -g @microsoft/rush
git checkout -b BRANCH upstream/UPSTREAM-BRANCH
rush update
```
Replace BRANCH with the name you want to create locally (i.e. __[issue#]-[DESCRIPTION]__) and UPSTREAM-BRANCH to whatever branch/tag you'd like to start working with. It will be typically develop.

__Run locally__

To run the modifications done to the code base do the following:
```
rush serve
```
Open your browser then navigate to http://localhost:8080 to see the viewer in action.

## Meta Documentation
We are using [jsdoc](https://jsdoc.app/) notation for documenting the viewer library.

Documentation blocks for jsdoc should start with /** and generally follow the javadoc format and markup style:
```javascript
/**
 * Main function description.
 * @function functionName
 * @return {Object} random variable
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
* `@function`can be omitted for @class contexts, the parser is smart enough to figure that out, @function should be used everywhere else
* for Promise, describe the type which it will resolve with
* `@private` can be used to document functions which are not exposed by the service, directive or class being documented

## Commits
Commit message format
Each commit message consists of a header and a footer. The header has a special format that includes a type, scope and subject:
```html
<type>(<scope>): <subject>
<footer>
```
Any line of the commit message cannot be longer 100 characters. This allows the message to be easier to read on github as well as in various git tools.

__Type__
Must be one of the following:

* __feat__: A new feature
* __fix__: A bug fix
* __docs__: Documentation only changes
* __style__: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* __refactor__: A code change that neither fixes a bug or adds a feature
* __perf__: A code change that improves performance
* __test__: Adding missing tests
* __chore__: Changes to the build process or auxiliary tools and libraries such as documentation generation

__Scope__
The scope could be anything specifying place of the commit change. For example UI, geoSearch, package, API, etc...

__Subject__
The subject contains succinct description of the change.

__Footer__
The footer is the place to reference GitHub issues that this commit Closes (e.g. Closes #11).

__Sample Commit__
```
fix(ui): Repair broken input box in footer component
Closes #100 
```

## Style Guide
For styling, we use ```eslint-config-airbnb``` based on the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript). Make sure you are doing the following:
* Use camelCase for identifier names (variables and functions)
* Use PascalCase for type names
* Do not use "I" as a prefix for interface names
* Do not export types/functions unless you need to share it across multiple components
* All names start with a letter
* Always put spaces around operators ( = + - * / ), and after colon:
* Remove all trailing white spaces
* Look for bad indentation
* Carriage return are mandatory
> * Before comments
> * Before if condition
> * After if condition
> * Before properties
> * Before classes
> * Before functions

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
Make modification to your branch then commit your work as describe in the previous section. If you need to do new modification to the branch, unless it is something really new, __try to amend to your existing commit__. 
```
git add *
git commit --amend
```

#### Ready to push to upstream
When your work is ready to be pushed to upstream, make sure the latest version has been push to your origin then navigate to the **Pull requests** section of the repository and click create a new pull request. Make sure left branch is `base:develop` and right branch is `compare:[BRANCH NAME]` then click create pull request button.

In the new window, make sure to __connect the issue__ you are working on and __assign a reviewer__. Once this is done, you can create the pull request

#### Reviewable
On the page, after few seconds, a Reviewable button will appear. You can click on it and it will open the tool we use to review the code. On Reviewable, the reviewer may ask for modifications or information. You will have to apply the changes and push back a new version to Reviewable. Once all modifications are done, reply to all the messages in Reviewable with __Done__. If we need precision do not hesitate to add comments to the message. When you are ready to push a new version...
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

__Translations files__

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

__Updating a language__

Find the line in /public/locales/_language_/translation.json that contains the translation you want to change and make the modifications needed for each languages.

__Using translations__

You should refer to the [i18next](https://www.i18next.com/) localization library documentation for a complete guide. Here we'll go through the most useful use cases:

* Import the useTranslation to your file ```import { useTranslation } from 'react-i18next';```
* Create the translation object ```const { t } = useTranslation();```
* Call the object with the proper key
     * Directly inside JavaScript
     ```
        const myValue = t('mapctrl.mouseposition.north')
     ```
     * Inside HTML object
     ```html
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.ariaNavbar')} variant="contained">
     ```
This object will return the appropriate key value for the language selected by the user.
