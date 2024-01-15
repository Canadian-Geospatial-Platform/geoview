import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    layerOpacityControl: {
        display: string;
        alignItems: string;
        gap: string;
        padding: string;
        backgroundColor: string;
        '& .MuiSlider-mark': {
            width: string;
            height: string;
            opacity: number;
            backgroundColor: string;
            border: string;
            borderRadius: string;
        };
        '& .MuiSlider-markLabel': {
            fontSize: string;
            color: string;
        };
    };
};
