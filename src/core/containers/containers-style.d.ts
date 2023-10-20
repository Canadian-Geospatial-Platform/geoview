import { Theme } from '@mui/material/styles';
export declare const getFocusTrapSxClasses: (theme: Theme) => {
    trap: {
        display: string;
        justifyContent: string;
        alignItems: string;
        position: string;
        top: string;
        left: string;
        width: string;
        height: string;
        zIndex: number;
        overflow: string;
    };
};
export declare const getShellSxClasses: (theme: Theme) => {
    all: {
        height: string;
        width: string;
    };
    shell: {
        display: string;
        flexDirection: string;
        top: string;
        right: string;
        left: string;
        bottom: string;
        overflow: string;
        zIndex: number;
        height: string;
    };
    mapShellContainer: {
        display: string;
        flexDirection: string;
        height: string;
        width: string;
        position: string;
        alignItems: string;
    };
    mapContainer: {
        display: string;
        flexDirection: string;
        height: string;
        width: string;
        position: string;
        alignItems: string;
    };
    skip: {
        position: string;
        left: number;
        height: string;
        width: string;
        textAlign: string;
        overflow: string;
        backgroundColor: string;
        zIndex: number;
        '&:active, &:focus': {
            left: string;
            zIndex: number;
            width: string;
            height: string;
            overflow: string;
        };
    };
};
