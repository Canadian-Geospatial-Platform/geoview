/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */
import * as createPalette from '@material-ui/core/styles/createPalette';
import * as transitions from '@material-ui/core/styles/transitions';
import * as shape from '@material-ui/core/styles/shape';
import * as overrides from '@material-ui/core/styles/overrides';
import * as zIndex from '@material-ui/core/styles/zIndex';
import * as createTypography from '@material-ui/core/styles/createTypography';

/** https://material-ui.com/guides/typescript/ */

declare module '@material-ui/core/styles/createPalette' {
    interface Palette {
        backdrop: string;
    }

    interface PaletteOptions {
        backdrop?: string;
    }
}

declare module '@material-ui/core/styles/transitions' {
    interface Duration {
        splash: number;
    }
}

declare module '@material-ui/core/styles/shape' {
    interface Shape {
        left: string;
        center: string;
        right: string;
    }
}

declare module '@material-ui/core/styles/overrides' {
    type sizeClassKey = 'size';

    interface ComponentNameToClassKey {
        button: sizeClassKey;
        northArrow: sizeClassKey;
        crosshairIcon: sizeClassKey;
    }
}

declare module '@material-ui/core/styles/zIndex' {
    interface ZIndex {
        leafletControl: number;
        focusDialog: number;
    }
}

declare module '@material-ui/core/styles/createTypography' {
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
