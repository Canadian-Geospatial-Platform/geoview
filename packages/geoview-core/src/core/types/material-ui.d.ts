import { ComponentsVariants } from "@mui/material/styles/variants";
import { ComponentsProps } from "@mui/material/styles/props";
import { ComponentsOverrides } from "@mui/material/styles/overrides";

/** https://material-ui.com/guides/typescript/ */

type Shape = {
  borderRadius: number | string;
  left: string;
  center: string;
  right: string;
};

declare module "@mui/material/styles" {
  // allow configuration using `createTheme`
  interface ThemeOptions {
    shape?: Shape;
    overrides?: {
      button: Object;
      northArrow: Object;
      crosshairIcon: Object;
    };
  }
}

declare module "@mui/material/styles/createPalette" {
  interface Palette {
    backdrop: string;
  }

  interface PaletteOptions {
    backdrop?: string;
  }
}

declare module "@mui/material/styles/createTransitions" {
  interface Duration {
    splash: number;
  }
}

declare module "@mui/material/styles/components" {
  interface Components<Theme = unknown> {
    button?: {
      defaultProps?: ComponentsProps["MuiButton"];
      styleOverrides?: ComponentsOverrides<Theme>["MuiButton"];
      /**
       * @deprecated pass a callback to the slot in `styleOverrides` instead. [See example](https://mui.com/customization/theme-components/#overrides-based-on-props)
       */
      variants?: ComponentsVariants["MuiButton"];
    };
  }
}

declare module "@mui/material/styles/zIndex" {
  interface ZIndex {
    leafletControl: number;
    focusDialog: number;
  }
}

declare module "@mui/material/styles/createTypography" {
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
