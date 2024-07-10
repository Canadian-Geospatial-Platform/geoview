export declare const sxClasses: {
    mapContainer: {
        display: string;
        flexDirection: string;
        width: string;
        height: string;
        position: string;
        '& .ol-overviewmap.ol-custom-overviewmap': {
            bottom: string;
            left: string;
            right: string;
            top: string;
            margin: number;
            order: number;
            padding: number;
            position: string;
            borderRadius: number;
            '& .ol-overviewmap-map': {
                border: string;
                display: string;
                WebkitTransition: string;
                MozTransition: string;
                OTransition: string;
                msTransition: string;
                transition: string;
            };
            '&.ol-uncollapsible': {
                bottom: string;
                left: string;
                right: number;
                top: number;
                margin: number;
            };
            '&:not(.ol-collapsed)': {
                boxShadow: string;
                borderRadius: string;
                border: string;
            };
            '&:is(.ol-collapsed)': {
                boxShadow: string;
                borderRadius: number;
                border: string;
            };
            '& button': {
                zIndex: number;
                position: string;
                top: number;
                right: number;
                left: string;
                bottom: string;
                backgroundColor: string;
            };
            '&::before': {
                content: string;
                display: string;
                position: string;
                width: number;
                height: number;
                borderRadius: number;
                zIndex: number;
                right: number;
                top: number;
            };
            '& .ol-overviewmap-box': {
                backgroundColor: string;
            };
            '& .ol-viewport': {
                borderRadius: string;
                '& .ol-layer': {
                    backgroundColor: string;
                };
            };
        };
    };
};
