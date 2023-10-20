import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    crosshairContainer: {
        position: string;
        top: string;
        right: string;
        left: string;
        bottom: string;
        paddingBottom: string;
        display: string;
        alignItems: string;
        justifyContent: string;
        pointerEvents: string;
        zIndex: number;
    };
    crosshairInfo: {
        position: string;
        top: string;
        right: string;
        left: string;
        height: string;
        padding: string;
        backgroundColor: string;
        '& span': {
            paddingLeft: number;
        };
    };
    crosshairIcon: {
        width: number;
        height: number;
    };
};
