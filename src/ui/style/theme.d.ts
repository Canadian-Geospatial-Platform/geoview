import { Theme } from '@mui/material/styles';
import { TypeDisplayTheme } from '@/api/types/map-schema-types';
declare module '@mui/material/styles/createPalette' {
    interface Palette {
        border: {
            primary: string;
        };
    }
}
export declare const getTheme: (mode: TypeDisplayTheme) => Theme;
export declare const cgpvTheme: Theme;
//# sourceMappingURL=theme.d.ts.map