import { ComponentsVariants, ComponentsOverrides, ComponentsProps } from '@mui/material';
import { IGeoViewColors, IGeoViewFontSizes, IGeoViewSpacingAndSizing } from '@/ui/style/types';

/** https://material-ui.com/guides/typescript/ */

type Shape = {
  borderRadius: number | string;
  left: string;
  center: string;
  right: string;
};

declare module '@mui/material/styles' {
  // allow configuration using `createTheme`
  interface ThemeOptions {
    geoViewColor?: IGeoViewColors;
    shape?: Shape;
    overrides?: {
      button: {
        size: { width: string | number; height: string | number };
      };
      northArrow: {
        size: { width: string | number; height: string | number };
      };
      crosshairIcon: {
        size: { width: string | number; height: string | number };
      };
    };
  }
  interface Theme {
    overrides: {
      button: {
        size: { width: string; height: string };
      };
      northArrow: {
        size: { width: number; height: number };
      };
      crosshairIcon: {
        size: { width: number; height: number };
      };
    };
  }
}

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    backdrop: string;
    geoViewColor: IGeoViewColors;
    geoViewFontSize: IGeoViewFontSizes;
    geoViewSpacingAndSizing: IGeoViewSpacingAndSizing;
  }

  interface PaletteOptions {
    backdrop?: string;
    geoViewColor?: IGeoViewColors;
    geoViewFontSize?: IGeoViewFontSizes;
    geoViewSpacingAndSizing?: IGeoViewSpacingAndSizing;
  }
}

declare module '@mui/material/styles/createTransitions' {
  interface Duration {
    splash: number;
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

declare module '@mui/material/styles/zIndex' {
  interface ZIndex {
    olControl: number;
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
