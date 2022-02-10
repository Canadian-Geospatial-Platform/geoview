/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */
import * as createPalette from '@mui/material/styles/createPalette';
import * as transitions from '@mui/material/styles/createTransitions';
import * as Styles from "@mui/material/styles";
//import * as Shape from '@mui/system/createTheme/shape.d.ts';
import * as components from '@mui/material/styles/components';
import { ComponentsVariants } from '@mui/material/styles/variants';
import { ComponentsProps } from '@mui/material/styles/props';
import { ButtonClassKey } from '@mui/material/Button/buttonClasses';
import { ComponentsOverrides } from '@mui/material/styles/overrides';
import * as zIndex from '@mui/material/styles/zIndex';
import * as createTypography from '@mui/material/styles/createTypography';

/** https://material-ui.com/guides/typescript/ */


declare module '@mui/material/styles/createPalette' {
    interface Palette {
        backdrop: string;
    }

    interface PaletteOptions {
        backdrop?: string;
    }
}

declare module '@mui/material/styles/createTransitions' {
    interface Duration {
        splash: number;
    }
}

type Shape = {
    borderRadius: number | string;
    left: string;
    center: string;
    right: string;
}
declare module '@mui/material/styles' {
    interface ThemeOptions {
        shape?: Partial<Shape>;
    }
}

declare module '@mui/material/styles/components' {
    interface Components<Theme = unknown> {
        button?: {
            defaultProps?: ComponentsProps['MuiButton'];
            styleOverrides?: ComponentsOverrides<Theme>['MuiButton'];
            /**
             * @deprecated pass a callback to the slot in `styleOverrides` instead. [See example](https://mui.com/customization/theme-components/#overrides-based-on-props)
             */
            variants?: ComponentsVariants['MuiButton'];
          };
  }
}

declare module '@mui/material/styles/overrides' {
    type sizeClassKey = 'size';

    interface ComponentNameToClassKey {
        button: ButtonClassKey;
        northArrow: sizeClassKey;
        crosshairIcon: sizeClassKey;
    }
}

declare module '@mui/material/styles/zIndex' {
    interface ZIndex {
        leafletControl: number;
        focusDialog: number;
    }
}

declare module '@mui/material/styles/createTypography' {
    interface Typography {
        control: {
            fontSize: number;
            fontWeight: number;
        };
    }

    interface TypographyOptions {
        control?: {
            fontSize?: number;
            fontWeight?: number;
        };
    }
}
