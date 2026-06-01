# Core Packages

> **📘 For Complete Geoview Core Package Guide:** See [Core Packages Reference](./geoview-core-packages.md) for comprehensive API reference and modern package development patterns.
>
> This document focuses on the **Rush.js monorepo setup** for core package development.

## Creating a Core package

Geoview is implemented in a monorepo using rush. In a project using Rush (a monorepo manager), adding a new package requires updating the rush.json file to inform Rush of the existence and location of this new package. Here is an explanation of why you add these specific lines:

## Modifying rush.json

1. Package Declaration:

```
{
  "packageName": "geoview-aoi-panel",
  "projectFolder": "packages/geoview-aoi-panel"
}
```

This section must be added to declare a new package in your monorepo. Rush uses this information to manage this package within the context of your monorepo.

2. packageName:

- Definition: This is the name of the package you are adding. This name must match the one defined in the package's package.json file.
- Role: It allows Rush to identify and reference the package correctly during various operations, such as dependency installation, building, and publishing.

3. projectFolder:

- Definition: This is the path relative to the root directory of the monorepo where the package is located.
- Role: It tells Rush where to find the package in the monorepo structure. This enables Rush to locate the package for operations like dependency installation, building, and updates.

### Process of Adding a New Package

1. Create the Package Directory:

Create a new directory for your package under packages/, for example packages/geoview-aoi-panel.

2. Create a package.json:

In the new package directory, create a package.json file with the necessary information about the package (name, version, dependencies, etc.).

3. Update rush.json:

Add the new package in the projects section of rush.json as you did:

```
{
  "packageName": "geoview-aoi-panel",
  "projectFolder": "packages/geoview-aoi-panel"
}
```

### rush.json modification summary

In summary, by adding these lines in rush.json, you inform Rush of the existence of your new package and its location, allowing Rush to efficiently manage this package within the context of your monorepo.

## Modifying webpack.common.js

When working with a monorepo using Webpack, adding a new package requires updating the Webpack configuration to ensure the new package is properly bundled and its dependencies are managed. Here's an explanation of why you had to add that specific line to webpack.common.js:

### Add Information in webpack.common.js

1. Package Configuration:

```
'geoview-aoi-panel': {
  import: '../geoview-aoi-panel/src/index.tsx',
  dependOn: 'cgpv-main',
  filename: 'corePackages/[name].js',
},
```

This configuration tells Webpack how to handle the new package geoview-aoi-panel during the bundling process.

2. import:

- Definition: This specifies the entry point file for the package.
- Role: It tells Webpack where to start bundling the package. In this case, ../geoview-aoi-panel/src/index.tsx is the entry point for the geoview-aoi-panel package.

3. dependOn:

- Definition: This specifies that the package depends on another package, in this case, cgpv-main.
- Role: It helps Webpack understand the dependency graph, ensuring that cgpv-main is loaded before geoview-aoi-panel. This can help in optimizing the build by sharing dependencies between bundles.

4. filename:

- Definition: This specifies the output filename pattern for the bundled file.
- Role: It tells Webpack where to place the output file and what naming convention to use. Here, corePackages/[name].js means the bundled file will be placed in the corePackages directory, and the [name] placeholder will be replaced by the package name (geoview-aoi-panel).

### Process of Adding a New Package in Webpack

1. Create the Entry Point:

- Ensure you have an entry point file (e.g., index.tsx) in the new package directory (e.g., packages/geoview-aoi-panel/src/).

2. Update webpack.common.js:

- Add a new entry for the package in the Webpack configuration to define how Webpack should handle the package. This includes specifying the entry point, dependencies, and output filename pattern:

```
'geoview-aoi-panel': {
  import: '../geoview-aoi-panel/src/index.tsx',
  dependOn: 'cgpv-main',
  filename: 'corePackages/[name].js',
},
```

3. Run Webpack:

- After updating the Webpack configuration, run your build command using rush to bundle the new package along with the others in your monorepo.

### Webpack modification Summary

In summary, those modification to webpack.common.js, are instructing Webpack on how to handle the new geoview-aoi-panel package during the build process. This ensures that the package is properly bundled, its dependencies are managed, and the output file is correctly named and placed.

## Coding the core package

### Create a Folder for your package

When creating a new package in the monorepo it will involve creating necessary folders and files. You will also have to configure them appropriately.

1. Create the package Directory

   First of all you should create a folder acting as the **Package Directory** in the packages directory. The folder name should look like **geoview-_nameOfPackage_-panel** lets say we want to create a package named area of interest (aoi), the folder should look like: **geoview-aoi-panel**.

2. Add Top-Level Files

   Within your new package directory, create the following files:
   - README.md

     Provides documentation for the package. Include an overview, installation instructions, usage examples, etc.

   - default-config-_nameOfPackage_-panel.json

     Contains default configuration settings for the package. In our case the file name is default-config-aoi-panel.json

   - package.json

     Defines the package and its dependencies. Customize the content as needed.

   - schema.json

     Defines the schema for the configuration. This is use for validation and auto-completion in editors.

3. Create the src Directory

   Create a **src** directory within your package directory to hold the source files.

