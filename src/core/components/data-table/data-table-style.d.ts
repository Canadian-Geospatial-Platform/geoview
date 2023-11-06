import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    list: {
        color: string;
        marginLeft: string;
        width: string;
        paddingRight: string;
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
    listPrimaryText: {
        minWidth: string;
        marginTop: string;
        marginBottom: string;
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
    paper: {
        marginBottom: string;
        height: string;
    };
    borderWithIndex: string;
    borderNone: string;
    headline: {
        fontSize: string;
        fontWeight: string;
    };
    dataPanel: {
        backgroundColor: string;
        padding: string;
    };
    gridContainer: {
        paddingLeft: string;
        paddingRight: string;
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
    tableCell: {
        whiteSpace: string;
        textOverflow: string;
        overflow: string;
    };
    dataTableWrapper: {
        '& .MuiPaper-root': {
            border: string;
            borderRadius: string;
        };
        '& .MuiTableContainer-root': {
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
