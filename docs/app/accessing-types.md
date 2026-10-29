## Access Types in Typescript Projects

GeoView provides the types used in the project for developers to use in their own typescript projects.

**The types are available at:**

    https://github.com/Canadian-Geospatial-Platform/geoview/tree/types

### If types are out of synch

The types needs to be rebuild from time to time. To do this, follow this procedure

```
rush build:core
```
This will create a branch called ```types``` in your origin remote

__NOTE: the current workflow is not able to push to upstream so manual procedure is needed__
Create a Pull Request to merge your origin types branch into upstream types.

### How does it work

The types are hosted in a different branch than the main viewer. When the code of the viewer is updated and the build command is executed, if there are any changes to the types in the viewer the types branch will get automatically updated with the latest build.

### Using the types in your own typescript project

Because the types branch is a node module package, you can install it as a dev dependency in your own typescript project.

#### Method 1: Add the types like this in `package.json` under `devDependencies`

```json
"devDependencies": {
	"geoview-core-types": "github:Canadian-Geospatial-Platform/geoview#types",
	...
}
```

and run

    npm install

#### Method 2: Install the package directly from command line

You can install the package directly like how you install any other module, simply run in the command line:

    npm install -D https://github.com/Canadian-Geospatial-Platform/geoview/tree/types

### Importing types in your project

To import types, you simply import it from the `geoview-core-types` module.

In a typescript react project you can import types like this:

    import { TypeWindow, TypeJsonObject, TypeButtonPanel } from "geoview-core-types";

#### Recommendation:

It's recommended to set the type of the window object as `TypeWindow` to be able to map the correct types for the exported API from the viewer.

GeoView is exported to the window object so you should be able to do:

```js
const w = window as TypeWindow;
const cgpv = w['cgpv'];
```

Once the types are mapped to cgpv, you should be able to use types on mapped objects and functions like `useState`.

### Important - Updating the module in your project

Because the types are hosted in a github branch and not [npmjs.com](npmjs.com), there is no version patching available each time a new build is pushed to the branch. Therefore, you need to uninstall and re-install the module regularly.

To do that, in the root of your project, in a command line type:

    npm uninstall geoview-core-types

Then re-install the module by typing:

    npm install -D https://github.com/Canadian-Geospatial-Platform/geoview/tree/types
