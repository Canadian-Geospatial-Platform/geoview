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
 * Calculate actual WMS image height based on aspect ratio
 * @param {string} imageUrl - The image url
 * @param {number} scale - The scale factor based on document width
 * @returns {Promise<number>} The calculated height
 */
const calculateWMSImageHeight = (imageUrl: string | undefined, scale = 1): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = SHARED_STYLES.wmsImageWidth * scale;
      const maxHeight = SHARED_STYLES.wmsImageMaxHeight * scale;

      // Use real image dimensions, constrained by max width and height
      const widthScale = maxWidth / img.width;
      const heightScale = maxHeight / img.height;
      const imageScale = Math.min(widthScale, heightScale, 1); // Don't scale up

      const scaledHeight = img.height * imageScale;

      resolve(scaledHeight + SHARED_STYLES.wmsMarginBottom);
    };
    img.onerror = () => resolve(SHARED_STYLES.wmsImageMaxHeight * scale + SHARED_STYLES.wmsMarginBottom);
    if (!imageUrl) {
      resolve(SHARED_STYLES.wmsImageMaxHeight * scale + SHARED_STYLES.wmsMarginBottom);
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
 * Estimate item heights (rough approximation)
 * @param {FlattenedLegendItem} item - The item to get the estimate height for
 * @param {TypeValidPageSizes} pageSize - The page size
 * @param {number} scale - The scale factor based on document width (default 1)
 * @returns {number} The estimated height
 */
const estimateItemHeight = (item: FlattenedLegendItem, pageSize: TypeValidPageSizes, scale = 1): number => {
  // Calculate column width based on page size and number of columns
  const config = PAGE_CONFIGS[pageSize];
  const availableWidth = config.canvasWidth - SHARED_STYLES.padding * 2 - SHARED_STYLES.legendGap * (config.legendColumns - 1);
  const columnWidth = availableWidth / config.legendColumns;

  switch (item.type) {
    case 'layer': {
      const textHeight = estimateTextHeight(item.data.layerName || '', SHARED_STYLES.layerFontSize, columnWidth);
      // layerText has marginBottom always, but marginTop is 0 for first item and 8px for others
      // We return just the base height here, marginTop will be added separately in column calculation
      return textHeight + SHARED_STYLES.layerMarginBottom;
    }
    case 'child':
      return SHARED_STYLES.childFontSize + SHARED_STYLES.childMarginBottom + SHARED_STYLES.childMarginTop;
    case 'wms': {
      return item.calculatedHeight || SHARED_STYLES.wmsImageMaxHeight * scale + SHARED_STYLES.wmsMarginBottom;
    }
    case 'time':
      return SHARED_STYLES.timeFontSize + SHARED_STYLES.timeMarginBottom + 3; // Line-height spacing
    case 'item':
      return SHARED_STYLES.itemFontSize + SHARED_STYLES.itemMarginBottom + 2; // Line-height spacing
    default:
      return SHARED_STYLES.itemFontSize + SHARED_STYLES.itemMarginBottom + 2;
  }
};

/**
 * Calculate the per-item correction factor based on canvas width
 * The base value of 15px was calibrated for a 1275px width canvas
 * @param {number} canvasWidth - The canvas width
 * @returns {number} The correction factor per item
 */
const calculateItemCorrectionFactor = (canvasWidth: number): number => {
  const BASE_WIDTH = 1275;
  const BASE_CORRECTION = 15;
  return (canvasWidth / BASE_WIDTH) * BASE_CORRECTION;
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
  const baseLineHeight = SHARED_STYLES.footerFontSize + 4; // 8px font + 4px spacing
  const marginBottom = SHARED_STYLES.footerMarginBottom; // disclaimer margin

  // Estimate disclaimer lines (assuming ~80 chars per line at font size 8)
  const disclaimerLines = disclaimer ? Math.ceil(disclaimer.length / 80) : 0;
  const disclaimerHeight = disclaimerLines * baseLineHeight + (disclaimerLines > 0 ? marginBottom : 0);

  // Estimate attribution lines
  const attributionHeight = attributions.reduce((total, attr) => {
    const lines = Math.ceil(attr.length / 80);
    return total + lines * baseLineHeight + SHARED_STYLES.footerItemMarginBottom;
  }, 0);

  // Date line
  const dateHeight = baseLineHeight;

  // Add padding and margins
  const totalHeight = disclaimerHeight + attributionHeight + dateHeight + SHARED_STYLES.footerBottom; // 20px for margins/padding

  return Math.max(totalHeight, 60); // Minimum 60px
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
 * Check if a group contains wide content that should trigger overflow
 * @param {FlattenedLegendItem[]} group - The group to check
 * @returns {boolean} True if group contains wide content
 */
// const hasWideContent = (group: FlattenedLegendItem[]): boolean => {
//   return group.some((item) => item.type === 'wms');
// };

/**
 * Row-based packing algorithm for optimal column distribution
 * Pre-calculates all item heights, then places tallest groups first and stacks smaller groups when possible
 * @param {FlattenedLegendItem[][]} groups - Groups to distribute
 * @param {number} numColumns - Number of columns
 * @param {TypeValidPageSizes} pageSize - Page size
 * @param {number} scale - The scale factor based on document width
 * @returns {Object} Optimized distribution
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

  // Sort groups by height (tallest first)
  const sortedGroups = [...groupsWithHeights].sort((a, b) => b.height - a.height);

  const columns: FlattenedLegendItem[][] = Array(numColumns)
    .fill(null)
    .map(() => []);
  const columnHeights: number[] = Array(numColumns).fill(0);

  // Place each group one at a time into the shortest column
  sortedGroups.forEach((groupWithHeight) => {
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    columns[shortestColumnIndex].push(...groupWithHeight.group);
    columnHeights[shortestColumnIndex] += groupWithHeight.height;
  });

  return { columns, columnHeights, overflow: [] };
};

/**
 * Group items by their root layer and distribute in the columns
 * @param {FlattenedLegendItem[]} items - The flattened list of legend items to be placed in the legend
 * @param {number} numColumns - The maximum number of columns that can be used
 * @param {number} maxHeight - The maximum height available on the rest of the page
 * @param {string} disclaimer - The disclaimer text to be displayed in the footer (reserved for future use)
 * @param {string[]} attributions - The attributions to be displayed in the footer (reserved for future use)
 * @param {TypeValidPageSizes} pageSize - The page size for calculation
 * @param {number} scale - The scale factor based on document width
 * @param {string} exportTitle - Optional title for reserved space calculation (reserved for future use)
 * @returns {FlattenedLegendItem[][][]} The flattened legend items distributed into rows and columns
 */
export const distributeIntoColumns = (
  items: FlattenedLegendItem[],
  numColumns: number,
  maxLegendHeight: number,
  disclaimer: string,
  attributions: string[],
  pageSize: TypeValidPageSizes,
  scale = 1,
  exportTitle?: string
): { fittedColumns: FlattenedLegendItem[][]; overflowItems: FlattenedLegendItem[] } => {
  if (!items || items.length === 0) return { fittedColumns: Array(numColumns).fill([]), overflowItems: [] };

  // Note: maxLegendHeight, disclaimer, attributions, and exportTitle are reserved for future overflow handling
  void maxLegendHeight;
  void disclaimer;
  void attributions;
  void exportTitle;

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

  // Reserve space for footer - calculated for future overflow handling
  // const footerReservedSpace = estimateFooterHeight(disclaimer, attributions);
  // const titleReservedSpace = exportTitle && exportTitle.trim() ? SHARED_STYLES.titleFontSize + SHARED_STYLES.titleMarginBottom : 0;
  // const adjustedMaxHeight = maxLegendHeight - footerReservedSpace - titleReservedSpace;

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
  const heightPromises = wmsItems.map((item) => calculateWMSImageHeight(item.data.icons?.[0]?.iconImage || '', wmsScale));
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
  const { fittedColumns, overflowItems } = distributeIntoColumns(
    itemsWithHeights,
    optimalColumns,
    Infinity,
    disclaimer,
    attribution,
    pageSize,
    wmsScale,
    title
  );

  // For AUTO format, calculate required height based on actual column distribution
  let finalConfig: TypePageConfig = config;

  if (pageSize === 'AUTO') {
    // Calculate height of each column, including spacing between items
    const itemCorrectionFactor = calculateItemCorrectionFactor(mapImageWidth);
    const columnHeights = fittedColumns.map((column) => {
      let height = 0;

      column.forEach((item, itemIndex) => {
        height += item.calculatedHeight || estimateItemHeight(item, pageSize, wmsScale);

        // Add marginTop for every layer item after the first
        if (itemIndex > 0 && item.type === 'layer') {
          height += SHARED_STYLES.layerMarginTop;
        }
      });

      // Add correction factor for line-height, padding, and box-sizing (scales with width)
      height += column.length * itemCorrectionFactor;

      return height;
    });

    // The legend height is the tallest column, not the sum of all items
    const legendHeight = Math.max(...columnHeights, 0);

    const footerHeight = estimateFooterHeight(disclaimer, attribution);
    const titleHeight = title && title.trim() ? SHARED_STYLES.titleFontSize + SHARED_STYLES.titleMarginBottom : 0;
    const mapHeight = mapImageHeight + SHARED_STYLES.mapMarginBottom;
    const scaleHeight = SHARED_STYLES.scaleFontSize + SHARED_STYLES.scaleMarginBottom + SHARED_STYLES.legendMarginTop;
    const dividerHeight = SHARED_STYLES.dividerHeight + SHARED_STYLES.dividerMargin * 2; // One divider between scale and legend

    // Add extra height buffer for very wide maps where footer needs more vertical space
    // Base 612px needs no extra space, 1530px needs ~100px, scales logarithmically
    const widthBasedBuffer = mapImageWidth > 1224 ? Math.log2(mapImageWidth / 612) * 50 : 0;

    // Calculate total height including all margins
    const calculatedHeight =
      titleHeight +
      mapHeight +
      scaleHeight +
      dividerHeight +
      legendHeight +
      SHARED_STYLES.legendMarginBottom +
      footerHeight +
      widthBasedBuffer +
      SHARED_STYLES.padding * 2;

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
    const itemCorrectionFactor = calculateItemCorrectionFactor(mapImageWidth);

    // Add overflow items to the shortest column (by height) - include item spacing
    const columnHeights = fittedColumns.map((column) => {
      let height = 0;

      column.forEach((item, itemIndex) => {
        height += item.calculatedHeight || estimateItemHeight(item, pageSize, wmsScale);
        if (itemIndex > 0 && item.type === 'layer') {
          height += SHARED_STYLES.layerMarginTop;
        }
      });

      // Add correction factor for underestimated item heights (scales with width)
      height += column.length * itemCorrectionFactor;

      return height;
    });
    const minColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

    fittedColumns[minColumnIndex] = [...(fittedColumns[minColumnIndex] || []), ...overflowItems];

    // Recalculate canvas height after merging overflow items - include item spacing
    const newColumnHeights = fittedColumns.map((column) => {
      let height = 0;

      column.forEach((item, itemIndex) => {
        height += item.calculatedHeight || estimateItemHeight(item, pageSize, wmsScale);
        if (itemIndex > 0 && item.type === 'layer') {
          height += SHARED_STYLES.layerMarginTop;
        }
      });

      // Add correction factor for underestimated item heights (scales with width)
      height += column.length * itemCorrectionFactor;

      return height;
    });
    const newLegendHeight = Math.max(...newColumnHeights, 0);

    const footerHeight = estimateFooterHeight(disclaimer, attribution);
    const titleHeight = title && title.trim() ? SHARED_STYLES.titleFontSize + SHARED_STYLES.titleMarginBottom : 0;
    const mapHeight = mapImageHeight + SHARED_STYLES.mapMarginBottom;
    const scaleHeight = SHARED_STYLES.scaleFontSize + SHARED_STYLES.scaleMarginBottom + SHARED_STYLES.legendMarginTop;
    const dividerHeight = SHARED_STYLES.dividerHeight + SHARED_STYLES.dividerMargin * 2; // One divider between scale and legend

    // Add extra height buffer for very wide maps where footer needs more vertical space
    // Base 612px needs no extra space, 1530px needs ~100px, scales logarithmically
    const widthBasedBuffer = mapImageWidth > 1224 ? Math.log2(mapImageWidth / 612) * 50 : 0;

    // Include all margins: page padding (top/bottom), legendMarginBottom, divider
    const recalculatedHeight =
      titleHeight +
      mapHeight +
      scaleHeight +
      dividerHeight +
      newLegendHeight +
      SHARED_STYLES.legendMarginBottom +
      footerHeight +
      widthBasedBuffer +
      SHARED_STYLES.padding * 2;

    finalConfig.canvasHeight = Math.ceil(recalculatedHeight);
  } else if (overflowItems && overflowItems.length > 0 && pageSize !== 'AUTO') {
    // Use full page height for overflow page (no map, title, or footer)
    const overflowMaxHeight =
      finalConfig.canvasHeight - SHARED_STYLES.padding * 2 - SHARED_STYLES.overflowMarginTop - SHARED_STYLES.overflowMarginBottom;
    const distributedOverflow = distributeIntoColumns(
      overflowItems,
      finalConfig.legendColumns,
      overflowMaxHeight,
      '',
      [],
      pageSize,
      wmsScale
    );
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
