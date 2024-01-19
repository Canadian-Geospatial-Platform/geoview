import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    list: {
        color: string;
        width: string;
        padding: string;
        overflowY: string;
        '& .MuiListItemText-primary': {
            font: string;
            padding: string;
            fontSize: string;
            lineHeight: number;
            overflow: string;
            textOverflow: string;
            whiteSpace: string;
        };
        '& .layerItemContainer': {
            background: string;
            borderRadius: string;
            marginBottom: string;
            '& .MuiListItemText-root': {
                marginLeft: string;
            };
            '&.selectedLayer': {
                borderColor: string;
                borderWidth: string;
                borderStyle: string;
            };
            '&.dragging': {
                backgroundColor: string;
                cursor: string;
                userSelect: string;
            };
            '&.error': {
                background: string;
                '& .MuiListItemText-secondary': {
                    fontWeight: string;
                    color: string;
                };
            };
            '&.loading': {
                background: string;
                '& .MuiListItemText-secondary': {
                    fontWeight: string;
                    color: string;
                };
            };
            '& .rightIcons-container': {
                display: string;
                flexDirection: string;
                justifyContent: string;
                alignItems: string;
                '& .MuiIconButton-root': {
                    color: string;
                    background: string;
                    margin: string;
                };
            };
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
};
