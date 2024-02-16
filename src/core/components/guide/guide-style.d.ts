import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    guideContainer: {
        background: string;
        paddingBottom: string;
    };
    rightPanelContainer: {
        border: string;
        borderRadius: string;
        backgroundColor: string;
        color: string;
    };
    footerGuideListItemText: {
        '&:hover': {
            cursor: string;
        };
        '& .MuiListItemText-primary': {
            padding: string;
            fontSize: string;
            lineHeight: number;
            fontWeight: string;
            textTransform: string;
        };
    };
    footerGuideListItemCollapse: {
        '& .MuiListItemText-primary': {
            padding: string;
            fontSize: string;
            lineHeight: number;
            whiteSpace: string;
        };
    };
    errorMessage: {
        marginLeft: string;
        marginTop: string;
        marginBottom: string;
    };
};
