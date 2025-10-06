const COLORS = {
  lightGrey: '#f5f5f5',
  standardGrey: '#9e9e9e',
  mediumGrey: '#757575',
  darkGrey: '#424242',
};
const SHARED_STYLES = {
  fontFamily: 'Helvetica',

  // Layout dimensions
  padding: 36,

  // Typography
  titleFontSize: 16,
  scaleFontSize: 10,
  footerFontSize: 8,
  layerFontSize: 9,
  childFontSize: 8,
  timeFontSize: 7,
  itemFontSize: 7,

  // Spacing
  titleMarginBottom: 10,
  mapMarginBottom: 10,
  scaleMarginBottom: 10,
  legendMarginTop: 5,
  legendMarginBottom: 5,
  layerMarginBottom: 3,
  layerMarginTop: 8,
  wmsMarginBottom: 2,
  timeMarginBottom: 2,
  childMarginBottom: 2,
  childMarginTop: 3,
  itemMarginBottom: 1,

  // Border
  borderWidth: 1,
  borderColor: COLORS.darkGrey,

  // Scale bar
  scaleLineHeight: 1,
  scaleLineMarginBottom: 2,
  scaleTextMarginTop: 2,
  scaleTickWidth: 1,
  scaleTickHeight: 8,
  scaleTickOffset: -0.5,
  scaleTickTop: -3,

  // North arrow
  northArrowSize: 40,

  // Legend
  legendGap: 10,
  legendPaddingLeft: 2,

  // WMS
  wmsImageWidth: 60,
  wmsImageMaxHeight: 100,

  // Item icons
  itemIconSize: 8,
  itemIconMarginRight: 2,

  // Footer
  footerBottom: 30,
  footerMarginBottom: 5,
  footerItemMarginBottom: 2,

  // Overflow page
  overflowMarginTop: 20,
  overflowMarginBottom: 20,
} as const;

