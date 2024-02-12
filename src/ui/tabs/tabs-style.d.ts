import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    rightIcons: {
        marginTop: number;
        display: string;
        justifyContent: string;
        alignItems: string;
    };
    panel: {
        borderTop: number;
        paddingTop: string;
        borderColor: string;
        height: string;
    };
    tab: {
        fontSize: any;
        fontWeight: string;
        minWidth: string;
        padding: string;
        textTransform: string;
        '&.Mui-selected': {
            color: string;
        };
        '.MuiTab-iconWrapper': {
            marginRight: string;
            maxWidth: string;
        };
    };
    mobileDropdown: {
        maxWidth: string;
        p: number;
        '& .MuiInputBase-root': {
            borderRadius: string;
        };
        '& .MuiSelect-select': {
            padding: string;
        };
    };
};
