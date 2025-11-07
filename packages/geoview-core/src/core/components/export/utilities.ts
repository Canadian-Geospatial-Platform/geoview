import { createElement } from 'react';
import { Buffer } from 'buffer';

import type { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeTimeSliderValues, TimeSliderLayerSet } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';

// TODO As a utility file, the EventProcessors probably shouldn't be here, but it removes a lot of duplication
// TO.DO from the pdf-layout and canvas-layout files. Possibly a rename or a better solution could be found.
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';

import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';

import { SHARED_STYLES } from './layout-styles';

// GV Buffer polyfill for react-pdf
if (typeof window !== 'undefined') {
  (window as typeof globalThis).Buffer = Buffer;
}

export type TypeValidPageSizes = 'AUTO';

export type TypeMapStateForExportLayout = {
  attribution: string[];
  northArrow: boolean;
  northArrowElement: TypeNorthArrow;
  mapScale: TypeScaleInfo;
  mapRotation: number;
};

export interface FlattenedLegendItem {
  type: 'layer' | 'item' | 'child' | 'wms' | 'time';
  data: TypeLegendLayer;
  parentName?: string;
  depth: number;
  isRoot: boolean;
  timeInfo?: TypeTimeSliderValues;
  calculatedHeight?: number;
}

export type TypePageConfig = (typeof PAGE_CONFIGS)[keyof typeof PAGE_CONFIGS];

export type TypeMapInfoResult = {
  mapDataUrl: string;
  scaleText: string;
  scaleLineWidth: string;
  northArrowSvg: Array<{
    d: string | null;
    fill: string | null;
    stroke: string | null;
    strokeWidth: string | null;
  }> | null;
  northArrowRotation: number;
  attributions: string[];
  fittedColumns: FlattenedLegendItem[][];
  columnWidths?: number[];
  fittedOverflowItems?: FlattenedLegendItem[][];
};

// Page size specific styling
export const PAGE_CONFIGS = {
  LETTER: { size: 'LETTER' as const, mapHeight: 400, legendColumns: 4, maxLegendHeight: 375, canvasWidth: 612, canvasHeight: 792 },
  LEGAL: { size: 'LEGAL' as const, mapHeight: 600, legendColumns: 4, maxLegendHeight: 425, canvasWidth: 612, canvasHeight: 1008 },
  TABLOID: { size: 'TABLOID' as const, mapHeight: 800, legendColumns: 6, maxLegendHeight: 550, canvasWidth: 792, canvasHeight: 1224 },
  AUTO: { size: 'AUTO' as const, mapHeight: 400, legendColumns: 4, maxLegendHeight: Infinity, canvasWidth: 612, canvasHeight: 0 }, // Height calculated dynamically
};

// Export dimension constants at 300DPI
const MAP_IMAGE_DIMENSIONS = {
  AUTO: {
    // Width and height calculated dynamically
    width: 100, // Default, will be recalculated
    height: 100, // Default, will be recalculated
  },
};

/**
 * Extract native dimensions from a base64-encoded PNG image
 * PNG format stores width/height in IHDR chunk (bytes 16-23)
 * @param {string} base64Data - The base64 image string (with or without data:image/png;base64, prefix)
 * @returns {{ width: number; height: number } | null} The image dimensions or null if cannot be extracted
 */
function getPNGDimensions(base64Data: string): { width: number; height: number } | null {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64 to binary
    const buffer = Buffer.from(base64, 'base64');

    // PNG IHDR chunk is at bytes 16-23 (after 8-byte PNG signature and 8-byte chunk header)
    // Width: 4 bytes at position 16-19, Height: 4 bytes at position 20-23
    // eslint-disable-next-line no-bitwise
    const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
    // eslint-disable-next-line no-bitwise
    const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];

    return { width, height };
  } catch (error) {
    logger.logError('Failed to extract PNG dimensions', error);
    return null;
  }
}

/**
 * Element factory interface for creating renderer-specific elements
 * Allows us to abstract between Canvas (HTML) and PDF rendering
 */
export interface ElementFactory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  View: (props: any) => JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Text: (props: any) => JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Image: (props: any) => JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Span: (props: any) => JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Svg: (props: any) => JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Path: (props: any) => JSX.Element;
}

/**
 * Renders a single legend item using the provided element factory
 * @param {FlattenedLegendItem} item - The item to render
 * @param {number} itemIndex - Index of the item in the column
 * @param {number} indentLevel - The indentation level (0-3)
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object (CANVAS_STYLES or PDF_STYLES)
 * @returns {JSX.Element} The rendered item
 */
