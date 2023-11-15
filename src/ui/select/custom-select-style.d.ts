import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    formControl: {
        width: string;
        '& .MuiFormLabel-root.Mui-focused': {
            color: string;
            background: string;
        };
        '& .MuiOutlinedInput-root.Mui-focused': {
            border: string;
        };
    };
    label: {
        position: string;
        left: number;
        top: number;
        transform: string;
        background: string;
    };
    select: {
        width: string;
    };
};
