import { ComponentsVariants, ComponentsOverrides, ComponentsProps } from '@mui/material';

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
    appBar?: {
      border?: string;
      btnActiveBg?: string;
      btnDefaultBg?: string;
      btnFocusBg?: string;
      btnHoverBg?: string;
    };
    panel?: {
      activeBg?: string;
      border?: string;
      borderLight?: string;
      defaultBg?: string;
      hoverBg?: string;
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
    appBar: {
      border: string;
      btnActiveBg: string;
      btnDefaultBg: string;
      btnFocusBg: string;
      btnHoverBg: string;
    };
    panel: {
      activeBg: string;
      border: string;
      borderLight: string;
      defaultBg: string;
      hoverBg: string;
    };
  }
}

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
