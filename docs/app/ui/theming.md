# HOW TO USE THEMING TO STYLE A COMPONENT

You can customize a theme values by going to [theme.tsx](../../../packages/geoview-core/src/ui/style/theme.tsx)

```
geoview/packages/geoview-core/src/ui/style/theme.tsx
```

For example to change the background color of the [panel.tsx](../../../packages/geoview-core/src/ui/panel/panel.tsx)

First go to:

```
geoview/packages/geoview-core/src/ui/panel.tsx
```

makeStyles have a parameter called theme. You can access theme classes from this parameter. To set the background color to the primary main color add this line to the root class

```
backgroundColor: theme.palette.primary.main
```

See below:

```
const useStyles = makeStyles((theme) =>
    createStyles({
        root: {
            width: 300,
            height: '100%',
            margin: theme.spacing(0, 1),
            borderRadius: 0,
            backgroundColor: theme.palette.primary.main,
        },
        avatar: {
            color: '#666666',
            padding: '4px 10px',
        },
    })
);
```

Now go to: `geoview/packages/geoview-core/src/ui/style/theme.tsx` and modify the primary main color. The background color of the panel should update.

For more information on each section of the theme visit
https://material-ui.com/customization/theming/

## Migrate existing components style to new material ui ways.

Existing components of GeoView has been developed using Material UI **v4** `makeStyles()` module. GeoView has been migrated to **v5** and it provides support for creating new components using `styled-components`, which provide abstraction of css from react component. It also supports `sx` prop which provide quick customization of the component.

**NOTE** Existing utility function `makeStyles()` will be deprecated and not recommended by Material UI team.

`styled()` utility need to be used when reusable component is developed and `sx` prop need be used when consumer of component making any customization to the reusable component.

**styled** is a function, while **sx** is a prop of the MUI components.

Below is example to use **styled** module provided by Material-UI

```html
import * as React from 'react'; import { styled } from '@mui/system'; const
MyComponent = styled('div')({ color: 'darkslategray', backgroundColor:
'aliceblue', padding: 8, borderRadius: 4, }); export default function
BasicUsage() { return <MyComponent>Styled div</MyComponent>; }
```

### Styled utility with theme

```html
const MyThemeComponent = styled('div')(({ theme }) => ({ color:
theme.palette.primary.contrastText, backgroundColor: theme.palette.primary.main,
padding: theme.spacing(1), borderRadius: theme.shape.borderRadius, })); export
default function ThemeUsage() { return (
<ThemeProvider theme="{customTheme}">
  <MyThemeComponent>Styled div with theme</MyThemeComponent>
</ThemeProvider>
); }
```

#### SX prop with theme

```html

const MyThemeComponent = styled('div')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
}));

export default function UsingOptions() {
  return (
    <ThemeProvider theme={customTheme}>
      <MyThemeComponent sx={{ m: 1 }} color="primary" variant="dashed">
        Primary
      </MyThemeComponent>
      <MyThemeComponent sx={{ m: 1 }} color="secondary">
        Secondary
      </MyThemeComponent>
    </ThemeProvider>
  );
}
```

**Shorthand of theme with sx prop**

```html
<Button sx={{ backgroundColor: 'primary.main' }}>
  {props.children}
</Button>
```

**Using Callback function**

```html
import Button from '@mui/material/Button';
import { lighten } from 'polished';

<Button sx={{ backgroundColor: (theme) => lighten(0.2, theme.palette.primary.main) }}>
  {props.children}
</Button>
```

**Help on Styled Components**

1. [Styled Utilities](https://mui.com/system/styled/)
2. [SX prop](https://mui.com/system/getting-started/the-sx-prop/)
3. [Styled Components](https://styled-components.com/)
