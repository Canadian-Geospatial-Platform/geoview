import { Theme } from '@mui/material/styles';
export declare const getSxClasses: (theme: Theme) => {
    textIconContainer: {
        display: string;
        flexDirection: string;
        alignItems: string;
        width: string;
    };
    icon: {
        display: string;
        justifyContent: string;
        alignItems: string;
        color: string;
    };
    text: {
        width: string;
        textAlign: string;
        textTransform: string;
        marginLeft: number;
        display: string;
        justifyContent: string;
        '& $buttonClass': {
            justifyContent: string;
        };
    };
    buttonClass: {
        display: string;
        fontSize: number;
        paddingLeft: string;
        paddingRight: string;
        justifyContent: string;
        width: string;
        height: number;
    };
};
