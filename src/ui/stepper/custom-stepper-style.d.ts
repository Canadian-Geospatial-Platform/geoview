import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    stepperContainer: {
        padding: number;
        width: number;
        minWidth: number;
        border: string;
        flexWrap: string;
        '& .MuiSvgIcon-root.Mui-active': {
            color: string;
        };
        '& .MuiSvgIcon-root.Mui-completed': {
            color: string;
        };
    };
    actionContainer: {
        marginTop: number;
        width: string;
        display: string;
        flexWrap: string;
        flexDirection: string;
        justifyContent: string;
        '&>*:first-child': {
            width: string;
            marginBottom: number;
        };
        '& > button': {
            width: string;
        };
        '& > button > *': {
            textAlign: string;
        };
    };
    disabledButton: {
        color: string;
    };
};
