import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    dialog: {
        position: string;
        "& ~ & > div[class*='backdrop']": {
            backgroundColor: string;
        };
        '& .MuiPaper-root': {
            width: number;
        };
    };
    backdrop: {
        position: string;
        background: string;
    };
    content: {
        padding: string;
        whiteSpace: string;
    };
    modalTitleContainer: {
        display: string;
        justifyContent: string;
        alignItems: string;
        padding: string;
    };
    modalTitleLabel: {
        display: string;
        justifyContent: string;
    };
    modalTitleActions: {
        display: string;
        justifyContent: string;
    };
    headerActionsContainer: {
        display: string;
        padding: string;
        '& > *:not(:last-child)': {
            marginRight: string;
        };
    };
    closedModal: {
        display: string;
    };
    createdAction: {
        width: string;
        alignSelf: string;
        '& > * ': {
            textAlign: string;
        };
    };
};
