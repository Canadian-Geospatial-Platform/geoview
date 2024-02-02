import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    mapInfoContainer: {
        flexGrow: number;
        zIndex: number;
        display: string;
        flexDirection: string;
        justifyContent: string;
        alignItems: string;
        width: string;
        minHeight: string;
        maxHeight: string;
        backdropFilter: string;
        backgroundColor: string;
        pointerEvents: string;
        gap: number;
        order: number;
    };
    mouseScaleControlsContainer: {
        display: string;
        flexDirection: string;
        '& button': {
            cursor: string;
            margin: string;
        };
        justifyContent: string;
    };
    rotationControlsContainer: {
        display: string;
        flexDirection: string;
        marginLeft: string;
        alignItems: string;
    };
    expandButton: {
        display: string;
        alignItems: string;
        justifyContent: string;
        color: string;
        height: string;
        width: string;
        marginLeft: string;
    };
    rotationButton: {
        rotationButton: {
            height: number;
            width: number;
            marginRight: number;
        };
        rotationIcon: {
            fontSize: string;
            width: string;
            height: string;
            color: string;
        };
    };
};
