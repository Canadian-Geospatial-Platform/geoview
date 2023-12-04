import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    layersPanelContainer: {
        background: string;
        boxShadow: string;
        padding: string;
    };
    list: {
        color: string;
        width: string;
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
                border: string;
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
    buttonDescriptionContainer: {
        display: string;
        flexDirection: string;
        alignItems: string;
    };
};
