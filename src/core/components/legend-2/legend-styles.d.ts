import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    container: {
        background: string;
        boxShadow: string;
        padding: string;
        display: string;
        flexDirection: string;
    };
    title: {
        textAlign: string;
        font: string;
        fontSize: string;
    };
    subtitle: {
        font: string;
        fontWeight: string;
        fontSize: string;
        textAlign: string;
        marginBottom: string;
    };
    layersListContainer: {
        [x: string]: string | {
            width: string;
        };
        padding: string;
        textOverflow: string;
        whiteSpace: string;
        overflow: string;
    };
    legendLayerListItem: {
        padding: string;
        '& .layerTitle > .MuiListItemText-primary': {
            font: string;
            textOverflow: string;
            whiteSpace: string;
            overflow: string;
        };
        '& .MuiCollapse-vertical': {
            marginLeft: string;
            '& ul': {
                marginTop: number;
                padding: number;
            };
            '& li': {
                borderLeft: string;
                paddingLeft: string;
                marginBottom: string;
                fontWeight: string;
                '&.unchecked': {
                    borderLeft: string;
                    fontStyle: string;
                    color: string;
                };
            };
        };
    };
    collapsibleContainer: {
        width: string;
        padding: string;
        margin: string;
    };
};
