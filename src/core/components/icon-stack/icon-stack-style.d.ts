import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    legendIconTransparent: {
        display: string;
        justifyContent: string;
        alignItems: string;
        width: number;
        height: number;
    };
    iconPreviewHoverable: {
        width: number;
        height: number;
        position: string;
        left: number;
        top: number;
        padding: number;
        borderRadius: number;
        boxShadow: string;
        transition: string;
        '&:hover': {
            transform: string;
        };
    };
    iconPreviewStacked: {
        width: number;
        height: number;
        padding: number;
        borderRadius: number;
        border: string;
        borderColor: string;
        boxShadow: string;
        backgroundColor: string;
    };
    maxIconImg: {
        maxWidth: number;
        maxHeight: number;
    };
    legendIcon: {
        display: string;
        justifyContent: string;
        alignItems: string;
        width: number;
        height: number;
        backgroundColor: string;
        border: string;
        borderColor: string;
    };
    stackIconsBox: {
        width: number;
        height: number;
        position: string;
        '&:focus': {
            outlineColor: string;
        };
    };
    iconPreview: {
        padding: number;
        borderRadius: number;
        boxShadow: string;
        '&:focus': {
            border: string;
        };
    };
};
