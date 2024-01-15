import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    categoryTitle: {
        textAlign: string;
        font: string;
        fontSize: string;
    };
    layerDetails: {
        borderColor: string;
        borderWidth: string;
        borderStyle: string;
        padding: string;
        overflow: string;
        maxHeight: string;
    };
    buttonDescriptionContainer: {
        display: string;
        flexDirection: string;
        alignItems: string;
    };
    itemsGrid: {
        width: string;
        '& .MuiGrid-container': {
            '&:first-of-type': {
                fontWeight: string;
                borderTop: string;
                borderBottom: string;
            };
            '& .MuiGrid-item': {
                padding: string;
                '&:first-of-type': {
                    width: string;
                };
                '&:nth-of-type(2)': {
                    flexGrow: number;
                    textAlign: string;
                    display: string;
                    flexDirection: string;
                    alignItems: string;
                };
            };
        };
    };
    tableIconLabel: {
        color: string;
        fontSize: number;
        noWrap: boolean;
        marginLeft: number;
    };
};
