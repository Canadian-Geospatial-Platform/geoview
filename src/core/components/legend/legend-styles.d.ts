import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    container: {
        padding: string;
        display: string;
        flexDirection: string;
        backgroundColor: string;
    };
    containerHeight: {
        height: number;
    };
    title: {
        textAlign: string;
        fontWeight: string;
        color: string;
        fontSize: any;
    };
    subtitle: {
        fontWeight: string;
        fontSize: any;
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
            fontSize: any;
            fontWeight: string;
            textOverflow: string;
            whiteSpace: string;
            overflow: string;
        };
        '& .MuiListItemText-root': {
            marginLeft: string;
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
    legendInstructionsTitle: {
        fontSize: any;
        fontWeight: string;
        lineHeight: string;
    };
    legendInstructionsBody: {
        fontSize: string;
    };
};
