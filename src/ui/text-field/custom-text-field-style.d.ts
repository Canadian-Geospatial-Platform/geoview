import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    textField: {
        width: string;
        margin: string;
        '& .MuiFormLabel-root.Mui-focused': {
            color: string;
            background: string;
        };
        '& .MuiOutlinedInput-root.Mui-focused': {
            border: string;
        };
    };
};
