import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    list: {
        padding: number;
    };
    typography: {
        padding: number;
    };
    listItem: {
        height: string;
        padding: number;
        color: string;
        '&:hover': {
            backgroundColor: string;
            color: {
                [x: number]: string;
            };
        };
    };
    listItemIcon: {
        minWidth: string;
    };
    boxcontent: {
        padding: number;
    };
};
