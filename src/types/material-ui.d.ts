/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-restricted-imports */
import * as zIndex from '@material-ui/core/styles/zIndex';
import * as createTypography from '@material-ui/core/styles/createTypography';

declare module '@material-ui/core/styles/zIndex' {
    interface ZIndex {
        leafletControl: number;
        focusDialog: number;
    }
}

declare module '@material-ui/core/styles/createTypography' {
    interface Typography {
        control: FontStyle;
    }

    interface FontStyle {
        fontWeight: number;
    }
}
