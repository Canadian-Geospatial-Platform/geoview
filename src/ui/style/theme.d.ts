import type { Theme } from '@mui/material/styles';
import type { TypeDisplayTheme } from '@/api/types/map-schema-types';
declare module '@mui/material/styles/createPalette' {
    interface Palette {
        border: {
            primary: string;
        };
    }
}
/**
 * Creates a Material-UI theme for the given display mode.
 *
 * @param mode - Display theme mode ('light', 'dark', or 'geo.ca')
 * @returns Fully configured MUI Theme object
 */
export declare const getTheme: (mode: TypeDisplayTheme) => Theme;
/** Default GeoView theme using the geo.ca color scheme */
export declare const cgpvTheme: Theme;
//# sourceMappingURL=theme.d.ts.map