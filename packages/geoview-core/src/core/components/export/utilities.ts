import { createElement } from 'react';
import { Buffer } from 'buffer';

import type { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
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
    const marginValue = itemIndex > 0 ? '8px' : 0;
    const pdfMarginValue = itemIndex > 0 ? 8 : 0;
    return createElement(
      Text,
      {
        key: `layer-${item.data.layerPath}-${itemIndex}`,
        style: scaledStyles.layerText(typeof marginValue === 'string' ? marginValue : pdfMarginValue),
      },
      item.data.layerName
    );
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
  return createElement(
    View,
    {
      key: `item-${item.parentName}-${legendItem?.name}-${itemIndex}`,
      style: baseStyles.itemContainer(indentLevel),
    },
    legendItem?.icon && createElement(Image, { src: legendItem.icon, style: scaledStyles.itemIcon }),
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
      while (contentEnd < column.length && column[contentEnd].depth > currentDepth) {
        // Only collect items at the immediate next level for wrapping
        if (column[contentEnd].depth === currentDepth + 1) {
          contentEnd++;
        } else {
          // This is a deeper nested item, skip to find where this group ends
          break;
        }
      }

      // If we have direct children, check if they are content items (not child layers)
      if (contentEnd > contentStart) {
        const hasContentItems = column
          .slice(contentStart, contentEnd)
          .some((childItem) => childItem.type === 'wms' || childItem.type === 'item' || childItem.type === 'time');

        if (hasContentItems) {
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
          // Only child layers, no content to wrap - will be handled in next iteration
          i++;
        }
      } else {
        // No content, just move to next item
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
  baseStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element => {
  const { View } = factory;

  return createElement(
    View,
    { style: { display: 'flex', flexDirection: 'row', gap: 10, width: '100%' } },
    ...columns.map((column, colIndex) => {
      const columnKey = column.length > 0 ? `col-${column[0].data.layerPath}-${colIndex}` : `col-empty-${colIndex}`;
      return createElement(
        View,
        {
          key: columnKey,
          style: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
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
  return new Promise((resolve) => {
    const img = new Image();

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

    // Missing URL fallback
    if (!imageUrl) {
      const scaledMargin = SHARED_STYLES.wmsMarginBottom * scale;
      const fallbackHeight = 100 * scale + scaledMargin;
      logger.logWarning(`WMS Image "${layerName}" has no URL, using fallback: ${Math.round(fallbackHeight)}px`);
      resolve(fallbackHeight);
    } else {
      img.src = imageUrl;
    }
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

  // Estimate disclaimer lines (assuming ~100 chars per line at font size 8, increased from 80)
  const disclaimerLines = disclaimer ? Math.ceil(disclaimer.length / 100) : 0;
  const disclaimerHeight = disclaimerLines * baseLineHeight + (disclaimerLines > 0 ? marginBottom : 0);

  // Estimate attribution lines
  const attributionHeight = attributions.reduce((total, attr) => {
    const lines = Math.ceil(attr.length / 100);
    return total + lines * baseLineHeight + SHARED_STYLES.footerItemMarginBottom;
  }, 0);

  // Date line
  const dateHeight = baseLineHeight;

  // Total without extra padding - the footer paddingTop is already in CSS
  const totalHeight = disclaimerHeight + attributionHeight + dateHeight;

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
    const hasWMSLegend = layer.type === CONST_LAYER_TYPES.WMS && layer.icons?.[0]?.iconImage && layer.icons[0].iconImage !== 'no data';
    const hasTimeDimension = Boolean(timeSliderLayers?.[layer.layerPath]?.range?.length);
    const hasChildren = layer.children && layer.children.length > 0;

    // Skip layers with no legend content (like XYZ/vector tiles without symbolization)
    if (!hasVisibleItems && !hasWMSLegend && !hasTimeDimension && !hasChildren) {
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

    // Add WMS legend image if available
    if (hasWMSLegend) {
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

    // Recursively add children
    if (layer.children) {
      layer.children.forEach((child) => {
        items.push(...flattenLayer(child, depth + 1, currentRootName));
      });
    }

    return items;
  };

  layers.forEach((layer) => {
    allItems.push(...flattenLayer(layer));
  });

  return allItems;
};

/**
 * Round-robin distribution algorithm that preserves layer order
 * Pre-calculates all item heights, then distributes groups sequentially across columns
 * This maintains the original layer order when reading top-to-bottom, left-to-right
 * @param {FlattenedLegendItem[][]} groups - Groups to distribute
 * @param {number} numColumns - Number of columns
 * @param {TypeValidPageSizes} pageSize - Page size
 * @param {number} scale - The scale factor based on document width
 * @returns {Object} Distribution that preserves layer order
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
      id: `${group[0]?.data.layerPath || ''}-${Math.random()}`, // Unique ID for tracking
    };
  });

  // Use round-robin distribution to preserve layer order
  const columns: FlattenedLegendItem[][] = Array(numColumns)
    .fill(null)
    .map(() => []);
  const columnHeights: number[] = Array(numColumns).fill(0);

  // Distribute groups sequentially across columns (round-robin)
  groupsWithHeights.forEach((groupWithHeight, index) => {
    const columnIndex = index % numColumns;
    columns[columnIndex].push(...groupWithHeight.group);
    columnHeights[columnIndex] += groupWithHeight.height;
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

  // First distribute items into columns using optimal column count
  const { fittedColumns, overflowItems } = distributeIntoColumns(itemsWithHeights, optimalColumns, pageSize, wmsScale);

  // For AUTO format, calculate required height based on actual column distribution
  let finalConfig: TypePageConfig = config;

  if (pageSize === 'AUTO') {
    // Calculate each column's height for layout
    const columnHeights = fittedColumns.map((column) => {
      let height = 0;

      column.forEach((item, itemIndex) => {
        // Add layerMarginTop for all layers except the first item in column
        if (itemIndex > 0 && item.type === 'layer') {
          height += SHARED_STYLES.layerMarginTop;
        }

        const itemHeight = item.calculatedHeight || estimateItemHeight(item, pageSize, wmsScale);
        height += itemHeight;
      });

      return height;
    });

    // Legend height is the tallest column
    const legendHeight = Math.max(...columnHeights, 0);

    // Scale components outside the flex legend container
    // Legend items NOT scaled (CSS handles via flex), other components scaled
    const footerHeight = estimateFooterHeight(disclaimer, attribution) * wmsScale;
    const titleHeight = title && title.trim() ? (SHARED_STYLES.titleFontSize + SHARED_STYLES.titleMarginBottom) * wmsScale : 0;
    const mapHeight = mapImageHeight + SHARED_STYLES.mapMarginBottom * wmsScale;
    const scaleHeight = (SHARED_STYLES.scaleFontSize + SHARED_STYLES.scaleMarginBottom + SHARED_STYLES.legendMarginTop) * wmsScale;
    const dividerHeight = (SHARED_STYLES.dividerHeight + SHARED_STYLES.dividerMargin * 2) * wmsScale;

    // Calculate total document height
    const calculatedHeight =
      titleHeight +
      mapHeight +
      scaleHeight +
      dividerHeight +
      legendHeight +
      SHARED_STYLES.legendMarginBottom +
      footerHeight +
      SHARED_STYLES.padding * 2 * wmsScale;

    finalConfig = {
      size: 'AUTO' as const,
      mapHeight: config.mapHeight,
      legendColumns: optimalColumns,
      maxLegendHeight: Infinity,
      canvasWidth: mapImageWidth,
      canvasHeight: Math.ceil(calculatedHeight),
    };
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
  }

  return {
    mapDataUrl: resultCanvas.toDataURL('image/jpeg', 0.98),
    scaleText: `${mapScale.labelGraphicMetric} (approx)`,
    scaleLineWidth,
    northArrowSvg: northArrowSvgPaths,
    northArrowRotation: rotationAngle,
    attributions: attribution,
    fittedColumns,
    fittedOverflowItems,
  };
}
