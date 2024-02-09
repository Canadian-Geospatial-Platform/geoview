import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    detailsContainer: {
        background: string;
        paddingBottom: string;
    };
    panelHeaders: {
        fontSize: any;
        fontWeight: string;
        marginBottom: string;
    };
    layerListPaper: {
        marginBottom: string;
        cursor: string;
        textOverflow: string;
    };
    listItemIcon: {
        color: string;
        background: string;
    };
    layerNamePrimary: {
        '& .MuiListItemText-primary': {
            fontSize: any;
            fontWeight: string;
        };
        marginLeft: string;
    };
    list: {
        [x: string]: string | {
            paddingRight: string;
            fontSize?: undefined;
            fontWeight?: undefined;
            height?: undefined;
            '& .MuiListItemButton-root'?: undefined;
            minWidth?: undefined;
            '>span'?: undefined;
            '> p'?: undefined;
        } | {
            fontSize: any;
            fontWeight: string;
            paddingRight?: undefined;
            height?: undefined;
            '& .MuiListItemButton-root'?: undefined;
            minWidth?: undefined;
            '>span'?: undefined;
            '> p'?: undefined;
        } | {
            height: string;
            '& .MuiListItemButton-root': {
                padding: string;
                height: string;
            };
            paddingRight?: undefined;
            fontSize?: undefined;
            fontWeight?: undefined;
            minWidth?: undefined;
            '>span'?: undefined;
            '> p'?: undefined;
        } | {
            minWidth: string;
            paddingRight?: undefined;
            fontSize?: undefined;
            fontWeight?: undefined;
            height?: undefined;
            '& .MuiListItemButton-root'?: undefined;
            '>span'?: undefined;
            '> p'?: undefined;
        } | {
            '>span': {
                fontSize: string;
            };
            '> p': {
                fontSize: string;
                overflow: string;
                textOverflow: string;
                whiteSpace: string;
            };
            paddingRight?: undefined;
            fontSize?: undefined;
            fontWeight?: undefined;
            height?: undefined;
            '& .MuiListItemButton-root'?: undefined;
            minWidth?: undefined;
        };
        color: string;
        width: string;
        '& .MuiListItemText-primary': {
            fontSize: any;
            fontWeight: string;
        };
        '& .MuiListItem-root': {
            height: string;
            '& .MuiListItemButton-root': {
                padding: string;
                height: string;
            };
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
    rightPanelContainer: {
        border: string;
        borderRadius: string;
        backgroundColor: string;
    };
    rightPanelBtnHolder: {
        marginTop: string;
        marginBottom: string;
        boxShadow: string;
    };
    gridContainer: {
        paddingLeft: string;
        paddingRight: string;
    };
    listPrimaryText: {
        marginLeft: string;
        minWidth: string;
        padding: string;
        flex: string;
        display: string;
        flexDirection: string;
        '& p': {
            fontSize: string;
            font: string;
            fontWeight: number;
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
            };
            ' svg': {
                width: string;
                height: string;
            };
        };
    };
};
