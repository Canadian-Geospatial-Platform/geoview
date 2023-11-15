import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    list: {
        color: string;
        marginLeft: string;
        width: string;
        paddingRight: string;
        '& .layerItemContainer': {
            background: string;
            borderRadius: string;
            marginBottom: string;
            border: string;
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
    oddDepthList: {
        background: string;
        boxShadow: string;
        padding: string;
        margin: string;
        width: string;
        boxSizing: string;
        '& .layerItemContainer': {
            backgroundColor: string;
            marginBottom: string;
        };
    };
    evenDepthList: {
        background: string;
        boxShadow: string;
        padding: string;
        margin: string;
        width: string;
        boxSizing: string;
        '& .layerItemContainer': {
            backgroundColor: string;
            marginBottom: string;
        };
    };
    layersList: {
        selectedLayerItem: {
            border: string;
        };
    };
};
