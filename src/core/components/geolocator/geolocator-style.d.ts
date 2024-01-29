/// <reference types="react" />
export declare const sxClasses: {
    root: {
        position: string;
        top: number;
        left: number;
        maxWidth: number;
        width: number;
    };
    geolocator: {
        position: string;
        display: string;
        zIndex: number;
        '& form': {
            display: string;
            width: string;
            paddingLeft: number;
        };
        '& .MuiPaper-root': {
            backgroundColor: string;
            color: string;
            '& .MuiToolbar-root': {
                justifyContent: string;
            };
        };
    };
    progressBar: {
        position: string;
        zIndex: number;
        '& span': {
            width: string;
        };
    };
    filter: {
        display: string;
        flexDirection: string;
        alignItems: string;
        padding: number;
        paddingTop: number;
        '& .MuiInputLabel-formControl': {
            fontSize: string;
            marginTop: number;
        };
        '& .MuiSelect-select': {
            padding: string;
        };
    };
    searchResult: {
        position: string;
        display: string;
        flexDirection: string;
        zIndex: number;
        marginTop: number;
    };
    filterListError: {
        listStyleType: string;
        listStylePosition: string;
        '& li': {
            display: string;
            paddingLeft: number;
            '& .MuiListItemText-root': {
                display: string;
                marginLeft: string;
            };
        };
    };
};
export declare const sxClassesList: {
    main: {
        whiteSpace: string;
        overflow: string;
        textOverflow: string;
        '& span': {
            fontSize: string;
            ':first-of-type': {
                fontWeight: string;
                fontSize: string;
            };
        };
    };
};
export declare const StyledInputField: ((props: import("@mui/material").InputProps) => JSX.Element) & {
    muiName: string;
};
