# HOW TO USE THEMING TO STYLE A COMPONENT

In GeoView we have a defined list of colors. These colors are defined in the [IGeoViewColors interface](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/ui/style/types.ts#L121). Every theme in our application defines/overrides these colors.

| Color Name | Type                | Description                                         |
| ---------- | ------------------- | --------------------------------------------------- |
| white      | `string`            | White color constant (`#FFFFFF`)                    |
| bgColor    | `GeoViewColorClass` | Source color for backgrounds and surface roles      |
| textColor  | `GeoViewColorClass` | Source color for the semantic MUI text palette      |
| primary    | `GeoViewColorClass` | Source color for the semantic MUI primary palette   |
| secondary  | `GeoViewColorClass` | Source color for the semantic MUI secondary palette |
| success    | `GeoViewColorClass` | Source color for the semantic MUI success palette   |
| error      | `GeoViewColorClass` | Source color for the semantic MUI error palette     |
| warning    | `GeoViewColorClass` | Source color for the semantic MUI warning palette   |
| info       | `GeoViewColorClass` | Source color for the semantic MUI info palette      |
| grey       | `GeoViewColorClass` | GeoView grey ramp for specialized UI and map styles |

## Defining GeoViewColor object

Each theme in the application overrides the default GeoViewColor in the default file.
An example of of a `geoViewColors` object is below;

```
export  const  geoViewColors:  IGeoViewColors  = {
	white:  '#FFFFFF',
	bgColor:  new  GeoViewColorClass('#F1F2F5'),
	primary:  new  GeoViewColorClass('#515BA5'),
	secondary:  new  GeoViewColorClass('#1976d2'),
	textColor:  new  GeoViewColorClass('#393939'),
	success:  new  GeoViewColorClass('#2e7d32'),
	error:  new  GeoViewColorClass('#d32f2f'),
	warning:  new  GeoViewColorClass('#ed6c02'),
	info:  new  GeoViewColorClass('#2e7d32'),
	grey:  new  GeoViewColorClass('#9e9e9e'),
};
```

### What is GeoViewColorClass?

Though each color is defined as a hex sometimes in the application we need to use a shade of that color - it can be a light/darker shade. `GeoViewColorClass` takes in a hex value and gives us access to different shades of the provided colors. It also gives us methods of manipulating the given color.

For example; this is how to use the background color - but 20% darker.
`theme.palette.geoViewColor.bgColor.dark[200]`

To get it 70% light..
`theme.palette.geoViewColor.bgColor.light[700]`

What if you want it 55% light with an opacity of 0.3? You can use the method `lighten`
`theme.palette.geoViewColor.bgColor.lighten(0.55, 0.3)`
The class also has a method `.darken(coefficient, opacity)` for getting a darker color.

## Accessing GeoViewColors in the application

- GeoView colors are part of the theme palette — accessible via `theme.palette.geoViewColor`.
- The `geoViewColor` palette provides GeoView-specific colors and ramps. Use semantic MUI palette
  roles for ordinary application UI, such as `theme.palette.primary.main`,
  `theme.palette.text.primary`, and `theme.palette.background.paper`.
- To access the base color use `.main`. e.g. `theme.palette.geoViewColor.bgColor.main`
- To access a darker shade use `.dark[50...950]`. e.g. `theme.palette.geoViewColor.bgColor.dark[500]`. Possible values are `50, 100, 150, 200, 250, ... 900, 950` (increments of 50).
- For lighter shades use `.light[50...950]`

MUI semantic palette roles are generated from the selected GeoView colors and adapt to the theme's
light or dark mode. Use `primary.contrastText` for content on a primary-colored surface. GeoView
also defines `surface.low` and `surface.high` for depth levels, `inverseContent` for deliberately
contrast-reversed surfaces, and `layerVisibility` for legend visibility markers. These specialized
roles are optional in reusable components that may receive an external MUI theme; provide a
fallback or use optional chaining when accessing them.

## Customizing An Existing Theme

The system currently has 4 themes: `dark`, `light`, `geo.ca`, and `canada.ca`. The selected theme
determines both its GeoView colors and MUI palette mode: `dark` uses dark mode; `light`, `geo.ca`,
and `canada.ca` use light mode. Theme definitions are in the
[style folder](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/ui/style).

The `canada.ca` theme uses Government of Canada-inspired colours with `#26374a` as the main colour
and a Helvetica font stack. The default theme remains `geo.ca`.

Themes define GeoView colors, which are used to generate the semantic MUI palette. Below is an
example of the dark theme colors.

```
export  const  darkThemeColors:  IGeoViewColors  = {
	...defaultGeoViewColors,
	bgColor:  new  GeoViewColorClass('#3C3E42', true),
	primary:  new  GeoViewColorClass('#8ec4fa'),
	textColor:  new  GeoViewColorClass('#ffffff'),
};
```

Notice that dark theme inherits some properties from the default and overrides with darker colors.
To modify these theme we can basically add more overrides to colors until to archive the desired color combination.