4. Add the Source Files

   Within the **src** directory create the following files:
   - _nameOfPackage_-panels.tsx

     Defines the react components or functionalities of the panel.

   - _nameOfPackage_-style.ts

     Contains styling for the package panel components.

   - index.tsx

     The entry point for the plugin. This file imports and exports the main components and styles. It also contains translation information.

   - tsconfig.json

     TypeScript configuration for the package.

In conclusion, by following these steps, you can create and configure a new package within your monorepo. This ensures that the package is properly integrated and can be built, tested, and used consistently with the rest of your project.

### Adding translation information to index.tsx

To add translation information, override the `defaultTranslations()` method in your plugin class inside `index.tsx`:

```typescript
  /**
   * Overrides the default translations for the Plugin.
   *
   * @returns The translations object for the Plugin
   */
  override defaultTranslations(): Record<string, unknown> {
    return {
      en: {
        AoiPanel: {
          title: 'Area of Interest',
        },
      },
      fr: {
        AoiPanel: {
          title: "Région d'intérêt",
        },
      },
    };
  }
```

### Adding your plugin ID to the concerned files

1. schema.json
   Let's say we want to add a new package having the aoi-panel ID. To be detected as being valid, you must add your package ID to the schema (`packages/geoview-core/schema.json`). Find the `TypeValidAppBarCoreProps` definition and add your package ID to the enum array.

```json
    "TypeValidAppBarCoreProps": {
      "description": "Valid values for the app bar tabs core array.",
      "additionalProperties": false,
      "enum": [
        "about-panel",
        "geolocator",
        "export",
        "geochart",
        "details",
        "legend",
        "guide",
        "data-table",
        "layers",
        "share",
        "aoi-panel",
        "custom-legend"
      ]
    },
```

2. map-schema-types.ts
   The file `packages/geoview-core/src/api/types/map-schema-types.ts` contains the TypeScript definitions that mirror the JSON schema. You must add your package ID to the `TypeValidAppBarCoreProps` type:

```typescript
/** Supported app bar values. */
export type TypeValidAppBarCoreProps =
  | "geolocator"
  | "export"
  | "aoi-panel"
  | "about-panel"
  | "custom-legend"
  | "guide"
  | "legend"
  | "details"
  | "data-table"
  | "layers";
```

> **Note:** Some packages appear in the **app bar** (`TypeValidAppBarCoreProps`) and others in the **footer bar** (`TypeValidFooterBarTabsCoreProps`). Make sure you add your package ID to the correct type.

3. loading-packages-config.json
   Adding the plugin ID to `packages/geoview-core/public/configs/loading-packages-config.json` ensures that your new package is loaded by default. For **app bar** packages, add the ID to the `appBar.tabs.core` array:

```json
{
  "corePackages": [],
  "appBar": {
    "tabs": {
      "core": [
        "geolocator",
        "export",
        "about-panel",
        "aoi-panel",
        "custom-legend",
        "guide",
        "details",
        "data-table",
        "layers"
      ]
    }
  }
}
```

> **Note:** For **map-level** core packages (like `swiper` or `test-suite`), add the ID to the `corePackages` array instead. The valid map core packages are defined in `TypeValidMapCorePackageProps` in `schema.json`.

### Icons definition (Optional)

If you need a new Icon that does not exist in packages/geoview-core/src/ui/icons/index.ts, you can explore [predefined material UI icons](https://mui.com/material-ui/material-icons/) and chose one from those available. You must add a line in packages/geoview-core/src/ui/icons/index.ts as follow:

```
CropOriginal as AoiIcon,
```

### Run Rush Commands:

- After updating rush.json, run rush update to update the monorepo's dependencies and integrate the new package.
- Use rush build to build the package along with the other packages in the monorepo.
- To test the code will working on it you can always use the **rush serve** command.

## Custom Package Configuration

Each core package is associated with a default schema and configuration file. Users can customize a package by providing a custom configuration file.

To associate a custom configuration with a package:

1. Provide a JSON configuration file using `data-config-url`:

```html
<div
  id="mapLCC"
  class="geoview-map"
  data-lang="en"
  data-config-url="./configs/my-map-config.json"
></div>
```

2. In the configuration file, specify the desired core packages:

```json
{
  "corePackages": ["swiper"],
  "footerBar": {
    "tabs": {
      "core": ["time-slider"]
    }
  }
}
```

3. Create a configuration file for the package named `<config-file-name>-<package-name>.json` (e.g., `my-map-config-time-slider.json`)
4. Place both configuration files in the same folder

For example, the time-slider package has a [schema](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-time-slider/schema.json) and [default configuration](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-time-slider/default-config-time-slider-panel.json) that can be overridden.

## See Also

- **[Core Packages Reference](./geoview-core-packages.md)** - Complete package development guide with API reference
- **[Controllers API](app/events/controllers.md)** - Controllers for performing actions
- **[Package Examples](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages)** - Real package implementations

## Available core packages

**App bar packages:** `aoi-panel`, `about-panel`, `custom-legend`

**Footer bar packages:** `geochart`, `time-slider`

**Nav bar packages:** `drawer`

**Map core packages (via `corePackages`):** `swiper`, `test-suite`
