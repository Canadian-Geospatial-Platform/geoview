import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    slider: {
        '& .MuiSlider-root': {
            color: string;
        };
        '& .MuiSlider-thumb': {
            width: number;
            height: number;
            color: string;
            transition: string;
            '&:before': {
                boxShadow: string;
            };
            '&:hover, &.Mui-focusVisible': {
                boxShadow: string;
            };
            '&.Mui-active': {
                width: number;
                height: number;
            };
        };
        '& .MuiSlider-rail': {
            opacity: number;
            color: string;
        };
        '& .MuiSlider-track': {
            color: string;
        };
        '& .MuiSlider-mark': {
            height: number;
            width: number;
            color: string;
        };
        '& .MuiSlider-markLabel-overlap': {
            display: string;
        };
    };
};
