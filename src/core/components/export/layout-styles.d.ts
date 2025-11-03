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
    readonly legendMarginTop: 2;
    readonly legendMarginBottom: 2;
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
    readonly dividerMargin: 10;
    readonly dividerHeight: 2;
    readonly rowDividerHeight: 1;
    readonly rowDividerMargin: 8;
    readonly wmsImageWidth: 250;
    readonly wmsImageMaxHeight: 600;
    readonly itemIconSize: 8;
    readonly itemIconMarginRight: 2;
    readonly footerBottom: 30;
    readonly footerMarginBottom: 5;
    readonly footerItemMarginBottom: 2;
    readonly overflowMarginTop: 20;
    readonly overflowMarginBottom: 20;
    readonly page: {
        readonly padding: 36;
        readonly fontFamily: "Helvetica";
    };
    readonly title: {
        readonly fontSize: 16;
        readonly fontWeight: "semibold";
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
    readonly layerText: (marginTop: number | string) => {
        fontSize: number;
        fontWeight: string;
        marginBottom: number;
        marginTop: string | number;
        flexWrap: "wrap";
        whiteSpace: string;
    };
    readonly wmsContainer: (indentLevel: number) => {
        marginLeft: number;
        marginBottom: number;
    };
    readonly wmsImage: {
        readonly maxWidth: 250;
        readonly objectFit: "contain";
    };
    readonly timeText: (indentLevel: number) => {
        fontSize: number;
        fontStyle: "italic";
        marginLeft: number;
        marginBottom: number;
    };
    readonly childText: (indentLevel: number) => {
        fontSize: number;
        fontWeight: string;
        marginBottom: number;
        marginLeft: number;
        marginTop: number;
    };
    readonly itemIcon: {
        readonly width: 8;
        readonly height: 8;
        readonly marginRight: 2;
    };
    readonly itemText: {
        readonly fontSize: 7;
        readonly flexShrink: 1;
        readonly flexWrap: "wrap";
    };
    readonly footer: {
        readonly fontSize: 8;
        readonly marginTop: "auto";
        readonly paddingTop: 5;
        readonly paddingLeft: 0;
        readonly paddingRight: 0;
    };
    readonly footerDisclaimer: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
        readonly marginBottom: 0;
        readonly paddingLeft: 0;
        readonly paddingRight: 0;
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
};
export declare const PDF_STYLES: {
    readonly scaleContainer: {
        readonly flexDirection: "row";
        readonly justifyContent: "space-between";
        readonly alignItems: "center";
        readonly marginBottom: 10;
    };
    readonly divider: {
        readonly width: "100%";
        readonly height: 2;
        readonly backgroundColor: string;
        readonly marginBottom: 10;
    };
    readonly legendContainer: {
        readonly flexDirection: "column";
        readonly justifyContent: "flex-start";
        readonly alignItems: "flex-start";
        readonly paddingLeft: 2;
        readonly marginTop: 2;
        readonly marginBottom: 2;
    };
    readonly itemContainer: (indentLevel: number) => {
        flexDirection: "row";
        alignItems: "center";
        marginLeft: number;
        marginBottom: 1;
    };
    readonly itemText: {
        readonly whiteSpace: "wrap";
        readonly fontSize: 7;
        readonly flexShrink: 1;
        readonly flexWrap: "wrap";
    };
    readonly footer: {
        readonly fontSize: "8px";
        readonly marginTop: "auto";
        readonly paddingTop: 5;
        readonly paddingLeft: 0;
        readonly paddingRight: 0;
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
    readonly rowContainer: {
        readonly flexDirection: "row";
        readonly justifyContent: "flex-start";
        readonly alignItems: "flex-start";
        readonly gap: 10;
        readonly width: "100%";
        readonly paddingTop: 8;
        readonly paddingBottom: 8;
        readonly borderTopWidth: 1;
        readonly borderTopColor: string;
        readonly borderTopStyle: "solid";
        readonly borderBottomWidth: 1;
        readonly borderBottomColor: string;
        readonly borderBottomStyle: "solid";
    };
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
    readonly legendMarginTop: 2;
    readonly legendMarginBottom: 2;
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
    readonly dividerMargin: 10;
    readonly dividerHeight: 2;
    readonly rowDividerHeight: 1;
    readonly rowDividerMargin: 8;
    readonly wmsImageWidth: 250;
    readonly wmsImageMaxHeight: 600;
    readonly itemIconSize: 8;
    readonly itemIconMarginRight: 2;
    readonly footerBottom: 30;
    readonly footerMarginBottom: 5;
    readonly footerItemMarginBottom: 2;
    readonly overflowMarginTop: 20;
    readonly overflowMarginBottom: 20;
    readonly page: {
        readonly padding: 36;
        readonly fontFamily: "Helvetica";
    };
    readonly title: {
        readonly fontSize: 16;
        readonly fontWeight: "semibold";
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
    readonly layerText: (marginTop: number | string) => {
        fontSize: number;
        fontWeight: string;
        marginBottom: number;
        marginTop: string | number;
        flexWrap: "wrap";
        whiteSpace: string;
    };
    readonly wmsContainer: (indentLevel: number) => {
        marginLeft: number;
        marginBottom: number;
    };
    readonly wmsImage: {
        readonly maxWidth: 250;
        readonly objectFit: "contain";
    };
    readonly timeText: (indentLevel: number) => {
        fontSize: number;
        fontStyle: "italic";
        marginLeft: number;
        marginBottom: number;
    };
    readonly childText: (indentLevel: number) => {
        fontSize: number;
        fontWeight: string;
        marginBottom: number;
        marginLeft: number;
        marginTop: number;
    };
    readonly itemIcon: {
        readonly width: 8;
        readonly height: 8;
        readonly marginRight: 2;
    };
    readonly footerDisclaimer: {
        readonly fontSize: 8;
        readonly color: string;
        readonly textAlign: "center";
        readonly marginBottom: 0;
        readonly paddingLeft: 0;
        readonly paddingRight: 0;
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
};
export declare const CANVAS_STYLES: {
    readonly page: (width: number, height: number) => {
        width: string;
        height: string;
        minHeight: string;
        padding: string;
        fontFamily: "Helvetica";
        backgroundColor: string;
        display: "flex";
        flexDirection: "column";
        boxSizing: "border-box";
    };
    readonly title: {
        readonly fontSize: "16px";
        readonly margin: "0 0 10px 0";
        readonly fontWeight: "semibold";
        readonly textAlign: "center";
        readonly marginBottom: 10;
    };
    readonly mapImage: {
        readonly marginBottom: "10px";
        readonly width: "100%";
        readonly objectFit: "contain";
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
        readonly justifyContent: "center";
        readonly alignItems: "center";
    };
    readonly scaleLine: {
        readonly height: "1px";
        readonly marginBottom: "2px";
        readonly backgroundColor: string;
        readonly position: "relative";
    };
    readonly scaleTick: {
        readonly top: "-3px";
        readonly width: "1px";
        readonly height: "8px";
        readonly position: "absolute";
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
        readonly marginTop: "2px";
        readonly color: string;
        readonly textAlign: "center";
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
    readonly divider: {
        readonly width: "100%";
        readonly height: "2px";
        readonly backgroundColor: string;
        readonly marginBottom: "10px";
    };
    readonly legendContainer: {
        readonly display: "flex";
        readonly flexDirection: "column";
        readonly justifyContent: "flex-start";
        readonly alignItems: "flex-start";
        readonly paddingLeft: "2px";
        readonly marginTop: "2px";
        readonly marginBottom: "2px";
        readonly width: "100%";
        readonly boxSizing: "border-box";
    };
    readonly rowContainer: {
        readonly display: "flex";
        readonly flexDirection: "row";
        readonly justifyContent: "flex-start";
        readonly alignItems: "flex-start";
        readonly gap: "10px";
        readonly width: "100%";
        readonly paddingTop: "8px";
        readonly paddingBottom: "8px";
        readonly borderTop: `1px solid ${string}`;
        readonly borderBottom: `1px solid ${string}`;
    };
    readonly layerText: (marginTop: string) => {
        fontSize: string;
        marginBottom: string;
        fontWeight: string;
        marginTop: string | number;
        flexWrap: "wrap";
        whiteSpace: string;
    };
    readonly wmsContainer: (indentLevel: number) => {
        marginLeft: string;
        marginBottom: string;
    };
    readonly wmsImage: {
        readonly maxWidth: "250px";
        readonly objectFit: "contain";
    };
    readonly timeText: (indentLevel: number) => {
        fontSize: string;
        marginLeft: string;
        marginBottom: string;
        fontStyle: "italic";
    };
    readonly childText: (indentLevel: number) => {
        fontSize: string;
        marginBottom: string;
        marginLeft: string;
        marginTop: string;
        fontWeight: string;
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
        readonly whiteSpace: "wrap";
        readonly flexShrink: 1;
        readonly flexWrap: "wrap";
    };
    readonly footer: {
        readonly fontSize: "8px";
        readonly textAlign: "center";
        readonly marginTop: "auto";
        readonly paddingTop: `${number}px`;
        readonly paddingLeft: 0;
        readonly paddingRight: 0;
    };
    readonly footerDisclaimer: {
        readonly fontSize: "8px";
        readonly marginBottom: "5px";
        readonly color: string;
        readonly textAlign: "center";
        readonly paddingLeft: 0;
        readonly paddingRight: 0;
    };
    readonly footerAttribution: {
        readonly fontSize: "8px";
        readonly marginBottom: "2px";
        readonly color: string;
        readonly textAlign: "center";
    };
    readonly footerDate: {
        readonly fontSize: "8px";
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
/**
 * Get scaled PDF styles for AUTO mode
 */
export declare const getScaledPDFStyles: (docWidth: number) => any;
/**
 * Get scaled Canvas styles for AUTO mode
 */
export declare const getScaledCanvasStyles: (docWidth: number) => any;
//# sourceMappingURL=layout-styles.d.ts.map