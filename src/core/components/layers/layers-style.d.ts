import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    list: {
        color: string;
        width: string;
        '& .layerItemContainer': {
            background: string;
            borderRadius: string;
            marginBottom: string;
        };
        '& .MuiListItemText-primary': {
            font: string;
        };
        '& .MuiListItem-root': {
            height: string;
            '& .MuiListItemButton-root': {
                padding: string;
                height: string;
            };
            '& .MuiBox-root': {
                height: string;
                borderTopRightRadius: string;
                borderBottomRightRadius: string;
                position: string;
                display: string;
                justifyContent: string;
                alignItems: string;
            };
        };
        '& .MuiListItemIcon-root': {
            minWidth: string;
            marginRight: string;
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
    legendContainer: {
        background: string;
        boxShadow: string;
        padding: string;
        display: string;
        flexDirection: string;
    };
    legendTitle: {
        textAlign: string;
        fontFamily: string;
        fontSize: string;
    };
    categoryTitleContainer: {
        display: string;
        alignItems: string;
        justifyContent: string;
        marginBottom: string;
    };
    categoryTitle: {
        textAlign: string;
        font: string;
        fontSize: string;
    };
    legendButton: {
        font: string;
        color: string;
        backgroundColor: string;
        fontWeight: string;
        fontSize: string;
    };
    legendButtonText: {
        font: string;
        textTransform: string;
        fontWeight: string;
        color: string;
        fontSize: string;
    };
    legendItemContainer: {
        border: string;
        width: string;
    };
    layersList: {
        layerItem: {
            background: string;
            borderRadius: string;
            marginBottom: string;
        };
        selectedLayerItem: {
            border: string;
        };
    };
    rightPanel: {
        layerDetails: {
            border: string;
            padding: string;
        };
        opacityMenu: {
            display: string;
            alignItems: string;
            gap: string;
            padding: string;
            backgroundColor: string;
        };
        tableIconLabel: {
            color: string;
            fontSize: number;
            noWrap: boolean;
            marginLeft: number;
        };
        table: {
            border: string;
            borderRadius: string;
            padding: string;
        };
        tableHeader: {
            '& th': {
                borderBottom: string;
                height: number;
                backgroundColor: string;
                padding: string;
                borderRight: string;
                fontWeight: string;
            };
            '& th:first-child': {
                width: string;
            };
            '& th:nth-child(2)': {
                padding: string;
            };
        };
        tableRow: {
            '& td': {
                borderBottom: string;
                height: number;
                margin: number;
                padding: string;
                alignItems: string;
                borderRight: string;
            };
            '& td:first-child': {
                width: string;
            };
            '& td:nth-child(2)': {
                padding: string;
            };
        };
    };
};
