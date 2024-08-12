import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    readonly guideContainer: {
        readonly '& .responsive-layout-right-main-content': {
            readonly backgroundColor: string;
            readonly '&:focus-visible': {
                readonly border: "2px solid inherit";
            };
        };
    };
    readonly rightPanelContainer: {
        readonly color: string;
    };
    readonly footerGuideListItemText: {
        readonly '&:hover': {
            readonly cursor: "pointer";
        };
        readonly '& .MuiListItemText-primary': {
            readonly padding: "15px";
            readonly fontSize: `${any} !important`;
            readonly lineHeight: 1.5;
            readonly fontWeight: "700";
            readonly textTransform: "capitalize";
        };
    };
    readonly footerGuideListItemCollapse: {
        readonly '& .MuiListItemText-primary': {
            readonly padding: "15px 15px 15px 30px";
            readonly fontSize: `${any} !important`;
            readonly lineHeight: 1.5;
            readonly whiteSpace: "unset";
        };
    };
    readonly errorMessage: {
        readonly marginLeft: "60px";
        readonly marginTop: "30px";
        readonly marginBottom: "12px";
    };
};
