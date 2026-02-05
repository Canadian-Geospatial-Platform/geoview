# geoview-about-panel

A package that allows users to display informational content about the map or application in a panel.

# About Panel for GeoView

## What is it about

The **About Panel** package for GeoView provides a flexible way to display informational content about your map application. It supports multiple content formats including Markdown documents, custom content arrays, or simple structured information with title, logo, description, and links. This tool is particularly useful for providing users with application documentation, attribution information, project details, or terms of use.

## How to Configure

### Prerequisites

1. **GeoView**: Ensure you have GeoView installed and properly configured.
2. **Dependencies**: The package uses `markdown-to-jsx` for rendering Markdown content.

### Installation

The installation process is not done using npm in a traditional way. It involves running the JavaScript files that dynamically add the package, installing the About Panel package, which allows you to use it in your project.

### Configuration

The user can add its own configuration by creating a config file that will replace the default one used on the map. To do so, the new config file must have the same file name as the config file used by the map and append the package name to it.

The map config file could be named **myMap.json** and its content is something similar to the following:

```json
{
  "map": {
    "interaction": "dynamic",
    "viewSettings": {
      "projection": 3978
    },
    "basemapOptions": {
      "basemapId": "transport",
      "shaded": false,
      "labeled": true
    }
  },
  "theme": "geo.ca",
  "components": ["north-arrow", "overview-map"],
  "corePackages": [],
  "appBar": {
    "tabs": {
      "core": ["about-panel"] // This is where GeoView knows it needs to load the package
    }
  }
}
```

The file containing the About Panel configuration must use the following pattern: "config file name"-about-panel.json (i.e.: myMapId-about-panel.json where myMapId is the ID of the map).

## How to Configure About Panel Content

### Content Options

The About Panel supports three content formats with the following priority:

1. **Markdown File Path** (highest priority) - Display content from a Markdown document
2. **Markdown Content Array** - Display multiple Markdown strings as separate sections
3. **Default Content** (lowest priority) - Display structured content with title, logo, description, and link

### Option 1: Markdown File Path

To display content from a Markdown document, create a configuration file with the following structure:

```json
{
  "isOpen": true,
  "mdPath": "./docs/about.md",
  "version": "1.0"
}
```

Where the properties are defined as follows:

- **isOpen**: A flag that opens the side panel if the value is true.
- **mdPath**: The relative path to a Markdown document to be embedded. This will override other configuration options.
- **version**: An optional version number of the About Panel schema.

### Option 2: Markdown Content Array

To display multiple Markdown content sections, use:

```json
{
  "isOpen": true,
  "mdContent": [
    "# Welcome to GeoView\n\nThis is the **first** section.",
    "## Features\n\n- Easy to use\n- Customizable\n- Fast performance",
    "## Contact\n\nFor more information, visit [our website](https://example.com)."
  ],
  "version": "1.0"
}
```

Where:

- **mdContent**: An array of Markdown strings. Each string will be rendered as a separate section in the panel.

### Option 3: Default Content Structure

To display structured content with title, logo, description, and link:

```json
{
  "isOpen": false,
  "title": "GeoView Mapping Application",
  "logoPath": "./assets/logo.png",
  "description": "A powerful and flexible geospatial viewer for the Canadian Geospatial Platform. Explore maps, analyze data, and discover geographic insights.",
  "link": "https://canadian-geospatial-platform.github.io/geoview/",
  "version": "1.0"
}
```

Where:

- **title**: The title for the about page.
- **logoPath**: A relative path to an image logo to be placed under the title.
- **description**: A description for the about panel.
- **link**: A link to a website or page to direct users.

**Note**: If any of these properties are not provided, they simply won't be displayed. The panel can display an empty page if no content is configured.

### Configuration Properties

All configuration properties are optional except for at least one content source:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `isOpen` | boolean | No | Specifies whether the about panel is initially open or closed (default: false) |
| `mdPath` | string | No | Path to Markdown document (overrides other configs) |
| `mdContent` | string[] | No | Array of Markdown content strings |
| `title` | string | No | Title for the about page |
| `logoPath` | string | No | Path to logo image |
| `description` | string | No | Description text |
| `link` | string | No | URL to external website or page |
| `version` | string | No | Schema version (default: "1.0") |

### Removing the About Panel

If you want to delete the package from your project, you can use the API as follows:

```javascript
cgpv.api.plugin.removePlugin('about-panel', 'myMap');
```

### Example Configurations

**Example 1: Simple About Page**
```json
{
  "isOpen": true,
  "title": "My Mapping Application",
  "description": "A custom GeoView application for environmental monitoring.",
  "link": "https://example.com/help",
  "version": "1.0"
}
```

**Example 2: Markdown Documentation**
```json
{
  "isOpen": false,
  "mdPath": "./docs/user-guide.md",
  "version": "1.0"
}
```

**Example 3: Multi-Section Content**
```json
{
  "isOpen": true,
  "mdContent": [
    "# About This Map\n\nWelcome to our interactive mapping application.",
    "## Data Sources\n\n- Natural Resources Canada\n- Statistics Canada",
    "## Terms of Use\n\nThis application is provided as-is..."
  ],
  "version": "1.0"
}
```

### Links

For more details, please refer to the [official documentation](https://canadian-geospatial-platform.github.io/geoview/) or reach out to our support team.