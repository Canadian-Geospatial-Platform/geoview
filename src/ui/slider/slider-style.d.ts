import type { Theme } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';
/**
 * Gets custom sx classes for the slider component.
 *
 * Uses optional chaining (?.) for theme.palette.geoViewColor properties
 * because plugins may render before GeoView's custom theme is fully initialized.
 * Standard MUI properties (theme.palette.common) do not require this.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxStyles;
//# sourceMappingURL=slider-style.d.ts.map