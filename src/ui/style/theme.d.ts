import { Theme } from '@mui/material/styles';
import { TypeDisplayTheme } from '@config/types/map-schema-types';
declare module '@mui/material/styles/createPalette' {
    interface Palette {
        border: {
            primary: string;
        };
    }
}
export declare const getTheme: (mode: TypeDisplayTheme) => Theme;
export declare const cgpvTheme: Theme;