// PDF-specific styles (react-pdf format)
export const PDF_STYLES = {
  page: { padding: SHARED_STYLES.padding, fontFamily: SHARED_STYLES.fontFamily },
  title: {
    fontSize: SHARED_STYLES.titleFontSize,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SHARED_STYLES.titleMarginBottom,
  },
  mapContainer: {
    marginBottom: SHARED_STYLES.mapMarginBottom,
    borderWidth: SHARED_STYLES.borderWidth,
    borderColor: SHARED_STYLES.borderColor,
    borderStyle: 'solid',
  },
  mapImage: { width: '100%', objectFit: 'contain' },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SHARED_STYLES.scaleMarginBottom,
  },
  scaleBarContainer: { justifyContent: 'center', alignItems: 'center' },
  scaleLine: {
    height: SHARED_STYLES.scaleLineHeight,
    backgroundColor: SHARED_STYLES.borderColor,
    marginBottom: SHARED_STYLES.scaleLineMarginBottom,
    position: 'relative',
  },
  scaleTick: {
    position: 'absolute',
    top: SHARED_STYLES.scaleTickTop,
    width: SHARED_STYLES.scaleTickWidth,
    height: SHARED_STYLES.scaleTickHeight,
    backgroundColor: SHARED_STYLES.borderColor,
  },
  scaleTickLeft: { left: SHARED_STYLES.scaleTickOffset },
  scaleTickRight: { right: SHARED_STYLES.scaleTickOffset },
  scaleText: {
    fontSize: SHARED_STYLES.scaleFontSize,
    color: COLORS.darkGrey,
    marginTop: SHARED_STYLES.scaleTextMarginTop,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  northArrow: {
    width: SHARED_STYLES.northArrowSize,
    height: SHARED_STYLES.northArrowSize,
  },
  northArrowSvg: {
    width: SHARED_STYLES.northArrowSize,
    height: SHARED_STYLES.northArrowSize,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SHARED_STYLES.legendGap,
    paddingLeft: SHARED_STYLES.legendPaddingLeft,
    marginTop: SHARED_STYLES.legendMarginTop,
    marginBottom: SHARED_STYLES.legendMarginBottom,
  },
  layerText: (marginTop: number) => ({
    fontSize: SHARED_STYLES.layerFontSize,
    fontWeight: 'bold',
    marginBottom: SHARED_STYLES.layerMarginBottom,
    marginTop,
    flexWrap: 'wrap' as const,
    whiteSpace: 'normal',
  }),
  wmsContainer: (indentLevel: number) => ({
    marginLeft: indentLevel + 3,
    marginBottom: SHARED_STYLES.wmsMarginBottom,
  }),
  wmsImage: {
    width: SHARED_STYLES.wmsImageWidth,
    maxHeight: SHARED_STYLES.wmsImageMaxHeight,
    objectFit: 'contain',
  },
  timeText: (indentLevel: number) => ({
    fontSize: SHARED_STYLES.timeFontSize,
    fontStyle: 'italic' as const,
    marginLeft: indentLevel,
    marginBottom: SHARED_STYLES.timeMarginBottom,
  }),
  childText: (indentLevel: number) => ({
    fontSize: SHARED_STYLES.childFontSize,
    fontWeight: 'bold',
    marginBottom: SHARED_STYLES.childMarginBottom,
    marginLeft: indentLevel,
    marginTop: SHARED_STYLES.childMarginTop,
  }),
  itemContainer: (indentLevel: number) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: indentLevel + 3,
    marginBottom: SHARED_STYLES.itemMarginBottom,
  }),
  itemIcon: {
    width: SHARED_STYLES.itemIconSize,
    height: SHARED_STYLES.itemIconSize,
    marginRight: SHARED_STYLES.itemIconMarginRight,
  },
  itemText: {
    fontSize: SHARED_STYLES.itemFontSize,
    flexShrink: 1,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
  },
  footer: {
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
    position: 'absolute',
    bottom: SHARED_STYLES.footerBottom,
    left: SHARED_STYLES.padding,
    right: SHARED_STYLES.padding,
  },
  footerDisclaimer: {
    fontSize: SHARED_STYLES.footerFontSize,
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: SHARED_STYLES.footerMarginBottom,
    paddingLeft: '4px',
    paddingRight: '4px',
  },
  footerAttribution: {
    fontSize: SHARED_STYLES.footerFontSize,
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: SHARED_STYLES.footerItemMarginBottom,
  },
  footerDate: {
    fontSize: SHARED_STYLES.footerFontSize,
    color: COLORS.darkGrey,
    textAlign: 'center',
  },
  overflowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SHARED_STYLES.legendGap,
    paddingLeft: SHARED_STYLES.legendPaddingLeft,
    marginTop: SHARED_STYLES.overflowMarginTop,
    marginBottom: SHARED_STYLES.overflowMarginBottom,
  },
} as const;