export const renderSingleLegendItem = (
  item: FlattenedLegendItem,
  itemIndex: number,
  indentLevel: number,
  factory: ElementFactory,
  scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  baseStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element => {
  const { View, Text, Image, Span } = factory;

  if (item.type === 'layer') {
    const marginValue = itemIndex > 0 ? '18px' : 0;
    const pdfMarginValue = itemIndex > 0 ? 18 : 0;

    // Add separator line above layer (except for first layer)
    const separator =
      itemIndex > 0
        ? createElement(View, {
            key: `separator-${item.data.layerPath}-${itemIndex}`,
            style: scaledStyles.layerSeparator(typeof marginValue === 'string' ? marginValue : pdfMarginValue),
          })
        : null;

    const layerText = createElement(
      Text,
      {
        key: `layer-${item.data.layerPath}-${itemIndex}`,
        style: scaledStyles.layerText(),
      },
      item.data.layerName
    );

    // Return wrapper with separator + text, or just text if no separator
    if (separator) {
      return createElement(View, { key: `layer-wrapper-${item.data.layerPath}-${itemIndex}` }, separator, layerText);
    }
    return layerText;
  }

  if (item.type === 'wms') {
    return createElement(
      View,
      {
        key: `wms-${item.data.layerPath}-${itemIndex}`,
        style: baseStyles.wmsContainer(indentLevel),
      },
      createElement(Image, {
        src: item.data.icons?.[0]?.iconImage || '',
        style: baseStyles.wmsImage,
      })
    );
  }

  if (item.type === 'time') {
    const timeText = item.timeInfo?.singleHandle
      ? DateMgt.formatDate(
          new Date(item.timeInfo.values[0]),
          item.timeInfo.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
        )
      : `${DateMgt.formatDate(
          new Date(item.timeInfo?.values[0] || 0),
          item.timeInfo?.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
        )} - ${DateMgt.formatDate(
          new Date(item.timeInfo?.values[1] || 0),
          item.timeInfo?.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
        )}`;

    return createElement(
      Text,
      {
        key: `time-${item.data.layerPath}-${itemIndex}`,
        style: scaledStyles.timeText(indentLevel),
      },
      timeText
    );
  }

  if (item.type === 'child') {
    return createElement(
      Text,
      {
        key: `child-${item.data.layerPath}-${itemIndex}`,
        style: scaledStyles.childText(indentLevel),
      },
      item.data.layerName || '...'
    );
  }

  // Default: item type
  const legendItem = item.data.items[0];

  // Extract native PNG dimensions and apply inline for consistent sizing
  let iconStyle = scaledStyles.itemIcon;
  if (legendItem?.icon) {
    const dimensions = getPNGDimensions(legendItem.icon);
    if (dimensions) {
      // Apply minimum 4px size to ensure icons are visible
      const minSize = 4;
      const width = Math.max(dimensions.width, minSize);
      const height = Math.max(dimensions.height, minSize);

      iconStyle = {
        ...scaledStyles.itemIcon,
        width,
        height,
      };
    }
  }

  return createElement(
    View,
    {
      key: `item-${item.parentName}-${legendItem?.name}-${itemIndex}`,
      style: baseStyles.itemContainer(indentLevel),
    },
    legendItem?.icon && createElement(Image, { src: legendItem.icon, style: iconStyle }),
    createElement(Span, { style: scaledStyles.itemText }, legendItem?.name)
  );
};

/**
 * Groups items into containers - wraps content items
 * @param {FlattenedLegendItem[]} column - The column items to render
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object
 * @returns {JSX.Element[]} Array of rendered elements
 */
export const renderColumnItems = (
  column: FlattenedLegendItem[],
  factory: ElementFactory,
  scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  baseStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element[] => {
  const { View } = factory;
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < column.length) {
    const item = column[i];
    const indentLevel = Math.min(item.depth, 3);

    // Check if this is a layer (depth 0) or child layer (any depth >= 1)
    if (item.type === 'layer' || item.type === 'child') {
      // First render the layer/child header WITHOUT the border
      elements.push(renderSingleLegendItem(item, i, indentLevel, factory, scaledStyles, baseStyles));

      const currentDepth = item.depth;
      const contentStart = i + 1;
      let contentEnd = i + 1;

      // Find all immediate children (depth = currentDepth + 1)
      // Stop when we hit an item at same or lower depth (sibling or higher level)
      // IMPORTANT: Only collect content items (not child layers) to wrap
      while (contentEnd < column.length && column[contentEnd].depth > currentDepth) {
        // Only collect items at the immediate next level
        if (column[contentEnd].depth === currentDepth + 1) {
          const nextItem = column[contentEnd];
          // Stop if we encounter a child layer - it needs its own processing
          if (nextItem.type === 'child') {
            break;
          }
          contentEnd++;
        } else {
          // This is a deeper nested item, skip to find where this group ends
          break;
        }
      }

      // If we have direct children (content items only, not child layers)
      if (contentEnd > contentStart) {
        // Wrap content items
        const contentItems: JSX.Element[] = [];
        for (let j = contentStart; j < contentEnd; j++) {
          const contentItem = column[j];
          const contentIndentLevel = Math.min(contentItem.depth, 3);

          contentItems.push(renderSingleLegendItem(contentItem, j, contentIndentLevel, factory, scaledStyles, baseStyles));
        }

        elements.push(createElement(View, { key: `content-${i}` }, ...contentItems));

        i = contentEnd;
      } else {
        // No content to wrap, just move to next item
        i++;
      }
    } else {
      elements.push(renderSingleLegendItem(item, i, indentLevel, factory, scaledStyles, baseStyles));
      i++;
    }
  }

  return elements;
};

/**
 * Renders legend columns using the provided element factory
 * @param {FlattenedLegendItem[][]} columns - The columns to render
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object
 * @returns {JSX.Element} The rendered legend
 */
export const renderLegendColumns = (
  columns: FlattenedLegendItem[][],
  factory: ElementFactory,
  scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  baseStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  columnWidths?: number[]
): JSX.Element => {
  const { View } = factory;

  // Use space-between for justified layout when columnWidths are provided
  const containerStyle = columnWidths
    ? { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }
    : { display: 'flex', flexDirection: 'row', gap: 10, width: '100%' };

  return createElement(
    View,
    { style: containerStyle },
    ...columns.map((column, colIndex) => {
      const columnKey = column.length > 0 ? `col-${column[0].data.layerPath}-${colIndex}` : `col-empty-${colIndex}`;
      const columnStyle = columnWidths
        ? {
            display: 'flex',
            flexDirection: 'column',
            width: `${columnWidths[colIndex]}px`,
            maxWidth: `${columnWidths[colIndex]}px`,
            minWidth: 0,
            overflow: 'hidden',
          }
        : { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 };

      return createElement(
        View,
        {
          key: columnKey,
          style: columnStyle,
        },
        ...renderColumnItems(column, factory, scaledStyles, baseStyles)
      );
    })
  );
};

/**
 * Renders footer section
 * @param {string} disclaimer - The disclaimer text
 * @param {string[]} attributions - The attribution texts
 * @param {string} date - The date string
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @returns {JSX.Element} The rendered footer
 */
export const renderFooter = (
  disclaimer: string,
  attributions: string[],
  date: string,
  factory: ElementFactory,
  scaledStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element => {
  const { View, Text } = factory;

  return createElement(
    View,
    { style: scaledStyles.footer || {} },
    createElement(Text, { style: scaledStyles.footerDisclaimer }, disclaimer || ''),
    ...attributions.map((attr) => createElement(Text, { key: `${attr.slice(0, 5)}`, style: scaledStyles.footerAttribution }, attr || '')),
    createElement(Text, { style: scaledStyles.footerDate }, date || '')
  );
};

/**
 * Renders scale bar with ticks
 * @param {string} scaleText - The scale text
 * @param {string} scaleLineWidth - The scale line width
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object
 * @returns {JSX.Element} The rendered scale bar
 */
export const renderScaleBar = (
  scaleText: string,
  scaleLineWidth: string,
  factory: ElementFactory,
  scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  baseStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element => {
  const { View, Text } = factory;

  return createElement(
    View,
    { style: baseStyles.scaleBarContainer },
    createElement(
      View,
      { style: { ...baseStyles.scaleLine, width: scaleLineWidth } },
      createElement(View, { style: { ...baseStyles.scaleTick, ...baseStyles.scaleTickLeft } }),
      createElement(View, { style: { ...baseStyles.scaleTick, ...baseStyles.scaleTickRight } })
    ),
    createElement(Text, { style: scaledStyles.scaleText }, scaleText)
  );
};

/**
 * Renders north arrow SVG
 * @param {Array} northArrowSvg - The north arrow SVG path data
 * @param {number} northArrowRotation - The rotation angle
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @returns {JSX.Element | null} The rendered north arrow or null
 */
export const renderNorthArrow = (
  northArrowSvg: Array<{
    d: string | null;
    fill: string | null;
    stroke: string | null;
    strokeWidth: string | null;
  }> | null,
  northArrowRotation: number,
  factory: ElementFactory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scaledStyles: any
): JSX.Element | null => {
  if (!northArrowSvg) return null;

  const { View, Svg, Path } = factory;

  return createElement(
    View,
    { style: { ...scaledStyles.northArrow, transform: `rotate(${northArrowRotation - 180}deg)` } },
    createElement(
      Svg,
      { viewBox: '285 142 24 24', style: scaledStyles.northArrowSvg },
      ...northArrowSvg.map((pathData, index) =>
        createElement(Path, {
          // eslint-disable-next-line react/no-array-index-key
          key: `path-${index}`,
          d: pathData.d || '',
          fill: pathData.fill || 'black',
          stroke: pathData.stroke || 'none',
          strokeWidth: pathData.strokeWidth || '0',
        })
      )
    )
  );
};

/**
 * Calculate actual WMS image height based on aspect ratio
 *
 * @param {string} imageUrl - The image url
 * @param {number} scale - The scale factor based on document width (e.g., 1.634 for 1000px, 3.922 for 2400px)
 * @param {string} layerName - The layer name for error logging
 * @returns {Promise<number>} The calculated height including scaled margin
 */
const calculateWMSImageHeight = (imageUrl: string | undefined, scale = 1, layerName = 'unknown'): Promise<number> => {
  // Missing URL fallback
  if (!imageUrl) {
    const scaledMargin = SHARED_STYLES.wmsMarginBottom * scale;
    const fallbackHeight = 100 * scale + scaledMargin;
    logger.logWarning(`WMS Image "${layerName}" has no URL, using fallback: ${Math.round(fallbackHeight)}px`);
    return Promise.resolve(fallbackHeight);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const maxWidth = SHARED_STYLES.wmsImageWidth * scale;

      // Calculate final dimensions based on maxWidth constraint (CSS behavior)
      // Images only scale down if wider than maxWidth, preserving aspect ratio
      // Narrower images keep their original size (no stretching)
      let finalHeight = img.height;

      if (img.width > maxWidth) {
        const widthScale = maxWidth / img.width;
        finalHeight = img.height * widthScale;
      }

      // Apply scaled margin to match CSS (wmsMarginBottom must be scaled)
      const scaledMargin = SHARED_STYLES.wmsMarginBottom * scale;
      const totalHeight = finalHeight + scaledMargin;

      // TODO: Fix wrong height calculation - WMS images still appear to be overestimated in final layout
      resolve(totalHeight);
    };

    // Error fallback: use 100px scaled with margin
    img.onerror = () => {
      const scaledMargin = SHARED_STYLES.wmsMarginBottom * scale;
      const fallbackHeight = 100 * scale + scaledMargin;
      logger.logError(`WMS Image "${layerName}" failed to load, using fallback: ${Math.round(fallbackHeight)}px`);
      resolve(fallbackHeight);
    };
  });
};

/**
 * Estimate text height based on character count and available width
 * Attempts to account for word wrapping
 * @param {string} text - The text to be placed
 * @param {number} fontSize - The font size (px)
 * @param {number} availableWidth - The available width in the column
 * @returns {number} - The calcualted height of the text
 */
const estimateTextHeight = (text: string, fontSize: number, availableWidth: number): number => {
  const avgCharWidth = fontSize * 0.6; // Rough estimate for character width
  const charsPerLine = Math.floor(availableWidth / avgCharWidth);
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * (fontSize + 2); // fontSize + line spacing
};

/**
 * Estimate individual legend item heights for layout calculation
 *
 * @param {FlattenedLegendItem} item - The legend item to estimate
 * @param {TypeValidPageSizes} pageSize - The page size for column width calculation
 * @param {number} scale - The scale factor (only used for WMS images)
 * @returns {number} The estimated height in pixels
 */
const estimateItemHeight = (item: FlattenedLegendItem, pageSize: TypeValidPageSizes, scale = 1): number => {
  const config = PAGE_CONFIGS[pageSize];
  const availableWidth = config.canvasWidth - SHARED_STYLES.padding * 2 - SHARED_STYLES.legendGap * (config.legendColumns - 1);
  const columnWidth = availableWidth / config.legendColumns;

  // NOTE: Legend items (layer, child, time, item) use base heights without scaling
  // CSS flex layout handles visual scaling via getScaled* functions
  // Only WMS images are pre-calculated with scaling applied
  // TODO: Fix wrong height calculation - Items still appear overestimated in final layout
  switch (item.type) {
    case 'layer': {
      const textHeight = estimateTextHeight(item.data.layerName || '', SHARED_STYLES.layerFontSize, columnWidth);
      return textHeight + SHARED_STYLES.layerMarginBottom; // marginTop added separately in column calculation
    }
    case 'child':
      // childFontSize(8) + childMarginBottom(2) + childMarginTop(3) - adjustment(1)
      return SHARED_STYLES.childFontSize + SHARED_STYLES.childMarginBottom + SHARED_STYLES.childMarginTop - 1;
    case 'wms': {
      // WMS images have pre-calculated heights with scaling applied
      const scaledMargin = SHARED_STYLES.wmsMarginBottom * scale;
      const height = item.calculatedHeight || 100 * scale + scaledMargin;
      if (!item.calculatedHeight) {
        logger.logWarning(`WMS item "${item.data.layerName}" missing calculatedHeight, using fallback: ${Math.round(height)}px`);
      }
      return height;
    }
    case 'time':
      // timeFontSize(7) + timeMarginBottom(2) + adjustment(1)
      return SHARED_STYLES.timeFontSize + SHARED_STYLES.timeMarginBottom + 1;
    case 'item':
      // itemFontSize(7) + itemMarginBottom(1)
      return SHARED_STYLES.itemFontSize + SHARED_STYLES.itemMarginBottom;
    default:
      return SHARED_STYLES.itemFontSize + SHARED_STYLES.itemMarginBottom;
  }
};

/**
 * Calculate optimal number of columns based on available width
 * Uses fixed minimum column width to accommodate WMS images and content
 * @param {number} canvasWidth - The canvas width
 * @param {number} defaultColumns - The default number of columns (4)
 * @returns {number} The optimal number of columns (2-4)
 */
const calculateOptimalColumns = (canvasWidth: number, defaultColumns: number): number => {
  // Calculate available width for legend content
  const availableWidth = canvasWidth - SHARED_STYLES.padding * 2 - SHARED_STYLES.legendPaddingLeft;

  // Minimum column width should accommodate:
  // - WMS images (250px)
  // - Border container (4px border + 8px padding + 8px margin = 20px)
  // - Some breathing room for text wrapping
  const MIN_COLUMN_WIDTH = 280;

  // Try each column count from default down to 2
  for (let numCols = defaultColumns; numCols >= 2; numCols--) {
    const gapsNeeded = (numCols - 1) * SHARED_STYLES.legendGap;
    const widthForColumns = availableWidth - gapsNeeded;
    const columnWidth = widthForColumns / numCols;

    if (columnWidth >= MIN_COLUMN_WIDTH) {
      return numCols;
    }
  }

  // Minimum of 2 columns
  return 2;
};

/**
 * Estimate footer height based on content
 * @param {string} disclaimer - The disclaimer text
 * @param {string[]} attributions - The array of attribution texts
 * @returns {number} The estimated height of the footer
 */
const estimateFooterHeight = (disclaimer: string, attributions: string[]): number => {
  const baseLineHeight = SHARED_STYLES.footerFontSize + 2; // 8px font + 2px spacing (reduced from 4)
  const marginBottom = SHARED_STYLES.footerMarginBottom;

  // Estimate disclaimer lines (assuming ~80 chars per line at font size 8 to be more conservative)
  const disclaimerLines = disclaimer ? Math.ceil(disclaimer.length / 80) : 0;
  const disclaimerHeight = disclaimerLines * baseLineHeight + (disclaimerLines > 0 ? marginBottom : 0);

  // Estimate attribution lines (also using 80 chars per line)
  const attributionHeight = attributions.reduce((total, attr) => {
    const lines = Math.ceil(attr.length / 80);
    return total + lines * baseLineHeight + SHARED_STYLES.footerItemMarginBottom;
  }, 0);

  // Date line
  const dateHeight = baseLineHeight;

  // Total without extra padding - the footer paddingTop is already in CSS
  const totalHeight = disclaimerHeight + attributionHeight + dateHeight;

  logger.logInfo(
    `Footer height estimate - Disclaimer: ${disclaimerHeight}px (${disclaimerLines} lines), ` +
      `Attributions: ${attributionHeight}px (${attributions.length} items), Date: ${dateHeight}px, Total: ${totalHeight}px`
  );

  return totalHeight;
};

/**
 * Filter and flatten layers for placement in the legend
 * @param {TypeLegendLayer[]} layers - The legend layers to be shown in the legend
 * @param {TypeOrdderedLayerInfo[]} orderedLayerInfo - The orderedLayerInfo to be used to filter out layers that aren't visible
 * @param {TimeSliderLayerSet} timeSliderLayers - Any layers that are time enabled
 * @returns {FlattenedLegendItem[]} The flattened list of all the items in the legend
 */
export const processLegendLayers = (
  layers: TypeLegendLayer[],
  orderedLayerInfo: TypeOrderedLayerInfo[],
  timeSliderLayers?: TimeSliderLayerSet
): FlattenedLegendItem[] => {
  const allItems: FlattenedLegendItem[] = [];

  const flattenLayer = (layer: TypeLegendLayer, depth = 0, rootLayerName?: string): FlattenedLegendItem[] => {
    const items: FlattenedLegendItem[] = [];
    const currentRootName = rootLayerName || layer.layerName;

    // Check if layer is visible on the map
    const layerInfo = orderedLayerInfo.find((info) => info.layerPath === layer.layerPath);
    if (!layerInfo?.visible) {
      return items;
    }

    // Check if layer has any meaningful legend content
    const hasVisibleItems = layer.items.some((item) => item.isVisible);
    const hasLayerIcons = layer.icons?.[0]?.iconImage && layer.icons[0].iconImage !== 'no data';
    const hasTimeDimension = Boolean(timeSliderLayers?.[layer.layerPath]?.range?.length);
    const hasChildren = layer.children && layer.children.length > 0;

    // Pre-process children to check if any will be included (prevents empty parent headers)
    const processedChildren: FlattenedLegendItem[] = [];
    if (hasChildren && layer.children) {
      layer.children.forEach((child) => {
        processedChildren.push(...flattenLayer(child, depth + 1, currentRootName));
      });
    }

    // Skip layers with no legend content (like XYZ/vector tiles without symbolization)
    // Allow layers with empty items array (items.length === 0) as they may have symbolization
    // defined that hasn't been processed into items yet
    // Now also checks if children resulted in any items
    const hasEmptyItemsArray = layer.items.length === 0;
    if (!hasVisibleItems && !hasLayerIcons && !hasTimeDimension && processedChildren.length === 0 && !hasEmptyItemsArray) {
      return items;
    }

    // Add the layer itself
    items.push({
      type: depth === 0 ? 'layer' : 'child',
      data: layer,
      depth,
      isRoot: depth === 0,
      parentName: depth === 0 ? undefined : currentRootName,
    });

    // Add time dimension if available
    if (hasTimeDimension) {
      const timeDimension = timeSliderLayers?.[layer.layerPath];
      items.push({
        type: 'time',
        data: layer,
        parentName: currentRootName,
        depth: depth + 1,
        isRoot: false,
        timeInfo: timeDimension,
      });
    }

    // Add layer legend image if available (WMS, esriDynamic, etc.)
    // Only add if there are no visible items to avoid duplication
    if (hasLayerIcons && !hasVisibleItems) {
      items.push({
        type: 'wms',
        data: layer,
        parentName: currentRootName,
        depth: depth + 1,
        isRoot: false,
      });
    }

    // Add visible layer items only
    layer.items.forEach((item) => {
      if (item.isVisible) {
        items.push({
          type: 'item',
          data: { ...layer, items: [item] },
          parentName: currentRootName,
          depth: depth + 1,
          isRoot: false,
        });
      }
    });

    // Add the pre-processed children
    items.push(...processedChildren);

    return items;
  };

  layers.forEach((layer) => {
    allItems.push(...flattenLayer(layer));
  });

  return allItems;
};

/**
 * Even distribution with height-based optimization
 * 1. Distribute layers evenly across columns (preserving order)
 * 2. Calculate actual column heights
 * 3. Move layers from tall columns to adjacent shorter columns to balance
 * @param {FlattenedLegendItem[][]} groups - Groups to distribute (in order)
 * @param {number} numColumns - Number of columns
 * @param {TypeValidPageSizes} pageSize - Page size
 * @param {number} scale - The scale factor based on document width
 * @returns {Object} Distribution with balanced heights, preserving order
 */
const optimizeColumnDistribution = (
  groups: FlattenedLegendItem[][],
  numColumns: number,
  pageSize: TypeValidPageSizes,
  scale = 1
): { columns: FlattenedLegendItem[][]; columnHeights: number[]; overflow: FlattenedLegendItem[] } => {
  // Pre-calculate heights for all items in all groups
  const groupsWithHeights = groups.map((group) => {
    const itemsWithHeights = group.map((item) => ({
      ...item,
      calculatedHeight: item.calculatedHeight || estimateItemHeight(item, pageSize, scale),
    }));
    const totalHeight = itemsWithHeights.reduce((sum, item) => sum + (item.calculatedHeight || 0), 0);
    return {
      group: itemsWithHeights,
      height: totalHeight,
      layerName: group[0]?.data.layerName || 'unknown',
    };
  });

  // STEP 1: Even distribution - distribute groups evenly across columns
  const groupsPerColumn = Math.ceil(groups.length / numColumns);
  const columns: FlattenedLegendItem[][] = Array(numColumns)
    .fill(null)
    .map(() => []);
  const columnHeights: number[] = Array(numColumns).fill(0);

  groupsWithHeights.forEach((groupWithHeight, index) => {
    const columnIndex = Math.floor(index / groupsPerColumn);
    const targetColumn = Math.min(columnIndex, numColumns - 1);

    columns[targetColumn].push(...groupWithHeight.group);
    columnHeights[targetColumn] += groupWithHeight.height;
  });

  logger.logInfo(`Initial even distribution (${groupsPerColumn} groups per column):`);
  columnHeights.forEach((height, index) => {
    const itemCount = columns[index].filter((item) => item.isRoot).length;
    logger.logInfo(`  Column ${index}: ${height.toFixed(1)}px (${itemCount} layers, ${columns[index].length} items)`);
  });

  // STEP 2: Optimize by moving layers from tall columns to adjacent shorter columns
  const maxIterations = 20;
  let iteration = 0;
  let improved = true;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    // Find tallest column
    const maxHeight = Math.max(...columnHeights);
    const maxColIndex = columnHeights.indexOf(maxHeight);
    const minHeight = Math.min(...columnHeights);

    // Stop if columns are reasonably balanced (within 20% of each other)
    const balanceRatio = minHeight / maxHeight;
    if (balanceRatio > 0.8) {
      logger.logInfo(`  Columns are balanced (ratio: ${(balanceRatio * 100).toFixed(1)}%), stopping optimization`);
      break;
    }

    // Try moving last layer from tall column to next column (if exists)
    const layersInMaxCol = columns[maxColIndex].filter((item) => item.isRoot);
    if (layersInMaxCol.length > 1 && maxColIndex < numColumns - 1) {
      const lastLayer = layersInMaxCol[layersInMaxCol.length - 1];
      const lastLayerIndex = columns[maxColIndex].lastIndexOf(lastLayer);

      // Get all items for this layer (layer + its children)
      const layerItems = columns[maxColIndex].slice(lastLayerIndex);
      const layerHeight = layerItems.reduce((sum, item) => sum + (item.calculatedHeight || estimateItemHeight(item, pageSize, scale)), 0);

      // Check if moving to next column would improve balance
      const nextColHeight = columnHeights[maxColIndex + 1];
      const newMaxHeight = columnHeights[maxColIndex] - layerHeight;
      const newNextHeight = nextColHeight + layerHeight;

      // Calculate new max after this move
      const newGlobalMax = Math.max(
        ...columnHeights.map((h, i) => {
          if (i === maxColIndex) return newMaxHeight;
          if (i === maxColIndex + 1) return newNextHeight;
          return h;
        })
      );

      // Move if it reduces the overall maximum height
      if (newGlobalMax < maxHeight) {
        // Move layer to next column (prepend to maintain order)
        columns[maxColIndex].splice(lastLayerIndex);
        columns[maxColIndex + 1] = [...layerItems, ...columns[maxColIndex + 1]];
        columnHeights[maxColIndex] = newMaxHeight;
        columnHeights[maxColIndex + 1] = newNextHeight;
        improved = true;

        logger.logInfo(
          `  Iteration ${iteration}: Moved "${lastLayer.data.layerName}" from Column ${maxColIndex} to ${maxColIndex + 1} ` +
            `(${layerHeight.toFixed(1)}px) - Max height: ${maxHeight.toFixed(1)}px → ${newGlobalMax.toFixed(1)}px`
        );
      }
    }
  }

  // STEP 3: Log final distribution
  logger.logInfo(`Optimized distribution after ${iteration} iterations:`);
  columnHeights.forEach((height, index) => {
    const layerCount = columns[index].filter((item) => item.isRoot).length;
    logger.logInfo(`  Column ${index}: ${height.toFixed(1)}px (${layerCount} layers, ${columns[index].length} items)`);
  });

  return { columns, columnHeights, overflow: [] };
};

