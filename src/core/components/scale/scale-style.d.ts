import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    scaleControl: {
        display: string;
    };
    scaleContainer: {
        display: string;
        backgroundColor: string;
        border: string;
        height: string;
        ':hover': {
            backgroundColor: string;
            color: string;
        };
    };
    scaleExpandedContainer: {
        display: string;
        flexDirection: string;
        justifyContent: string;
        height: string;
        gap: string;
    };
    scaleExpandedCheckmarkText: {
        display: string;
        flexDirection: string;
        alignItems: string;
        justifyContent: string;
        height: string;
        maxHeight: string;
    };
    scaleText: {
        fontSize: number;
        color: string;
        textOverflow: string;
        whiteSpace: string;
        overflow: string;
        border: string;
        borderColor: string;
        borderTop: string;
        borderLeft: string;
        borderRight: string;
    };
    scaleCheckmark: {
        paddingRight: number;
        color: string;
    };
};
