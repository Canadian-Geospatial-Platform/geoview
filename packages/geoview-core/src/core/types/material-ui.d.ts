import type { ComponentsVariants, ComponentsOverrides, ComponentsProps } from '@mui/material';
import type { CSSProperties } from 'react';
import type { IGeoViewColors, IGeoViewFontSizes, IGeoViewSpacingAndSizing } from '@/ui/style/types';

/** MUI theme augmentation. See https://material-ui.com/guides/typescript/ */

/**
 * Named border-radius tokens added to the MUI theme `shape` (values from `GEOVIEW_SHAPE`).
 *
 * This type MUST be exported so that TypeScript emits this file to the
 * declaration output (`lib/`). Without at least one export, `.d.ts` files
 * containing only ambient `declare module` blocks are silently excluded
 * from the build output, which prevents plugin packages from seeing the
 * MUI augmentations (e.g. `geoViewColor` on `Palette`) during `rush build`.
 *
 * The re-export in `external-types.ts` (`export * from './material-ui.d'`)
 * then pulls this file into the module graph for all consumers.
 */
export type GeoViewShapeTokens = {
  /** No rounding (flush/attached edges). */
  borderRadiusNone: string;
  /** Small controls, inputs, badges, icons (4px). */
  borderRadiusSm: string;
  /** Default surfaces: panels, papers, cards, list items (6px, equals the MUI base). */
  borderRadiusMd: string;
  /** Prominent cards and grouped sections (8px). */
  borderRadiusLg: string;
  /** Pills and circles. */
  borderRadiusFull: string;
};

// #region MUI
declare module '@mui/material/styles' {
  interface Shape extends GeoViewShapeTokens {}
  interface ShapeOptions extends Partial<GeoViewShapeTokens> {}

  // allow configuration using `createTheme`
  interface ThemeOptions {
    // GV No theme when this UI component is used by external component (e.g. GeoChart). All geoViewColor and geoViewFontSize properties need to have the "?" to support when no theme are set (no map).
    geoViewColor?: IGeoViewColors;
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
    inverseContent?: { surface: string; text: string };
    layerVisibility?: { checked: string; unchecked: string };
    surface?: { low: string; high: string };
    // GV No theme when this UI component is used by external component (e.g. GeoChart). All geoViewColor and geoViewFontSize properties need to have the "?" to support when no theme are set (no map).
    geoViewColor?: IGeoViewColors;
    /** @deprecated Read sizes from the owning map's theme.typography instead. */
    geoViewFontSize?: IGeoViewFontSizes;
    geoViewSpacingAndSizing?: IGeoViewSpacingAndSizing;
  }

  interface PaletteOptions {
    inverseContent?: { surface?: string; text?: string };
    layerVisibility?: { checked?: string; unchecked?: string };
    surface?: { low?: string; high?: string };
    // GV No theme when this UI component is used by external component (e.g. GeoChart). All geoViewColor and geoViewFontSize properties need to have the "?" to support when no theme are set (no map).
    geoViewColor?: IGeoViewColors;
    /** @deprecated Configure sizes through scale-key typography overrides instead. */
    geoViewFontSize?: IGeoViewFontSizes;
    geoViewSpacingAndSizing?: IGeoViewSpacingAndSizing;
  }
}

declare module '@mui/material/styles/createTransitions' {
  interface Duration {
    tooltipDelay?: number;
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
  interface TypographyVariants {
    label: CSSProperties;
    /** @deprecated Retained at 11px until the next breaking release. Use a standard variant or label. */
    control: {
      fontSize: number;
      fontWeight: number;
    };
  }

  interface TypographyVariantsOptions {
    label?: CSSProperties;
    /** @deprecated Retained for compatibility until the next breaking release. */
    control?: {
      fontSize?: number;
      fontWeight?: number;
    };
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    label: true;
    /** @deprecated Retained until the next breaking release. Use a standard variant or label. */
    control: true;
  }
}

// #endregion MUI
