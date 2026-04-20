# HOW TO USE THEMING TO STYLE A COMPONENT

In GeoView we have a defined list of colors. These colors are defined in the [IGeoViewColors interface](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/ui/style/types.ts#L121). Every theme in our application defines/overrides these colors.

| Color Name | Type                | Description                                        |
| ---------- | ------------------- | -------------------------------------------------- |
| white      | `string`            | White color constant (`#FFFFFF`)                   |
| bgColor    | `GeoViewColorClass` | Background color, used as background of the footer |
| textColor  | `GeoViewColorClass` | Color for text                                     |
| primary    | `GeoViewColorClass` | Primary color, replaces the MUI primary color      |
| secondary  | `GeoViewColorClass` | Replaces the secondary color in MUI                |
| success    | `GeoViewColorClass` | Replaces the success color in MUI                  |
| error      | `GeoViewColorClass` | Replaces the error color in MUI                    |
| warning    | `GeoViewColorClass` | Replaces the warning color in MUI                  |
| info       | `GeoViewColorClass` | Replaces the info color in MUI                     |
| grey       | `GeoViewColorClass` | Grey color for borders, dividers, etc.             |

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
- For example, to access primary color use `theme.palette.geoViewColor.primary`; for text color use `theme.palette.geoViewColor.textColor`.
- To access the base color use `.main`. e.g. `theme.palette.geoViewColor.bgColor.main`
- To access a darker shade use `.dark[50...950]`. e.g. `theme.palette.geoViewColor.bgColor.dark[500]`. Possible values are `50, 100, 150, 200, 250, ... 900, 950` (increments of 50).
- For lighter shades use `.light[50...950]`

## Customizing An Existing Theme

The system currently has 3 themes `dark`, `light` and `geo.ca`. All themes are in the [style folder](https://github.com/Canadian-Geospatial-Platform/geoview/tree/develop/packages/geoview-core/src/ui/style).

Our themes are basically involve defining the geoView colors. Below is an example of the dark theme file.

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
