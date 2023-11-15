import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    detailsContainer: {
        background: string;
        boxShadow: string;
        padding: string;
    };
    panelHeaders: {
        font: string;
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
            font: string;
        };
        marginLeft: string;
    };
    list: {
        [x: string]: string | {
            paddingRight: string;
            font?: undefined;
            height?: undefined;
            '& .MuiListItemButton-root'?: undefined;
            minWidth?: undefined;
            '>span'?: undefined;
            '> p'?: undefined;
        } | {
            font: string;
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
            font?: undefined;
            minWidth?: undefined;
            '>span'?: undefined;
            '> p'?: undefined;
        } | {
            minWidth: string;
            paddingRight?: undefined;
            font?: undefined;
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
            font?: undefined;
            height?: undefined;
            '& .MuiListItemButton-root'?: undefined;
            minWidth?: undefined;
        };
        color: string;
        width: string;
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
    enlargeBtn: {
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
