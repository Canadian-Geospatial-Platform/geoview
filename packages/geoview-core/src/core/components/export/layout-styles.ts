const COLORS = {
  lightGrey: '#f5f5f5',
  standardGrey: '#9e9e9e',
  mediumGrey: '#757575',
  darkGrey: '#424242',
};

export const SHARED_STYLES = {
  fontFamily: 'Helvetica',
  padding: 36,
  titleFontSize: 16,
  scaleFontSize: 10,
  footerFontSize: 8,
  layerFontSize: 9,
  childFontSize: 8,
  timeFontSize: 7,
  itemFontSize: 7,
  titleMarginBottom: 10,
  mapMarginBottom: 10,
  scaleMarginBottom: 10,
  legendMarginTop: 2,
  legendMarginBottom: 2,
  layerMarginBottom: 3,
  layerMarginTop: 8,
  wmsMarginBottom: 2,
  timeMarginBottom: 2,
  childMarginBottom: 2,
  childMarginTop: 3,
  itemMarginBottom: 1,
  borderWidth: 1,
  borderColor: COLORS.darkGrey,
  scaleLineHeight: 1,
  scaleLineMarginBottom: 2,
  scaleTextMarginTop: 2,
  scaleTickWidth: 1,
  scaleTickHeight: 8,
  scaleTickOffset: -0.5,
  scaleTickTop: -3,
  northArrowSize: 40,
  legendGap: 10,
  legendPaddingLeft: 2,
  dividerMargin: 10,
  dividerHeight: 2,
  rowDividerHeight: 1,
  rowDividerMargin: 8,
  wmsImageWidth: 250,
  wmsImageMaxHeight: 600,
  itemIconSize: 8,
  itemIconMarginRight: 2,
  footerBottom: 30,
  footerMarginBottom: 5,
  footerItemMarginBottom: 2,
  overflowMarginTop: 20,
  overflowMarginBottom: 20,

  // Base styles
  page: { padding: 36, fontFamily: 'Helvetica' },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  mapContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.darkGrey,
    borderStyle: 'solid',
  },
  mapImage: { width: '100%', objectFit: 'contain' },
  scaleBarContainer: { justifyContent: 'center', alignItems: 'center' },
  scaleLine: {
    height: 1,
    backgroundColor: COLORS.darkGrey,
    marginBottom: 2,
    position: 'relative',
  },
  scaleTick: {
    position: 'absolute',
    top: -3,
    width: 1,
    height: 8,
    backgroundColor: COLORS.darkGrey,
  },
  scaleTickLeft: { left: -0.5 },
  scaleTickRight: { right: -0.5 },
  scaleText: {
    fontSize: 10,
    color: COLORS.darkGrey,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  northArrow: { width: 40, height: 40 },
  northArrowSvg: { width: 40, height: 40 },
  layerText: (marginTop: number | string) => ({
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    marginTop,
    flexWrap: 'wrap' as const,
    whiteSpace: 'normal',
  }),
  wmsContainer: (indentLevel: number) => ({
    marginLeft: indentLevel + 3,
    marginBottom: 2,
  }),
  wmsImage: {
    maxWidth: 250,
    maxHeight: 600,
    objectFit: 'contain',
  },
  timeText: (indentLevel: number) => ({
    fontSize: 7,
    fontStyle: 'italic' as const,
    marginLeft: indentLevel,
    marginBottom: 2,
  }),
  childText: (indentLevel: number) => ({
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
    marginLeft: indentLevel * 8 + 8,
    marginTop: 3,
  }),
  itemIcon: {
    width: 8,
    height: 8,
    marginRight: 2,
  },
  itemText: {
    fontSize: 7,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  footer: {
    fontSize: 8,
    marginTop: 'auto',
    paddingTop: 5,
    paddingLeft: 0,
    paddingRight: 0,
  },
  footerDisclaimer: {
    fontSize: 8,
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  footerAttribution: {
    fontSize: 8,
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: 2,
  },
  footerDate: {
    fontSize: 8,
    color: COLORS.darkGrey,
    textAlign: 'center',
  },
} as const;

// PDF-specific styles (react-pdf format)
export const PDF_STYLES = {
  ...SHARED_STYLES,
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SHARED_STYLES.scaleMarginBottom,
  },
  divider: {
    width: '100%',
    height: SHARED_STYLES.dividerHeight,
    backgroundColor: COLORS.standardGrey,
    marginBottom: SHARED_STYLES.dividerMargin,
  },
  legendContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: SHARED_STYLES.legendPaddingLeft,
    marginTop: SHARED_STYLES.legendMarginTop,
    marginBottom: SHARED_STYLES.legendMarginBottom,
  },
  itemContainer: (indentLevel: number) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: indentLevel * 8 + 3,
    marginBottom: SHARED_STYLES.itemMarginBottom,
  }),
  itemText: {
    ...SHARED_STYLES.itemText,
    whiteSpace: 'wrap',
  },
  footer: {
    ...SHARED_STYLES.footer,
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: SHARED_STYLES.legendGap,
    width: '100%',
    paddingTop: SHARED_STYLES.rowDividerMargin,
    paddingBottom: SHARED_STYLES.rowDividerMargin,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkGrey,
    borderTopStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGrey,
    borderBottomStyle: 'solid',
  },
} as const;

