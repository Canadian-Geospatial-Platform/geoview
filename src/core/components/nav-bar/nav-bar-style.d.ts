import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    navBarRef: {
        position: string;
        right: string;
        display: string;
        flexDirection: string;
        marginRight: number;
        zIndex: number;
        pointerEvents: string;
        justifyContent: string;
        backgroundColor: string;
        transition: string;
    };
    navBtnGroupContainer: {
        display: string;
        position: string;
        flexDirection: string;
        pointerEvents: string;
        justifyContent: string;
        overflowY: string;
        padding: number;
    };
    navBtnGroup: {
        borderRadius: string;
        backgroundColor: string;
        '&:not(:last-child)': {
            marginBottom: string;
        };
        '& .MuiButtonGroup-grouped:not(:last-child)': {
            borderColor: string;
        };
    };
    navButton: {
        backgroundColor: string;
        color: string;
        borderRadius: string;
        width: string;
        height: string;
        maxWidth: string;
        minWidth: string;
        padding: string;
        transition: string;
        '&:not(:last-of-type)': {
            borderBottomLeftRadius: number;
            borderBottomRightRadius: number;
            borderBottom: string;
        };
        '&:not(:first-of-type)': {
            borderTopLeftRadius: number;
            borderTopRightRadius: number;
        };
        '&:hover': {
            backgroundColor: string;
            color: string;
        };
        '&:focus': {
            backgroundColor: string;
            color: string;
        };
        '&:active': {
            backgroundColor: string;
            color: string;
        };
    };
};
