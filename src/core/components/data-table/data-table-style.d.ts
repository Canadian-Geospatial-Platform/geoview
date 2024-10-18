import { Theme } from '@mui/material';
export declare const getSxClasses: (theme: Theme) => {
    readonly dataPanel: {
        readonly background: string;
        readonly paddingBottom: "1rem";
    };
    readonly gridContainer: {
        readonly paddingLeft: "1rem";
        readonly paddingRight: "1rem";
    };
    readonly selectedRows: {
        readonly transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms";
        readonly fontWeight: 400;
        readonly fontSize: any;
        readonly linHeight: 1.43;
        readonly letterSpacing: "0.01071em";
        readonly display: "flex";
        readonly padding: "6px";
        readonly alignItems: "center";
    };
    readonly selectedRowsDirection: {
        readonly display: "flex";
        readonly flexDirection: "column";
    };
    readonly tableCell: {
        readonly whiteSpace: "nowrap";
        readonly textOverflow: "ellipsis";
        readonly overflow: "hidden";
    };
    readonly dataTableWrapper: {
        readonly '& .MuiTableContainer-root': {
            readonly borderRadius: "6px";
        };
        readonly '& .MuiToolbar-root ': {
            readonly borderRadius: "6px";
        };
    };
    readonly filterMap: {
        readonly '& .Mui-checked': {
            readonly '& .MuiTouchRipple-root': {
                readonly color: string;
            };
        };
        readonly '& .MuiTouchRipple-root': {
            readonly color: string;
        };
    };
    readonly tableHead: {
        readonly '& th:nth-of-type(-n+3)': {
            readonly justifyContent: "end";
        };
    };
    readonly tableHeadCell: {
        readonly '& .MuiCollapse-wrapperInner': {
            readonly '& .MuiBox-root': {
                readonly gridTemplateColumns: "1fr";
            };
        };
        readonly '& .MuiInput-root': {
            readonly fontSize: any;
            readonly '& .MuiSvgIcon-root': {
                readonly width: "0.75em";
                readonly height: "0.75em";
            };
        };
        readonly '& .MuiBadge-root': {
            readonly marginLeft: "0.5rem";
            readonly '>span': {
                readonly width: "100%";
            };
            readonly svg: {
                readonly marginTop: "0.25rem";
                readonly marginBottom: "0.25rem";
            };
            readonly '& .keyboard-focused': {
                readonly backgroundColor: "rgba(81, 91, 165, 0.08)";
                readonly borderRadius: "50%";
                readonly border: "1px solid black !important";
                readonly '> svg': {
                    readonly opacity: 1;
                };
            };
        };
    };
    readonly dataTableInstructionsTitle: {
        readonly fontSize: any;
        readonly fontWeight: "600";
        readonly lineHeight: "1.5em";
    };
    readonly dataTableInstructionsBody: {
        readonly fontSize: any;
    };
    readonly rightPanelContainer: {
        readonly overflowY: "auto";
        readonly color: string;
    };
};
