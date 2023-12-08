import { TypeSupportedTheme } from '@/geo/map/map-schema-types';
declare module '@mui/material/styles/createPalette' {
    interface Palette {
        border: {
            primary: string;
        };
    }
}
export declare const getTheme: (mode: TypeSupportedTheme) => import("@mui/material/styles").Theme;
export declare const cgpvTheme: import("@mui/material/styles").Theme;
