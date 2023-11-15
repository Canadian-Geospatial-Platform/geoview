import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    formControl: {
        fontSize: number;
        width: string;
        color: string;
        '& .MuiOutlinedInput-notchedOutline': {
            border: string;
            padding: string;
            '&[aria-hidden="true"]': {
                border: string;
            };
        };
        '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
                border: string;
            };
        };
        '& .MuiFormLabel-root.Mui-focused': {
            color: string;
            background: string;
        };
        '& .MuiSelect-select': {
            padding: string;
        };
        '& .MuiSvgIcon-root': {
            color: string;
        };
    };
    label: {
        color: string;
        fontSize: number;
    };
    menuItem: {
        fontSize: number;
    };
};