// Canvas-specific styles (CSS format)
export const CANVAS_STYLES = {
  page: (width: number, height: number) => ({
    width: `${width}px`,
    height: `${height}px`,
    padding: `${SHARED_STYLES.padding}px`,
    fontFamily: SHARED_STYLES.fontFamily,
    backgroundColor: 'white',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  }),
  title: {
    fontSize: `${SHARED_STYLES.titleFontSize}px`,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: `${SHARED_STYLES.titleMarginBottom}px`,
    margin: `0 0 ${SHARED_STYLES.titleMarginBottom}px 0`,
  },
  mapImage: {
    width: '100%',
    objectFit: 'contain',
    marginBottom: `${SHARED_STYLES.mapMarginBottom}px`,
    borderWidth: SHARED_STYLES.borderWidth,
    borderColor: SHARED_STYLES.borderColor,
    borderStyle: 'solid',
  },
  scaleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: `${SHARED_STYLES.scaleMarginBottom}px`,
  },
  scaleBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scaleLine: {
    position: 'relative',
    height: `${SHARED_STYLES.scaleLineHeight}px`,
    backgroundColor: SHARED_STYLES.borderColor,
    marginBottom: `${SHARED_STYLES.scaleLineMarginBottom}px`,
  },
  scaleTick: {
    position: 'absolute',
    top: `${SHARED_STYLES.scaleTickTop}px`,
    width: `${SHARED_STYLES.scaleTickWidth}px`,
    height: `${SHARED_STYLES.scaleTickHeight}px`,
    backgroundColor: SHARED_STYLES.borderColor,
  },
  scaleTickLeft: { left: `${SHARED_STYLES.scaleTickOffset}px` },
  scaleTickRight: { right: `${SHARED_STYLES.scaleTickOffset}px` },
  scaleText: {
    fontSize: `${SHARED_STYLES.scaleFontSize}px`,
    color: COLORS.darkGrey,
    marginTop: `${SHARED_STYLES.scaleTextMarginTop}px`,
    textTransform: 'lowercase',
  },
  northArrow: {
    width: `${SHARED_STYLES.northArrowSize}px`,
    height: `${SHARED_STYLES.northArrowSize}px`,
  },
  northArrowSvg: {
    width: `${SHARED_STYLES.northArrowSize}px`,
    height: `${SHARED_STYLES.northArrowSize}px`,
  },
  legendContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: `${SHARED_STYLES.legendGap}px`,
    paddingLeft: `${SHARED_STYLES.legendPaddingLeft}px`,
    marginTop: `${SHARED_STYLES.legendMarginTop}px`,
    marginBottom: `${SHARED_STYLES.legendMarginBottom}px`,
  },
  layerText: (marginTop: string) => ({
    fontSize: `${SHARED_STYLES.layerFontSize}px`,
    fontWeight: 'bold',
    marginBottom: `${SHARED_STYLES.layerMarginBottom}px`,
    marginTop,
    flexWrap: 'wrap' as const,
    whiteSpace: 'normal',
  }),
  wmsContainer: (indentLevel: number) => ({
    marginLeft: `${indentLevel + 3}px`,
    marginBottom: `${SHARED_STYLES.wmsMarginBottom}px`,
  }),
  wmsImage: {
    width: `${SHARED_STYLES.wmsImageWidth}px`,
    maxHeight: `${SHARED_STYLES.wmsImageMaxHeight}px`,
    objectFit: 'contain',
  },
  timeText: (indentLevel: number) => ({
    fontSize: `${SHARED_STYLES.timeFontSize}px`,
    fontStyle: 'italic',
    marginLeft: `${indentLevel}px`,
    marginBottom: `${SHARED_STYLES.timeMarginBottom}px`,
  }),
  childText: (indentLevel: number) => ({
    fontSize: `${SHARED_STYLES.childFontSize}px`,
    fontWeight: 'bold',
    marginBottom: `${SHARED_STYLES.childMarginBottom}px`,
    marginLeft: `${indentLevel}px`,
    marginTop: `${SHARED_STYLES.childMarginTop}px`,
  }),
  itemContainer: (indentLevel: number) => ({
    display: 'flex',
    alignItems: 'center',
    marginLeft: `${indentLevel + 3}px`,
    marginBottom: `${SHARED_STYLES.itemMarginBottom}px`,
  }),
  itemIcon: {
    width: `${SHARED_STYLES.itemIconSize}px`,
    height: `${SHARED_STYLES.itemIconSize}px`,
    marginRight: `${SHARED_STYLES.itemIconMarginRight}px`,
  },
  itemText: {
    fontSize: `${SHARED_STYLES.itemFontSize}px`,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
  },
  footer: {
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: `${SHARED_STYLES.legendMarginTop * 4}px`,
  },
  footerDisclaimer: {
    fontSize: SHARED_STYLES.footerFontSize,
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: `${SHARED_STYLES.footerMarginBottom}px`,
  },
  footerAttribution: {
    fontSize: SHARED_STYLES.footerFontSize,
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: `${SHARED_STYLES.footerItemMarginBottom}px`,
  },
  footerDate: {
    fontSize: SHARED_STYLES.footerFontSize,
    color: COLORS.darkGrey,
    textAlign: 'center',
  },
  overflowPage: (width: number, height: number) => ({
    width: `${width}px`,
    height: `${height}px`,
    padding: `${SHARED_STYLES.padding}px`,
    fontFamily: SHARED_STYLES.fontFamily,
    backgroundColor: 'white',
  }),
  overflowContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: `${SHARED_STYLES.legendGap}px`,
    paddingLeft: `${SHARED_STYLES.legendPaddingLeft}px`,
    marginTop: `${SHARED_STYLES.overflowMarginTop}px`,
    marginBottom: `${SHARED_STYLES.overflowMarginBottom}px`,
  },
} as const;
