import { Input, Theme } from '@mui/material';
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
            fontSize: (theme: Theme) => any;
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
    listStyle: {
        fontSize: (theme: Theme) => any;
        whiteSpace: string;
        overflow: string;
        textOverflow: string;
    };
    main: {
        whiteSpace: string;
        overflow: string;
        textOverflow: string;
        '& span': {
            fontSize: (theme: Theme) => any;
            ':first-of-type': {
                fontSize: (theme: Theme) => any;
            };
        };
    };
};
export declare const StyledInputField: typeof Input;
