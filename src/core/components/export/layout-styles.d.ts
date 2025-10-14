export declare const SHARED_STYLES: {
    readonly fontFamily: "Helvetica";
    readonly padding: 36;
    readonly titleFontSize: 16;
    readonly scaleFontSize: 10;
    readonly footerFontSize: 8;
    readonly layerFontSize: 9;
    readonly childFontSize: 8;
    readonly timeFontSize: 7;
    readonly itemFontSize: 7;
    readonly titleMarginBottom: 10;
    readonly mapMarginBottom: 10;
    readonly scaleMarginBottom: 10;
    readonly legendMarginTop: 5;
    readonly legendMarginBottom: 5;
    readonly layerMarginBottom: 3;
    readonly layerMarginTop: 8;
    readonly wmsMarginBottom: 2;
    readonly timeMarginBottom: 2;
    readonly childMarginBottom: 2;
    readonly childMarginTop: 3;
    readonly itemMarginBottom: 1;
    readonly borderWidth: 1;
    readonly borderColor: string;
    readonly scaleLineHeight: 1;
    readonly scaleLineMarginBottom: 2;
    readonly scaleTextMarginTop: 2;
    readonly scaleTickWidth: 1;
    readonly scaleTickHeight: 8;
    readonly scaleTickOffset: -0.5;
    readonly scaleTickTop: -3;
    readonly northArrowSize: 40;
    readonly legendGap: 10;
    readonly legendPaddingLeft: 2;
    readonly wmsImageWidth: 80;
    readonly wmsImageMaxHeight: 100;
    readonly itemIconSize: 8;
    readonly itemIconMarginRight: 2;
    readonly footerBottom: 30;
    readonly footerMarginBottom: 5;
    readonly footerItemMarginBottom: 2;
    readonly overflowMarginTop: 20;
    readonly overflowMarginBottom: 20;
};
export declare const PDF_STYLES: {
    readonly page: {
        readonly padding: 36;
        readonly fontFamily: "Helvetica";
    };
    readonly title: {
        readonly fontSize: 16;
        readonly fontWeight: "bold";
        readonly textAlign: "center";
        readonly marginBottom: 10;
    };
    readonly mapContainer: {
        readonly marginBottom: 10;
        readonly borderWidth: 1;
        readonly borderColor: string;
        readonly borderStyle: "solid";
    };
    readonly mapImage: {
        readonly width: "100%";
        readonly objectFit: "contain";
    };
    readonly scaleContainer: {
        readonly flexDirection: "row";
        readonly justifyContent: "space-between";
        readonly alignItems: "center";
        readonly marginBottom: 10;
    };
    readonly scaleBarContainer: {
        readonly justifyContent: "center";
        readonly alignItems: "center";
    };
    readonly scaleLine: {
        readonly height: 1;
        readonly backgroundColor: string;
        readonly marginBottom: 2;
        readonly position: "relative";
    };
    readonly scaleTick: {
        readonly position: "absolute";
        readonly top: -3;
        readonly width: 1;
        readonly height: 8;
        readonly backgroundColor: string;
    };
    readonly scaleTickLeft: {
        readonly left: -0.5;
    };
    readonly scaleTickRight: {
        readonly right: -0.5;
    };
    readonly scaleText: {
        readonly fontSize: 10;
        readonly color: string;
        readonly marginTop: 2;
        readonly textAlign: "center";
        readonly textTransform: "lowercase";
    };
    readonly northArrow: {
        readonly width: 40;
        readonly height: 40;
    };
    readonly northArrowSvg: {
        readonly width: 40;
        readonly height: 40;
    };
    readonly legendContainer: {
        readonly flexDirection: "row";
        readonly justifyContent: "center";
        readonly alignItems: "flex-start";
        readonly gap: 10;
        readonly paddingLeft: 2;
        readonly marginTop: 5;
        readonly marginBottom: 5;
    };
    readonly layerText: (marginTop: number) => {
        fontSize: 9;
        fontWeight: string;
        marginBottom: 3;
        marginTop: number;
        flexWrap: "wrap";
        whiteSpace: string;
    };
    readonly wmsContainer: (indentLevel: number) => {
        marginLeft: number;
        marginBottom: 2;
    };
    readonly wmsImage: {
        readonly width: 80;
        readonly maxHeight: 100;
        readonly objectFit: "contain";
    };
    readonly timeText: (indentLevel: number) => {
        fontSize: 7;
        fontStyle: "italic";
        marginLeft: number;
        marginBottom: 2;
    };
    readonly childText: (indentLevel: number) => {
        fontSize: 8;
        fontWeight: string;
        marginBottom: 2;
        marginLeft: number;
        marginTop: 3;
    };
    readonly itemContainer: (indentLevel: number) => {
        flexDirection: "row";
        alignItems: "center";
        marginLeft: number;
        marginBottom: 1;
    };
    readonly itemIcon: {
        readonly width: 8;
        readonly height: 8;
        readonly marginRight: 2;
    };
    readonly itemText: {
        readonly fontSize: 7;
        readonly flexShrink: 1;
        readonly flexWrap: "nowrap";
        readonly whiteSpace: "nowrap";
    };
    readonly footer: {
        readonly fontSize: "8px";
        readonly position: "absolute";
        readonly bottom: 30;
        readonly left: 36;
        readonly right: 36;
    };
    readonly footerDisclaimer: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
        readonly marginBottom: 5;
        readonly paddingLeft: "4px";
        readonly paddingRight: "4px";
    };
    readonly footerAttribution: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
        readonly marginBottom: 2;
    };
    readonly footerDate: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
    };
    readonly overflowContainer: {
        readonly flexDirection: "row";
        readonly justifyContent: "center";
        readonly alignItems: "flex-start";
        readonly gap: 10;
        readonly paddingLeft: 2;
        readonly marginTop: 20;
        readonly marginBottom: 20;
    };
};
export declare const CANVAS_STYLES: {
    readonly page: (width: number, height: number) => {
        width: string;
        height: string;
        padding: string;
        fontFamily: "Helvetica";
        backgroundColor: string;
        display: "flex";
        flexDirection: "column";
        boxSizing: "border-box";
    };
    readonly title: {
        readonly fontSize: "16px";
        readonly fontWeight: "bold";
        readonly textAlign: "center";
        readonly marginBottom: "10px";
        readonly margin: "0 0 10px 0";
    };
    readonly mapImage: {
        readonly width: "100%";
        readonly objectFit: "contain";
        readonly marginBottom: "10px";
        readonly borderWidth: 1;
        readonly borderColor: string;
        readonly borderStyle: "solid";
    };
    readonly scaleContainer: {
        readonly display: "flex";
        readonly justifyContent: "space-between";
        readonly alignItems: "center";
        readonly marginBottom: "10px";
    };
    readonly scaleBarContainer: {
        readonly display: "flex";
        readonly flexDirection: "column";
        readonly alignItems: "center";
    };
    readonly scaleLine: {
        readonly position: "relative";
        readonly height: "1px";
        readonly backgroundColor: string;
        readonly marginBottom: "2px";
    };
    readonly scaleTick: {
        readonly position: "absolute";
        readonly top: "-3px";
        readonly width: "1px";
        readonly height: "8px";
        readonly backgroundColor: string;
    };
    readonly scaleTickLeft: {
        readonly left: "-0.5px";
    };
    readonly scaleTickRight: {
        readonly right: "-0.5px";
    };
    readonly scaleText: {
        readonly fontSize: "10px";
        readonly color: string;
        readonly marginTop: "2px";
        readonly textTransform: "lowercase";
    };
    readonly northArrow: {
        readonly width: "40px";
        readonly height: "40px";
    };
    readonly northArrowSvg: {
        readonly width: "40px";
        readonly height: "40px";
    };
    readonly legendContainer: {
        readonly display: "flex";
        readonly justifyContent: "center";
        readonly alignItems: "flex-start";
        readonly gap: "10px";
        readonly paddingLeft: "2px";
        readonly marginTop: "5px";
        readonly marginBottom: "5px";
    };
    readonly layerText: (marginTop: string) => {
        fontSize: string;
        fontWeight: string;
        marginBottom: string;
        marginTop: string;
        flexWrap: "wrap";
        whiteSpace: string;
    };
    readonly wmsContainer: (indentLevel: number) => {
        marginLeft: string;
        marginBottom: string;
    };
    readonly wmsImage: {
        readonly width: "80px";
        readonly maxHeight: "100px";
        readonly objectFit: "contain";
    };
    readonly timeText: (indentLevel: number) => {
        fontSize: string;
        fontStyle: string;
        marginLeft: string;
        marginBottom: string;
    };
    readonly childText: (indentLevel: number) => {
        fontSize: string;
        fontWeight: string;
        marginBottom: string;
        marginLeft: string;
        marginTop: string;
    };
    readonly itemContainer: (indentLevel: number) => {
        display: string;
        alignItems: string;
        marginLeft: string;
        marginBottom: string;
    };
    readonly itemIcon: {
        readonly width: "8px";
        readonly height: "8px";
        readonly marginRight: "2px";
    };
    readonly itemText: {
        readonly fontSize: "7px";
        readonly flexWrap: "nowrap";
        readonly whiteSpace: "nowrap";
    };
    readonly footer: {
        readonly fontSize: "8px";
        readonly textAlign: "center";
        readonly marginTop: "auto";
        readonly paddingTop: `${number}px`;
    };
    readonly footerDisclaimer: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
        readonly marginBottom: "5px";
    };
    readonly footerAttribution: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
        readonly marginBottom: "2px";
    };
    readonly footerDate: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
    };
    readonly overflowPage: (width: number, height: number) => {
        width: string;
        height: string;
        padding: string;
        fontFamily: "Helvetica";
        backgroundColor: string;
    };
    readonly overflowContainer: {
        readonly display: "flex";
        readonly justifyContent: "center";
        readonly alignItems: "flex-start";
        readonly gap: "10px";
        readonly paddingLeft: "2px";
        readonly marginTop: "20px";
        readonly marginBottom: "20px";
    };
};
//# sourceMappingURL=layout-styles.d.ts.map