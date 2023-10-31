import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    panelContainer: {
        [x: string]: string | number | {
            width: string;
            minWidth: string;
            backgroundColor?: undefined;
            borderBottomColor?: undefined;
            borderBottomWidth?: undefined;
            borderBottomStyle?: undefined;
            height?: undefined;
            fontSize?: undefined;
            paddingTop?: undefined;
            textTransform?: undefined;
            '& .MuiButtonBase-root'?: undefined;
        } | {
            backgroundColor: string;
            borderBottomColor: string;
            borderBottomWidth: number;
            borderBottomStyle: string;
            height: number;
            width?: undefined;
            minWidth?: undefined;
            fontSize?: undefined;
            paddingTop?: undefined;
            textTransform?: undefined;
            '& .MuiButtonBase-root'?: undefined;
        } | {
            fontSize: number;
            paddingTop: number;
            textTransform: string;
            width?: undefined;
            minWidth?: undefined;
            backgroundColor?: undefined;
            borderBottomColor?: undefined;
            borderBottomWidth?: undefined;
            borderBottomStyle?: undefined;
            height?: undefined;
            '& .MuiButtonBase-root'?: undefined;
        } | {
            '& .MuiButtonBase-root': {
                border: string;
                height: number;
                width: number;
                marginRight: number;
                transition: string;
                '& .MuiSvgIcon-root': {
                    width: number;
                    height: number;
                };
                '&:last-child': {
                    marginRight: number;
                };
                '&:hover': {
                    backgroundColor: string;
                };
            };
            width?: undefined;
            minWidth?: undefined;
            backgroundColor?: undefined;
            borderBottomColor?: undefined;
            borderBottomWidth?: undefined;
            borderBottomStyle?: undefined;
            height?: undefined;
            fontSize?: undefined;
            paddingTop?: undefined;
            textTransform?: undefined;
        };
        backgroundColor: string;
        height: string;
        borderRadius: number;
        flexDirection: string;
        '& .MuiCardHeader-root': {
            backgroundColor: string;
            borderBottomColor: string;
            borderBottomWidth: number;
            borderBottomStyle: string;
            height: number;
        };
        '& .MuiCardHeader-title': {
            fontSize: number;
            paddingTop: number;
            textTransform: string;
        };
        '& .MuiCardHeader-action': {
            '& .MuiButtonBase-root': {
                border: string;
                height: number;
                width: number;
                marginRight: number;
                transition: string;
                '& .MuiSvgIcon-root': {
                    width: number;
                    height: number;
                };
                '&:last-child': {
                    marginRight: number;
                };
                '&:hover': {
                    backgroundColor: string;
                };
            };
        };
    };
    panelContentContainer: {
        position: string;
        flexBasis: string;
        overflow: string;
        overflowY: string;
        boxSizing: string;
        marginBottom: number;
        '&:last-child': {
            paddingBottom: number;
        };
        height: string;
    };
};
