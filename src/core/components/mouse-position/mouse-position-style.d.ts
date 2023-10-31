import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    mousePosition: {
        display: string;
        padding: string;
        textOverflow: string;
        whiteSpace: string;
        overflow: string;
        alignItems: string;
        border: string;
        width: string;
        backgroundColor: string;
        height: string;
        color: string;
        lineHeight: number;
        ':hover': {
            backgroundColor: string;
            color: string;
        };
    };
    mousePositionTextContainer: {
        display: string;
        flexDirection: string;
    };
    mousePositionTextCheckmarkContainer: {
        display: string;
        flexDirection: string;
        justifyContent: string;
        alignItems: string;
        '& span': {
            fontSize: number;
            color: string;
            textOverflow: string;
            whiteSpace: string;
            overflow: string;
        };
    };
    mousePositionCheckmark: {
        paddingRight: number;
        color: string;
    };
    mousePositionText: {
        fontSize: number;
        color: string;
        textOverflow: string;
        whiteSpace: string;
        overflow: string;
    };
};
