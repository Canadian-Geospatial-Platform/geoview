import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    drawer: {
        width: number;
        flexShrink: number;
        whiteSpace: string;
    };
    drawerOpen: {
        width: number;
        transition: string;
        '& $toolbar': {
            justifyContent: string;
        };
    };
    drawerClose: {
        transition: string;
        overflowX: string;
        width: string;
        '& $toolbar': {
            justifyContent: string;
        };
    };
    toolbar: {
        display: string;
        alignItems: string;
        justifyContent: string;
        padding: string;
    };
};