// Canvas-specific styles (CSS format)
export const CANVAS_STYLES = {
  page: (width: number, height: number) => ({
    width: `${width}px`,
    height: `${height}px`,
    minHeight: `${height}px`,
    padding: `${SHARED_STYLES.padding}px`,
    fontFamily: SHARED_STYLES.fontFamily,
    backgroundColor: 'white',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  }),
  title: {
    ...SHARED_STYLES.title,
    fontSize: `${SHARED_STYLES.titleFontSize}px`,
    margin: `0 0 ${SHARED_STYLES.titleMarginBottom}px 0`,
  },
  mapImage: {
    ...SHARED_STYLES.mapImage,
    marginBottom: `${SHARED_STYLES.mapMarginBottom}px`,
  },
  scaleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: `${SHARED_STYLES.scaleMarginBottom}px`,
  },
  scaleBarContainer: {
    ...SHARED_STYLES.scaleBarContainer,
    display: 'flex',
    flexDirection: 'column',
  },
  scaleLine: {
    ...SHARED_STYLES.scaleLine,
    height: `${SHARED_STYLES.scaleLineHeight}px`,
    marginBottom: `${SHARED_STYLES.scaleLineMarginBottom}px`,
  },
  scaleTick: {
    ...SHARED_STYLES.scaleTick,
    top: `${SHARED_STYLES.scaleTickTop}px`,
    width: `${SHARED_STYLES.scaleTickWidth}px`,
    height: `${SHARED_STYLES.scaleTickHeight}px`,
  },
  scaleTickLeft: { left: `${SHARED_STYLES.scaleTickOffset}px` },
  scaleTickRight: { right: `${SHARED_STYLES.scaleTickOffset}px` },
  scaleText: {
    ...SHARED_STYLES.scaleText,
    fontSize: `${SHARED_STYLES.scaleFontSize}px`,
    marginTop: `${SHARED_STYLES.scaleTextMarginTop}px`,
  },
  northArrow: {
    ...SHARED_STYLES.northArrow,
    width: `${SHARED_STYLES.northArrowSize}px`,
    height: `${SHARED_STYLES.northArrowSize}px`,
  },
  northArrowSvg: {
    ...SHARED_STYLES.northArrowSvg,
    width: `${SHARED_STYLES.northArrowSize}px`,
    height: `${SHARED_STYLES.northArrowSize}px`,
  },
  divider: {
    width: '100%',
    height: `${SHARED_STYLES.dividerHeight}px`,
    backgroundColor: COLORS.standardGrey,
    marginBottom: `${SHARED_STYLES.dividerMargin}px`,
  },
  legendContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: `${SHARED_STYLES.legendPaddingLeft}px`,
    marginTop: `${SHARED_STYLES.legendMarginTop}px`,
    marginBottom: `${SHARED_STYLES.legendMarginBottom}px`,
    width: '100%',
    boxSizing: 'border-box',
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: `${SHARED_STYLES.legendGap}px`,
    width: '100%',
    paddingTop: `${SHARED_STYLES.rowDividerMargin}px`,
    paddingBottom: `${SHARED_STYLES.rowDividerMargin}px`,
    borderTop: `1px solid ${COLORS.darkGrey}`,
    borderBottom: `1px solid ${COLORS.darkGrey}`,
  },
  layerText: (marginTop: string) => ({
    ...SHARED_STYLES.layerText(marginTop),
    fontSize: `${SHARED_STYLES.layerFontSize}px`,
    marginBottom: `${SHARED_STYLES.layerMarginBottom}px`,
  }),
  wmsContainer: (indentLevel: number) => ({
    ...SHARED_STYLES.wmsContainer(indentLevel),
    marginLeft: `${indentLevel + 3}px`,
    marginBottom: `${SHARED_STYLES.wmsMarginBottom}px`,
  }),
  wmsImage: {
    ...SHARED_STYLES.wmsImage,
    width: `${SHARED_STYLES.wmsImageWidth}px`,
    maxHeight: `${SHARED_STYLES.wmsImageMaxHeight}px`,
    objectFit: 'contain',
  },
  timeText: (indentLevel: number) => ({
    ...SHARED_STYLES.timeText(indentLevel),
    fontSize: `${SHARED_STYLES.timeFontSize}px`,
    marginLeft: `${indentLevel}px`,
    marginBottom: `${SHARED_STYLES.timeMarginBottom}px`,
  }),
  childText: (indentLevel: number) => ({
    ...SHARED_STYLES.childText(indentLevel),
    fontSize: `${SHARED_STYLES.childFontSize}px`,
    marginBottom: `${SHARED_STYLES.childMarginBottom}px`,
    marginLeft: `${indentLevel * 8 + 8}px`,
    marginTop: `${SHARED_STYLES.childMarginTop}px`,
  }),
  itemContainer: (indentLevel: number) => ({
    display: 'flex',
    alignItems: 'center',
    marginLeft: `${indentLevel * 8 + 3}px`,
    marginBottom: `${SHARED_STYLES.itemMarginBottom}px`,
  }),
  itemIcon: {
    ...SHARED_STYLES.itemIcon,
    width: `${SHARED_STYLES.itemIconSize}px`,
    height: `${SHARED_STYLES.itemIconSize}px`,
    marginRight: `${SHARED_STYLES.itemIconMarginRight}px`,
  },
  itemText: {
    ...SHARED_STYLES.itemText,
    fontSize: `${SHARED_STYLES.itemFontSize}px`,
    whiteSpace: 'wrap',
  },
  footer: {
    ...SHARED_STYLES.footer,
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: `${SHARED_STYLES.legendMarginTop * 4}px`,
  },
  footerDisclaimer: {
    ...SHARED_STYLES.footerDisclaimer,
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
    marginBottom: `${SHARED_STYLES.footerMarginBottom}px`,
  },
  footerAttribution: {
    ...SHARED_STYLES.footerAttribution,
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
    marginBottom: `${SHARED_STYLES.footerItemMarginBottom}px`,
  },
  footerDate: {
    ...SHARED_STYLES.footerDate,
    fontSize: `${SHARED_STYLES.footerFontSize}px`,
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

/**
 * Get scaled PDF styles for AUTO mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getScaledPDFStyles = (docWidth: number): any => {
  const scale = docWidth / 612;
  return {
    ...PDF_STYLES,
    layerText: (marginTop: number) => ({
      ...PDF_STYLES.layerText(marginTop),
      fontSize: PDF_STYLES.layerText(0).fontSize * scale,
    }),
    childText: (indentLevel: number) => ({
      ...PDF_STYLES.childText(indentLevel),
      fontSize: PDF_STYLES.childText(0).fontSize * scale,
    }),
    timeText: (indentLevel: number) => ({
      ...PDF_STYLES.timeText(indentLevel),
      fontSize: PDF_STYLES.timeText(0).fontSize * scale,
    }),
    itemText: {
      ...PDF_STYLES.itemText,
      fontSize: PDF_STYLES.itemText.fontSize * scale,
    },
    title: {
      ...PDF_STYLES.title,
      fontSize: PDF_STYLES.title.fontSize * scale,
    },
    scaleText: {
      ...PDF_STYLES.scaleText,
      fontSize: PDF_STYLES.scaleText.fontSize * scale,
    },
    footerDisclaimer: {
      ...PDF_STYLES.footerDisclaimer,
      fontSize: PDF_STYLES.footerDisclaimer.fontSize * scale,
    },
    footerAttribution: {
      ...PDF_STYLES.footerAttribution,
      fontSize: PDF_STYLES.footerAttribution.fontSize * scale,
    },
    footerDate: {
      ...PDF_STYLES.footerDate,
      fontSize: PDF_STYLES.footerDate.fontSize * scale,
    },
    northArrow: {
      ...PDF_STYLES.northArrow,
      width: PDF_STYLES.northArrow.width * scale,
      height: PDF_STYLES.northArrow.height * scale,
    },
    northArrowSvg: {
      ...PDF_STYLES.northArrowSvg,
      width: PDF_STYLES.northArrowSvg.width * scale,
      height: PDF_STYLES.northArrowSvg.height * scale,
    },
    itemIcon: {
      ...PDF_STYLES.itemIcon,
      width: PDF_STYLES.itemIcon.width * scale,
      height: PDF_STYLES.itemIcon.height * scale,
    },
    wmsImage: {
      ...PDF_STYLES.wmsImage,
      maxWidth: SHARED_STYLES.wmsImageWidth * scale,
      maxHeight: SHARED_STYLES.wmsImageMaxHeight * scale,
    },
  };
};

/**
 * Get scaled Canvas styles for AUTO mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getScaledCanvasStyles = (docWidth: number): any => {
  const scale = docWidth / 612;
  return {
    ...CANVAS_STYLES,
    layerText: (marginTop: string) => ({
      ...CANVAS_STYLES.layerText(marginTop),
      fontSize: `${parseInt(CANVAS_STYLES.layerText('0').fontSize) * scale}px`,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
    }),
    childText: (indentLevel: number) => ({
      ...CANVAS_STYLES.childText(indentLevel),
      fontSize: `${parseInt(CANVAS_STYLES.childText(0).fontSize) * scale}px`,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
    }),
    timeText: (indentLevel: number) => ({
      ...CANVAS_STYLES.timeText(indentLevel),
      fontSize: `${parseInt(CANVAS_STYLES.timeText(0).fontSize) * scale}px`,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
    }),
    itemText: {
      ...CANVAS_STYLES.itemText,
      fontSize: `${parseInt(CANVAS_STYLES.itemText.fontSize) * scale}px`,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
    },
    title: {
      ...CANVAS_STYLES.title,
      fontSize: `${parseInt(CANVAS_STYLES.title.fontSize) * scale}px`,
    },
    scaleText: {
      ...CANVAS_STYLES.scaleText,
      fontSize: `${parseInt(CANVAS_STYLES.scaleText.fontSize) * scale}px`,
    },
    footerDisclaimer: {
      ...CANVAS_STYLES.footerDisclaimer,
      fontSize: `${parseInt(CANVAS_STYLES.footerDisclaimer.fontSize) * scale}px`,
    },
    footerAttribution: {
      ...CANVAS_STYLES.footerAttribution,
      fontSize: `${parseInt(CANVAS_STYLES.footerAttribution.fontSize) * scale}px`,
    },
    footerDate: {
      ...CANVAS_STYLES.footerDate,
      fontSize: `${parseInt(CANVAS_STYLES.footerDate.fontSize) * scale}px`,
    },
    northArrow: {
      ...CANVAS_STYLES.northArrow,
      width: `${parseInt(CANVAS_STYLES.northArrow.width) * scale}px`,
      height: `${parseInt(CANVAS_STYLES.northArrow.height) * scale}px`,
    },
    northArrowSvg: {
      ...CANVAS_STYLES.northArrowSvg,
      width: `${parseInt(CANVAS_STYLES.northArrowSvg.width) * scale}px`,
      height: `${parseInt(CANVAS_STYLES.northArrowSvg.height) * scale}px`,
    },
    itemIcon: {
      ...CANVAS_STYLES.itemIcon,
      width: `${parseInt(CANVAS_STYLES.itemIcon.width) * scale}px`,
      height: `${parseInt(CANVAS_STYLES.itemIcon.height) * scale}px`,
    },
    wmsImage: {
      ...CANVAS_STYLES.wmsImage,
      width: `${SHARED_STYLES.wmsImageWidth * scale}px`,
      maxHeight: `${SHARED_STYLES.wmsImageMaxHeight * scale}px`,
      objectFit: 'contain',
    },
  };
};
