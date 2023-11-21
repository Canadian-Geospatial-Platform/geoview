import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    enlargeBtn: {
        [x: string]: string | {
            color: string;
            marginRight?: undefined;
            backgroundColor?: undefined;
            '> div'?: undefined;
            '& svg'?: undefined;
            display?: undefined;
        } | {
            marginRight: string;
            color?: undefined;
            backgroundColor?: undefined;
            '> div'?: undefined;
            '& svg'?: undefined;
            display?: undefined;
        } | {
            backgroundColor: string;
            '> div': {
                color: string;
            };
            '& svg': {
                color: string;
            };
            color?: undefined;
            marginRight?: undefined;
            display?: undefined;
        } | {
            display: string;
            color?: undefined;
            marginRight?: undefined;
            backgroundColor?: undefined;
            '> div'?: undefined;
            '& svg'?: undefined;
        };
        width: string;
        height: string;
        borderRadius: string;
        boxShadow: string;
        marginTop: string;
        background: string;
        '>div': {
            color: string;
        };
        '& svg': {
            marginRight: string;
        };
        ':hover': {
            backgroundColor: string;
            '> div': {
                color: string;
            };
            '& svg': {
                color: string;
            };
        };
    };
    enlargeBtnIcon: {
        color: string;
    };
};
