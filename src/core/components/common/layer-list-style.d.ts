import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    list: {
        height: string;
        overflowY: string;
        color: string;
        width: string;
        paddingRight: string;
        '& .MuiListItemText-primary': {
            font: string;
        };
        '& .MuiListItem-root': {
            height: string;
            '& .MuiListItemButton-root': {
                padding: string;
                height: string;
            };
        };
        '& .MuiListItemButton-root': {
            minHeight: string;
        };
        '& .MuiListItemIcon-root': {
            minWidth: string;
        };
        '& .MuiListItemText-root': {
            '>span': {
                fontSize: string;
            };
            '> p': {
                fontSize: string;
                overflow: string;
                textOverflow: string;
                whiteSpace: string;
            };
        };
    };
    listPrimaryText: {
        minWidth: string;
        marginTop: string;
        marginBottom: string;
        marginLeft: string;
        flex: string;
        display: string;
        flexDirection: string;
        '& .layerTitle': {
            fontSize: string;
            font: string;
            lineHeight: number;
            overflow: string;
            textOverflow: string;
            whiteSpace: string;
        };
        '>div': {
            display: string;
            alignItems: string;
            marginTop: string;
            '>p': {
                fontSize: string;
                color: string;
                fontWeight: number;
            };
            ' svg': {
                width: string;
                height: string;
            };
        };
    };
    paper: {
        marginBottom: string;
    };
    borderWithIndex: string;
    borderNone: string;
    headline: {
        fontSize: string;
        fontWeight: string;
    };
};
