
# HOW TO USE THEMING TO STYLE A COMPONENT


In GeoView we have a defined list of colors. These colors are defined in out [IGeoViewColors object](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/ui/style/types.ts#L70). Every theme in our application defines/overrides these colors.

| Color Name | Description  |
|--|--|
| bgColor | Background color, used as background of the footer  |
|textColor | Color for text |
|primary | Primary color, replaces the material UI primary color|
|secondary | Replaces the secondary color in material UI|
| error|Replaces the error color in material UI |
| info|Replaces the info color in material UI |
| warning|Replaces the warning color in material UI |

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
The class also has a method .`dark(coefficient:Number, opacity:number)` for getting a darker color.

## Accessing GeoViewColors in the application

* GeoView colors are part of the theme palette - accessible via `theme.palette.geoViewColor`.
* For example to access primary color use `theme.palette.geoViewColor.primary`; for text Color use `theme.palette.geoViewColor.textColor..`
* To access the default color use `.default`. e.g. to access the default bgColor use `theme.palette.geoViewColors.bgColor.default`
* To access a darker version of a dark use `.dark[50...950]`. e.g. to get bgColor 50% darker use `theme.palette.geoViewColors.bgColor.dark[500]`. Possible numbers for this are `50, 100, 150, 200, 250....850, 900, 950`. Note the increment by 50.
* For light color use `...light[50..950]`


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