/**
 * Group items by their root layer and distribute in the columns
 * @param {FlattenedLegendItem[]} items - The flattened list of legend items to be placed in the legend
 * @param {number} numColumns - The maximum number of columns that can be used
 * @param {TypeValidPageSizes} pageSize - The page size for calculation
 * @param {number} scale - The scale factor based on document width
 * @returns {FlattenedLegendItem[][][]} The flattened legend items distributed into rows and columns
 */
export const distributeIntoColumns = (
  items: FlattenedLegendItem[],
  numColumns: number,
  pageSize: TypeValidPageSizes,
  scale = 1
): { fittedColumns: FlattenedLegendItem[][]; overflowItems: FlattenedLegendItem[] } => {
  if (!items || items.length === 0) return { fittedColumns: Array(numColumns).fill([]), overflowItems: [] };

  // Group items by root layers
  const groups: FlattenedLegendItem[][] = [];
  let currentGroup: FlattenedLegendItem[] = [];

  items.forEach((item) => {
    if (item.isRoot && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(item);
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Use row-based packing algorithm for optimal distribution
  const { columns, overflow } = optimizeColumnDistribution(groups, numColumns, pageSize, scale);

  return { fittedColumns: columns, overflowItems: overflow };
};

/**
 * Gathers information about the map for sizing and creates the map image url for placement in the layout
 * @param {string} mapId - The map ID
 * @param {TypeValidPageSizes} pageSize - The page size for aspect ratio
 * @param {string} disclaimer - The disclaimer text
 * @param {string} title - The title text
 * @returns {TypeMapInfoResult} The map image data URL and browser canvas size
 */
export async function getMapInfo(
  mapId: string,
  pageSize: TypeValidPageSizes,
  disclaimer: string,
  title: string
): Promise<TypeMapInfoResult> {
  // Get all needed data from store state
  const mapElement = AppEventProcessor.getGeoviewHTMLElement(mapId);
  const mapState = MapEventProcessor.getMapStateForExportLayout(mapId);
  const { northArrow, northArrowElement, attribution, mapRotation, mapScale } = mapState;

  // Get browser map dimensions first for AUTO mode
  const viewport = mapElement.getElementsByClassName('ol-viewport')[0];
  const browserCanvas = viewport.querySelector('canvas:not(.ol-overviewmap canvas)') as HTMLCanvasElement;
  const browserMapWidth = browserCanvas ? browserCanvas.width : 800;
  const browserMapHeight = browserCanvas ? browserCanvas.height : 600;

  // Adjust map to correct aspect ratio for PDF map
  let mapImageWidth = MAP_IMAGE_DIMENSIONS[pageSize].width;
  let mapImageHeight = MAP_IMAGE_DIMENSIONS[pageSize].height;

  // For AUTO mode, use exact browser dimensions to maintain same extent
  if (pageSize === 'AUTO') {
    mapImageWidth = browserMapWidth;
    mapImageHeight = browserMapHeight;
    // Update MAP_IMAGE_DIMENSIONS for AUTO mode
    MAP_IMAGE_DIMENSIONS.AUTO.width = browserMapWidth;
    MAP_IMAGE_DIMENSIONS.AUTO.height = browserMapHeight;
  }

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = mapImageWidth;
  resultCanvas.height = mapImageHeight;
  const resultContext = resultCanvas.getContext('2d');

  if (!resultContext) throw new Error('Canvas context not available');

  // Apply rotation if needed
  if (mapRotation !== 0) {
    resultContext.save();
    resultContext.translate(mapImageWidth / 2, mapImageHeight / 2);
    resultContext.rotate(mapRotation);
  }

  let actualBrowserMapWidth;

  // GV This tries it's best to fit the map image into the canvas. However;
  // GV.Cont at close to 45 degrees, there will be unfetched tiles in the corners
  Array.prototype.forEach.call(viewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
    const isOverviewCanvas = canvas.closest('.ol-overviewmap');
    if (!isOverviewCanvas && canvas.width > 0) {
      const { opacity } = (canvas.parentNode as HTMLElement).style;
      resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

      // Calculate scaling for the map
      actualBrowserMapWidth = canvas.width;
      const scaleX = mapImageWidth / canvas.width;
      const scaleY = mapImageHeight / canvas.height;
      const canvasScale = Math.max(scaleX, scaleY); // Fill completely, may crop edges

      const scaledWidth = canvas.width * canvasScale;
      const scaledHeight = canvas.height * canvasScale;

      if (mapRotation !== 0) {
        // Rotated: draw centered at origin (coordinate system already translated)
        resultContext.drawImage(canvas, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      } else {
        // Not rotated: calculate offset to center in canvas
        const offsetX = (mapImageWidth - scaledWidth) / 2;
        const offsetY = (mapImageHeight - scaledHeight) / 2;
        resultContext.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
      }
    }
  });

  // Calculate scale line width
  const pdfScaleFactor = actualBrowserMapWidth! / mapImageWidth;
  const pdfScaleWidth = Math.round(parseFloat(mapScale.lineWidthMetric) * pdfScaleFactor);
  const scaleLineWidth = `${pdfScaleWidth}px`;

  // Restore context if rotated
  if (mapRotation !== 0) {
    resultContext.restore();
  }

  // Get all other state data
  const legendLayers = LegendEventProcessor.getLegendLayers(mapId).filter(
    (layer) => layer.layerStatus === 'loaded' && (layer.items.length === 0 || layer.items.some((item) => item.isVisible))
  );
  const orderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(mapId);
  let timeSliderLayers = undefined;
  if (TimeSliderEventProcessor.isTimeSliderInitialized(mapId)) {
    timeSliderLayers = TimeSliderEventProcessor.getTimeSliderLayers(mapId);
  }

  // Get rotation angle for north arrow
  const currentRotation = (mapRotation * 180) / Math.PI;
  const rotationAngle = parseFloat(northArrowElement.degreeRotation) + currentRotation;

  // Generate north arrow SVG
  let northArrowSvgPaths = null;
  if (northArrow) {
    try {
      const ReactDOMServer = await import('react-dom/server');
      const { NorthArrowIcon } = await import('@/core/components/north-arrow/north-arrow-icon');

      const iconString = ReactDOMServer.renderToString(createElement(NorthArrowIcon, { width: 24, height: 24 }));
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(iconString, 'image/svg+xml');
      const paths = svgDoc.querySelectorAll('path');

      if (paths.length > 0) {
        northArrowSvgPaths = Array.from(paths).map((path) => ({
          d: path.getAttribute('d'),
          fill: path.getAttribute('fill'),
          stroke: path.getAttribute('stroke'),
          strokeWidth: path.getAttribute('stroke-width'),
        }));
      }
    } catch (error) {
      logger.logError(error);
      northArrowSvgPaths = null;
    }
  }

  // Clean legend data
  const cleanLegendLayers = legendLayers.map((layer) => ({
    ...layer,
    layerName: layer.layerName,
    items: layer.items
      .filter((item) => item && item.name)
      .map((item) => ({
        ...item,
        name: item.name,
        icon: item.icon || null,
      })),
  }));

  // Process legend data
  const config = PAGE_CONFIGS[pageSize];
  const allItems = processLegendLayers(cleanLegendLayers, orderedLayerInfo, timeSliderLayers);

  // Calculate scale factor for WMS images based on document width
  const wmsScale = mapImageWidth / 612;

  // Pre-calculate WMS image heights with scaling
  const wmsItems = allItems.filter((item) => item.type === 'wms');
  const heightPromises = wmsItems.map((item) =>
    calculateWMSImageHeight(item.data.icons?.[0]?.iconImage || '', wmsScale, item.data.layerName || 'unknown')
  );
  const calculatedHeights = await Promise.all(heightPromises);

  // Create new items array with calculated heights
  const itemsWithHeights = allItems.map((item) => {
    if (item.type === 'wms') {
      const wmsIndex = wmsItems.indexOf(item);
      return { ...item, calculatedHeight: calculatedHeights[wmsIndex] };
    }
    return item;
  });

  // Calculate optimal number of columns based on canvas width to prevent overlapping
  // Always start from 4 columns as the default maximum, not config.legendColumns which may have been modified
  const optimalColumns = calculateOptimalColumns(mapImageWidth, 4);

  // For AUTO format, we need to measure actual heights first, then optimize
  let fittedColumns: FlattenedLegendItem[][];
  let overflowItems: FlattenedLegendItem[];
  let columnWidths: number[] | undefined;
  let finalConfig: TypePageConfig;

  if (pageSize === 'AUTO') {
    // Import styles dynamically (needed for measurement)
    const { getScaledCanvasStyles } = await import('./layout-styles');
    const scaledStyles = getScaledCanvasStyles(mapImageWidth);

    // STEP 1: Group items by root layers
    const groups: FlattenedLegendItem[][] = [];
    let currentGroup: FlattenedLegendItem[] = [];

    itemsWithHeights.forEach((item) => {
      if (item.isRoot && currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(item);
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // STEP 2: Measure each layer group's actual height AND width ONCE
    const dummyContainer = document.createElement('div');
    dummyContainer.style.position = 'absolute';
    dummyContainer.style.left = '-9999px';
    dummyContainer.style.top = '0';
    // Don't constrain width - let it expand naturally
    dummyContainer.style.width = 'max-content';
    dummyContainer.style.visibility = 'hidden';
    dummyContainer.style.pointerEvents = 'none';
    document.body.appendChild(dummyContainer);

    logger.logInfo('Measuring layer group dimensions:');
    // Maximum width per column - WMS images can be up to 500px for text readability
    // For text content, use a reasonable max based on available width
    const maxColumnWidth = Math.min(500, Math.floor(mapImageWidth / optimalColumns) - 20); // Leave room for gaps

    const groupHeights = groups.map((group) => {
      const groupDiv = document.createElement('div');
      groupDiv.style.display = 'flex';
      groupDiv.style.flexDirection = 'column';
      groupDiv.style.maxWidth = `${maxColumnWidth}px`; // Constrain to max column width
      groupDiv.style.width = 'max-content'; // Natural width up to max

      group.forEach((item, itemIndex) => {
        const indentLevel = Math.min(item.depth, 3);

        if (item.type === 'layer') {
          if (itemIndex > 0) {
            const separator = document.createElement('div');
            Object.assign(separator.style, scaledStyles.layerSeparator('18px'));
            groupDiv.appendChild(separator);
          }
          const layerText = document.createElement('div');
          Object.assign(layerText.style, scaledStyles.layerText());
          layerText.textContent = item.data.layerName || '';
          groupDiv.appendChild(layerText);
        } else if (item.type === 'wms') {
          const wmsContainer = document.createElement('div');
          Object.assign(wmsContainer.style, {
            marginLeft: `${indentLevel * 10}px`,
            marginBottom: `${SHARED_STYLES.wmsMarginBottom}px`,
            maxWidth: '500px',
            width: '100%',
          });
          const img = document.createElement('img');
          img.src = item.data.icons?.[0]?.iconImage || '';
          Object.assign(img.style, {
            maxWidth: '100%', // Fit within container (max 500px)
            width: 'auto',
            height: 'auto',
            display: 'block',
          });
          wmsContainer.appendChild(img);
          groupDiv.appendChild(wmsContainer);
        } else if (item.type === 'time') {
          const timeText = document.createElement('div');
          Object.assign(timeText.style, scaledStyles.timeText(indentLevel));
          const timeValue = item.timeInfo?.singleHandle
            ? DateMgt.formatDate(
                new Date(item.timeInfo.values[0]),
                item.timeInfo.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
              )
            : `${DateMgt.formatDate(
                new Date(item.timeInfo?.values[0] || 0),
                item.timeInfo?.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
              )} - ${DateMgt.formatDate(
                new Date(item.timeInfo?.values[1] || 0),
                item.timeInfo?.displayPattern?.[1] === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
              )}`;
          timeText.textContent = timeValue;
          groupDiv.appendChild(timeText);
        } else if (item.type === 'child') {
          const childText = document.createElement('div');
          Object.assign(childText.style, scaledStyles.childText(indentLevel));
          childText.textContent = item.data.layerName || '...';
          groupDiv.appendChild(childText);
        } else {
          const legendItem = item.data.items[0];
          const itemContainer = document.createElement('div');
          Object.assign(itemContainer.style, {
            display: 'flex',
            alignItems: 'center',
            marginLeft: `${indentLevel * 10}px`,
            marginBottom: `${SHARED_STYLES.itemMarginBottom}px`,
          });

          if (legendItem?.icon) {
            const icon = document.createElement('img');
            icon.src = legendItem.icon;
            const dimensions = getPNGDimensions(legendItem.icon);
            if (dimensions) {
              const minSize = 4;
              icon.style.width = `${Math.max(dimensions.width, minSize)}px`;
              icon.style.height = `${Math.max(dimensions.height, minSize)}px`;
            } else {
              icon.style.width = '8px';
              icon.style.height = '8px';
            }
            icon.style.marginRight = '4px';
            itemContainer.appendChild(icon);
          }

          const text = document.createElement('span');
          Object.assign(text.style, scaledStyles.itemText);
          text.textContent = legendItem?.name || '';
          itemContainer.appendChild(text);
          groupDiv.appendChild(itemContainer);
        }
      });

      dummyContainer.appendChild(groupDiv);
      const { height, width } = groupDiv.getBoundingClientRect();
      dummyContainer.removeChild(groupDiv);

      const layerName = group[0]?.data.layerName || 'unknown';
      logger.logInfo(`  Layer "${layerName}": ${height.toFixed(1)}px × ${width.toFixed(1)}px (${group.length} items)`);

      return { group, height, width, layerName };
    });

    document.body.removeChild(dummyContainer);
    logger.logInfo(`Measured ${groupHeights.length} layer groups`);

    // STEP 3: Calculate required column width and verify number of columns fits
    // Each column width = widest layer in that column
    // We need to ensure all columns fit within available width
    const columnGap = 10; // Gap between columns (matches CSS gap in renderLegendColumns)
    const calculateColumnsAndWidths = (numCols: number): { cols: FlattenedLegendItem[][]; colWidths: number[]; totalWidth: number } => {
      const groupsPerCol = Math.ceil(groups.length / numCols);
      const cols: FlattenedLegendItem[][] = Array(numCols)
        .fill(null)
        .map(() => []);
      const colWidths: number[] = Array(numCols).fill(0);

      // Distribute groups
      groupHeights.forEach((gh, index) => {
        const colIndex = Math.min(Math.floor(index / groupsPerCol), numCols - 1);
        cols[colIndex].push(...gh.group);
        colWidths[colIndex] = Math.max(colWidths[colIndex], gh.width);
      });

      // Total width = sum of column widths + gaps between columns
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + (numCols - 1) * columnGap;
      return { cols, colWidths, totalWidth };
    };

    // Start with optimal columns and reduce if needed
    let finalColumns = optimalColumns;
    let result = calculateColumnsAndWidths(finalColumns);

    while (result.totalWidth > mapImageWidth && finalColumns > 1) {
      finalColumns--;
      result = calculateColumnsAndWidths(finalColumns);
      logger.logInfo(`Reducing to ${finalColumns} columns (total width: ${result.totalWidth.toFixed(1)}px)`);
    }

    logger.logInfo(
      `Using ${finalColumns} columns with widths: [${result.colWidths.map((w) => w.toFixed(1)).join(', ')}]px (total: ${result.totalWidth.toFixed(1)}px)`
    );

    // STEP 4: Initial even distribution using measured heights
    const groupsPerColumn = Math.ceil(groups.length / finalColumns);
    const columns: FlattenedLegendItem[][] = Array(finalColumns)
      .fill(null)
      .map(() => []);
    const columnHeights: number[] = Array(finalColumns).fill(0);
    const localColumnWidths: number[] = Array(finalColumns).fill(0);

    groupHeights.forEach((groupWithHeight, index) => {
      const columnIndex = Math.floor(index / groupsPerColumn);
      const targetColumn = Math.min(columnIndex, finalColumns - 1);

      columns[targetColumn].push(...groupWithHeight.group);
      columnHeights[targetColumn] += groupWithHeight.height;
      localColumnWidths[targetColumn] = Math.max(localColumnWidths[targetColumn], groupWithHeight.width);
    });

    // Fill empty columns by moving last layer from previous columns
    for (let col = finalColumns - 1; col >= 0; col--) {
      if (columnHeights[col] === 0 && col > 0) {
        // Find the nearest previous column with more than 1 layer
        for (let prevCol = col - 1; prevCol >= 0; prevCol--) {
          const layersInPrevCol = columns[prevCol].filter((item) => item.isRoot);
          if (layersInPrevCol.length > 1) {
            // Move last layer from prevCol to empty col
            const lastLayer = layersInPrevCol[layersInPrevCol.length - 1];
            const lastLayerIndex = columns[prevCol].lastIndexOf(lastLayer);
            const layerItems = columns[prevCol].slice(lastLayerIndex);

            // Find height and width
            const layerGroup = groupHeights.find((g) => g.group[0] === lastLayer);
            if (layerGroup) {
              const layerHeight = layerGroup.height;
              const layerWidth = layerGroup.width;

              // Move items
              columns[prevCol].splice(lastLayerIndex);
              columns[col] = [...layerItems, ...columns[col]];

              // Update heights
              columnHeights[prevCol] -= layerHeight;
              columnHeights[col] += layerHeight;

              // Update widths (recalculate max width for both columns)
              localColumnWidths[prevCol] = Math.max(
                ...columns[prevCol].filter((item) => item.isRoot).map((item) => groupHeights.find((g) => g.group[0] === item)?.width || 0)
              );
              localColumnWidths[col] = Math.max(localColumnWidths[col], layerWidth);

              logger.logInfo(`  Moved "${lastLayer.data.layerName}" from Column ${prevCol} to ${col} to fill empty column`);
              break;
            }
          }
        }
      }
    }

    logger.logInfo(`Initial distribution after filling empty columns (${groupsPerColumn} groups per column):`);
    columnHeights.forEach((height, index) => {
      const layerCount = columns[index].filter((item) => item.isRoot).length;
      logger.logInfo(
        `  Column ${index}: ${height.toFixed(1)}px × ${localColumnWidths[index].toFixed(1)}px (${layerCount} layers, ${columns[index].length} items)`
      );
    });

    // STEP 5: Optimize using pre-measured heights with 2-step look-ahead
    const maxIterations = 20;
    let iteration = 0;
    let improved = true;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      const maxHeight = Math.max(...columnHeights);
      const minHeight = Math.min(...columnHeights);
      const balanceRatio = minHeight / maxHeight;

      if (balanceRatio > 0.8) {
        logger.logInfo(`  Columns balanced (ratio: ${(balanceRatio * 100).toFixed(1)}%), stopping at iteration ${iteration}`);
        break;
      }

      // Strategy: Try all possible 1-step and 2-step move sequences
      // Find the sequence that most reduces imbalance
      let bestSequence: Array<{ fromCol: number; toCol: number; layerName: string }> | null = null;
      let bestFinalImbalance = maxHeight - minHeight;

      // Try all single moves
      for (let fromCol1 = 0; fromCol1 < finalColumns - 1; fromCol1++) {
        const layersInCol1 = columns[fromCol1].filter((item) => item.isRoot);
        if (layersInCol1.length <= 1) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const layer1 = layersInCol1[layersInCol1.length - 1];
        const group1 = groupHeights.find((g) => g.group[0] === layer1);
        if (!group1) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Simulate first move
        const heights1 = [...columnHeights];
        heights1[fromCol1] -= group1.height;
        heights1[fromCol1 + 1] += group1.height;

        const imbalance1 = Math.max(...heights1) - Math.min(...heights1);

        // Check if single move is better
        if (imbalance1 < bestFinalImbalance) {
          bestFinalImbalance = imbalance1;
          bestSequence = [{ fromCol: fromCol1, toCol: fromCol1 + 1, layerName: layer1.data.layerName }];
        }

        // Now try a second move after this first move
        // Need to simulate the column state after move 1
        const tempColumns = columns.map((col, idx) => {
          if (idx === fromCol1) {
            // Remove last layer
            const lastLayerIdx = col.lastIndexOf(layer1);
            return col.slice(0, lastLayerIdx);
          }
          if (idx === fromCol1 + 1) {
            // Add layer at beginning
            const lastLayerIdx = columns[fromCol1].lastIndexOf(layer1);
            const layerItems = columns[fromCol1].slice(lastLayerIdx);
            return [...layerItems, ...col];
          }
          return col;
        });

        // Try all possible second moves from this new state
        for (let fromCol2 = 0; fromCol2 < finalColumns - 1; fromCol2++) {
          const layersInCol2 = tempColumns[fromCol2].filter((item) => item.isRoot);
          if (layersInCol2.length <= 1) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const layer2 = layersInCol2[layersInCol2.length - 1];
          const group2 = groupHeights.find((g) => g.group[0] === layer2);
          if (!group2) {
            // eslint-disable-next-line no-continue
            continue;
          }

          // Simulate second move
          const heights2 = [...heights1];
          heights2[fromCol2] -= group2.height;
          heights2[fromCol2 + 1] += group2.height;

          const imbalance2 = Math.max(...heights2) - Math.min(...heights2);

          // Check if 2-step sequence is better
          if (imbalance2 < bestFinalImbalance) {
            bestFinalImbalance = imbalance2;
            bestSequence = [
              { fromCol: fromCol1, toCol: fromCol1 + 1, layerName: layer1.data.layerName },
              { fromCol: fromCol2, toCol: fromCol2 + 1, layerName: layer2.data.layerName },
            ];
          }
        }
      }

      // Execute best sequence if found and it improves things
      const currentImbalance = maxHeight - minHeight;
      if (bestSequence && bestFinalImbalance < currentImbalance) {
        for (const move of bestSequence) {
          const { fromCol, toCol } = move;
          const layersInCol = columns[fromCol].filter((item) => item.isRoot);
          const lastLayer = layersInCol[layersInCol.length - 1];
          const lastLayerIndex = columns[fromCol].lastIndexOf(lastLayer);
          const layerGroup = groupHeights.find((g) => g.group[0] === lastLayer);

          if (layerGroup) {
            const layerHeight = layerGroup.height;
            const layerWidth = layerGroup.width;
            const layerItems = columns[fromCol].slice(lastLayerIndex);

            // Move items
            columns[fromCol].splice(lastLayerIndex);
            columns[toCol] = [...layerItems, ...columns[toCol]];

            // Update heights
            columnHeights[fromCol] -= layerHeight;
            columnHeights[toCol] += layerHeight;

            // Update widths (recalculate max width for both columns)
            localColumnWidths[fromCol] = Math.max(
              0,
              ...columns[fromCol].filter((item) => item.isRoot).map((item) => groupHeights.find((g) => g.group[0] === item)?.width || 0)
            );
            localColumnWidths[toCol] = Math.max(localColumnWidths[toCol], layerWidth);
          }
        }

        improved = true;
        const newMax = Math.max(...columnHeights);
        const newMin = Math.min(...columnHeights);
        const moveDesc = bestSequence.map((m) => `${m.layerName}(${m.fromCol}→${m.toCol})`).join(', ');
        logger.logInfo(
          `  Iteration ${iteration}: ${bestSequence.length}-step: ${moveDesc} - ` +
            `Imbalance: ${currentImbalance.toFixed(1)}px → ${(newMax - newMin).toFixed(1)}px`
        );
      }
    }

    logger.logInfo(`Final optimized distribution after ${iteration} iterations:`);
    columnHeights.forEach((height, idx) => {
      const layerCount = columns[idx].filter((item) => item.isRoot).length;
      logger.logInfo(
        `  Column ${idx}: ${height.toFixed(1)}px × ${localColumnWidths[idx].toFixed(1)}px (${layerCount} layers, ${columns[idx].length} items)`
      );
    });

    fittedColumns = columns;
    columnWidths = localColumnWidths; // Assign local columnWidths to outer scope
    overflowItems = [];

    // Use the final optimized heights for document layout
    const legendHeight = Math.max(...columnHeights, 0);
    logger.logInfo(`Legend height (max column): ${legendHeight}px`);

    // Scale components outside the flex legend container
    const footerHeight = estimateFooterHeight(disclaimer, attribution) * wmsScale;
    const titleHeight = title && title.trim() ? (SHARED_STYLES.titleFontSize + SHARED_STYLES.titleMarginBottom) * wmsScale : 0;
    const mapHeight = mapImageHeight + SHARED_STYLES.mapMarginBottom * wmsScale;
    const scaleHeight = (SHARED_STYLES.scaleFontSize + SHARED_STYLES.scaleMarginBottom + SHARED_STYLES.legendMarginTop) * wmsScale;
    const dividerHeight = (SHARED_STYLES.dividerHeight + SHARED_STYLES.dividerMargin * 2) * wmsScale;

    logger.logInfo(
      `Component heights - Title: ${titleHeight}, Map: ${mapHeight}, Scale: ${scaleHeight}, Divider: ${dividerHeight}, Footer: ${footerHeight}`
    );

    // Calculate total document height
    const calculatedHeight =
      titleHeight +
      mapHeight +
      scaleHeight +
      dividerHeight +
      legendHeight +
      SHARED_STYLES.legendMarginBottom +
      footerHeight +
      SHARED_STYLES.padding * 2 * wmsScale +
      20;
    logger.logInfo(`Total calculated height: ${calculatedHeight}px (padding: ${SHARED_STYLES.padding * 2 * wmsScale})`);

    finalConfig = {
      size: 'AUTO' as const,
      mapHeight: config.mapHeight,
      legendColumns: optimalColumns,
      maxLegendHeight: Infinity,
      canvasWidth: mapImageWidth,
      canvasHeight: Math.ceil(calculatedHeight),
    };
  } else {
    // Non-AUTO mode: use estimate-based distribution
    const distribution = distributeIntoColumns(itemsWithHeights, optimalColumns, pageSize, wmsScale);
    ({ fittedColumns, overflowItems } = distribution);
    finalConfig = config;
  }

  // For AUTO mode, merge overflow items back into main columns to prevent page breaks
  let fittedOverflowItems;
  if (pageSize === 'AUTO' && overflowItems && overflowItems.length > 0) {
    // Calculate current column heights
    const columnHeights = fittedColumns.map((column) => {
      let height = 0;

      column.forEach((item, itemIndex) => {
        if (itemIndex > 0 && item.type === 'layer') {
          height += SHARED_STYLES.layerMarginTop;
        }
        height += item.calculatedHeight || estimateItemHeight(item, pageSize, wmsScale);
      });

      return height;
    });

    // Add overflow items to the shortest column
    const minColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    fittedColumns[minColumnIndex] = [...(fittedColumns[minColumnIndex] || []), ...overflowItems];

    // Recalculate canvas height after merging overflow items
    const newColumnHeights = fittedColumns.map((column) => {
      let height = 0;

      column.forEach((item, itemIndex) => {
        if (itemIndex > 0 && item.type === 'layer') {
          height += SHARED_STYLES.layerMarginTop;
        }
        height += item.calculatedHeight || estimateItemHeight(item, pageSize, wmsScale);
      });

      return height;
    });

    const newLegendHeight = Math.max(...newColumnHeights, 0);

    // Recalculate total height with new legend height (using same scaling as before)
    const footerHeight = estimateFooterHeight(disclaimer, attribution) * wmsScale;
    const titleHeight = title && title.trim() ? (SHARED_STYLES.titleFontSize + SHARED_STYLES.titleMarginBottom) * wmsScale : 0;
    const mapHeight = mapImageHeight + SHARED_STYLES.mapMarginBottom * wmsScale;
    const scaleHeight = (SHARED_STYLES.scaleFontSize + SHARED_STYLES.scaleMarginBottom + SHARED_STYLES.legendMarginTop) * wmsScale;
    const dividerHeight = (SHARED_STYLES.dividerHeight + SHARED_STYLES.dividerMargin * 2) * wmsScale;

    const recalculatedHeight =
      titleHeight +
      mapHeight +
      scaleHeight +
      dividerHeight +
      newLegendHeight +
      SHARED_STYLES.legendMarginBottom +
      footerHeight +
      SHARED_STYLES.padding * 2 * wmsScale;

    finalConfig.canvasHeight = Math.ceil(recalculatedHeight);
  } else if (overflowItems && overflowItems.length > 0 && pageSize !== 'AUTO') {
    const distributedOverflow = distributeIntoColumns(overflowItems, finalConfig.legendColumns, pageSize, wmsScale);
    fittedOverflowItems = distributedOverflow.fittedColumns;
  }

  // Update PAGE_CONFIGS for AUTO format to ensure canvas layout gets correct dimensions
  if (pageSize === 'AUTO') {
    PAGE_CONFIGS.AUTO = {
      size: 'AUTO' as const,
      mapHeight: finalConfig.mapHeight,
      legendColumns: finalConfig.legendColumns,
      maxLegendHeight: finalConfig.maxLegendHeight,
      canvasWidth: finalConfig.canvasWidth,
      canvasHeight: finalConfig.canvasHeight,
    };
    logger.logInfo(`Final AUTO page config - Width: ${finalConfig.canvasWidth}px, Height: ${finalConfig.canvasHeight}px`);
  }

  logger.logInfo(
    `Returning map info - Columns: ${fittedColumns.length}, Total items: ${fittedColumns.reduce((sum, col) => sum + col.length, 0)}`
  );

  return {
    mapDataUrl: resultCanvas.toDataURL('image/jpeg', 0.98),
    scaleText: `${mapScale.labelGraphicMetric} (approx)`,
    scaleLineWidth,
    northArrowSvg: northArrowSvgPaths,
    northArrowRotation: rotationAngle,
    attributions: attribution,
    fittedColumns,
    columnWidths: pageSize === 'AUTO' ? columnWidths : undefined,
    fittedOverflowItems,
  };
}
