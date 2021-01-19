# HOW TO USE THEMING TO STYLE A COMPONENT

You can customize a theme values by going to

```
GeoView/src/assets/style/theme.tsx
```

For example to change the background color of the panel

First go to:

```
GeoView/src/components/appbar/panel.tsx
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

Now go to: `GeoView/src/assets/style/theme.tsx` and modify the primary main color. The background color of the panel should update.

For more information on each section of the theme visit
https://material-ui.com/customization/theming/
