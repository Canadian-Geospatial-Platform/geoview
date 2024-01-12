import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    dataPanel: {
        background: string;
        boxShadow: string;
        padding: string;
    };
    gridContainer: {
        paddingLeft: string;
        paddingRight: string;
    };
    iconImage: {
        padding: number;
        borderRadius: number;
        border: string;
        borderColor: string;
        boxShadow: string;
        background: string;
        objectFit: string;
        width: string;
        height: string;
    };
    selectedRows: {
        backgroundColor: string;
        transition: string;
        fontWeight: number;
        fontSize: string;
        linHeight: number;
        letterSpacing: string;
        display: string;
        padding: string;
        color: string;
    };
    selectedRowsDirection: {
        display: string;
        flexDirection: string;
    };
    tableCell: {
        whiteSpace: string;
        textOverflow: string;
        overflow: string;
    };
    dataTableWrapper: {
        '& .MuiPaper-root': {
            border: string;
            borderRadius: string;
            height: string;
        };
        '& .MuiTableContainer-root': {
            maxHeight: string;
            borderRadius: string;
        };
        '& .MuiToolbar-root ': {
            borderRadius: string;
        };
    };
    filterMap: {
        '& .Mui-checked': {
            '& .MuiTouchRipple-root': {
                color: string;
            };
        };
        '& .MuiTouchRipple-root': {
            color: string;
        };
    };
    tableHeadCell: {
        '& .MuiCollapse-wrapperInner': {
            '& .MuiBox-root': {
                gridTemplateColumns: string;
            };
        };
        '& .MuiInput-root': {
            fontSize: string;
            '& .MuiSvgIcon-root': {
                width: string;
                height: string;
            };
        };
        '& .MuiBadge-root': {
            marginLeft: string;
            '>span': {
                width: string;
            };
            svg: {
                marginTop: string;
                marginBottom: string;
            };
            '& .keyboard-focused': {
                backgroundColor: string;
                borderRadius: string;
                border: string;
                '> svg': {
                    opacity: number;
                };
            };
        };
    };
};
