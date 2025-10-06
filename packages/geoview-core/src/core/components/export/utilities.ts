import { createElement } from 'react';
import { Buffer } from 'buffer';

import { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { TypeTimeSliderValues, TimeSliderLayerSet } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

import { logger } from '@/core/utils/logger';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';

// GV Buffer polyfill for react-pdf
if (typeof window !== 'undefined') {
  (window as typeof globalThis).Buffer = Buffer;
}

export type TypeValidPageSizes = 'LETTER' | 'TABLOID' | 'LEGAL';

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
  LETTER: { size: 'LETTER' as const, mapHeight: 400, legendColumns: 4, maxLegendHeight: 450, canvasWidth: 612, canvasHeight: 792 },
  LEGAL: { size: 'LEGAL' as const, mapHeight: 600, legendColumns: 4, maxLegendHeight: 500, canvasWidth: 612, canvasHeight: 1008 },
  TABLOID: { size: 'TABLOID' as const, mapHeight: 800, legendColumns: 6, maxLegendHeight: 620, canvasWidth: 792, canvasHeight: 1224 },
};

// Export dimension constants at 300DPI
const MAP_IMAGE_DIMENSIONS = {
  LETTER: {
    // 8.5" X 11" => 612 X 792 @ 72dpi
    width: 2250,
    height: 1500,
  },
  TABLOID: {
    // 11" X 17" => 792 X 1224 @ 72dpi
    width: 2900,
    height: 2300,
  },
  LEGAL: {
    // 8.5" X 14" => 612 X 1008 @ 72 dpi
    width: 2250,
    height: 1900,
  },
};

// Estimate item heights (rough approximation)
const estimateItemHeight = (item: FlattenedLegendItem): number => {
  switch (item.type) {
    case 'layer':
      return 20;
    case 'child':
      return 15;
    case 'wms':
      return 100; // WMS images are typically larger
    case 'time':
      return 12;
    case 'item':
      return 10;
    default:
      return 10;
  }
};

/**
 * Estimate footer height based on content
 */
const estimateFooterHeight = (disclaimer: string, attributions: string[]): number => {
  const baseLineHeight = 12; // 8px font + 4px spacing
  const marginBottom = 5; // disclaimer margin

  // Estimate disclaimer lines (assuming ~80 chars per line at font size 8)
  const disclaimerLines = disclaimer ? Math.ceil(disclaimer.length / 80) : 0;
  const disclaimerHeight = disclaimerLines * baseLineHeight + (disclaimerLines > 0 ? marginBottom : 0);

  // Estimate attribution lines
  const attributionHeight = attributions.reduce((total, attr) => {
    const lines = Math.ceil(attr.length / 80);
    return total + lines * baseLineHeight + 2; // 2px margin per attribution
  }, 0);

  // Date line
  const dateHeight = baseLineHeight;

  // Add padding and margins
  const totalHeight = disclaimerHeight + attributionHeight + dateHeight + 20; // 20px for margins/padding

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
 * Group items by their root layer and distribute in the columns
 * @param {FlattenedLegendItem[]} items - The flattened list of legend items to be placed in the legend
 * @param {number} numColumns - The maximum number of columns that can be used
 * @returns {FlattenedLegendItem[][]} The flattened legend items distributed between the columns
 */
export const distributeIntoColumns = (
  items: FlattenedLegendItem[],
  numColumns: number,
  maxHeight: number,
  disclaimer: string,
  attributions: string[]
): { fittedColumns: FlattenedLegendItem[][]; overflowItems: FlattenedLegendItem[] } => {
  if (!items || items.length === 0) return { fittedColumns: Array(numColumns).fill([]), overflowItems: [] };

  const columns: FlattenedLegendItem[][] = Array(numColumns)
    .fill(null)
    .map(() => []);
  const columnHeights: number[] = Array(numColumns).fill(0);
  const overflowItems: FlattenedLegendItem[] = [];

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

  // Reserve space for footer (approximately 60px)
  const footerReservedSpace = estimateFooterHeight(disclaimer, attributions);
  const adjustedMaxHeight = maxHeight - footerReservedSpace;

  // Distribute groups strictly - no splitting allowed
  groups.forEach((group) => {
    const groupHeight = group.reduce((sum, item) => sum + estimateItemHeight(item), 0);

    // Find the column with the least content that can fit this entire group
    let targetColumn = -1;
    let minHeight = Infinity;

    for (let i = 0; i < numColumns; i++) {
      if (columnHeights[i] + groupHeight <= adjustedMaxHeight && columnHeights[i] < minHeight) {
        targetColumn = i;
        minHeight = columnHeights[i];
      }
    }

    // If no column can fit the entire group, move to overflow
    if (targetColumn === -1) {
      overflowItems.push(...group);
    } else {
      columns[targetColumn].push(...group);
      columnHeights[targetColumn] += groupHeight;
    }
  });

  return { fittedColumns: columns, overflowItems };
};

/**
 * Generate the PDF export for the map
 * @param {string} mapId - The map ID
 * @param {TypeValidPageSizes} pageSize - The page size for aspect ratio
 * @returns {TypeMapInfoResult} The map image data URL and browser canvas size
 */
export async function getMapInfo(mapId: string, pageSize: TypeValidPageSizes, disclaimer: string): Promise<TypeMapInfoResult> {
  // Get all needed data from store state
  const mapElement = AppEventProcessor.getGeoviewHTMLElement(mapId);
  const mapState = MapEventProcessor.getMapStateForExportLayout(mapId);
  const { northArrow, northArrowElement, attribution, mapRotation, mapScale } = mapState;

  // Adjust map to correct aspect ratio for PDF map
  const mapImageWidth = MAP_IMAGE_DIMENSIONS[pageSize].width;
  const mapImageHeight = MAP_IMAGE_DIMENSIONS[pageSize].height;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = mapImageWidth;
  resultCanvas.height = mapImageHeight;
  const resultContext = resultCanvas.getContext('2d');

  if (!resultContext) throw new Error('Canvas context not available');

  const viewport = mapElement.getElementsByClassName('ol-viewport')[0];

  // Apply rotation if needed
  if (mapRotation !== 0) {
    resultContext.save();
    resultContext.translate(mapImageWidth / 2, mapImageHeight / 2);
    resultContext.rotate(mapRotation);
  }

  let browserMapWidth;

  // GV This tries it's best to fit the map image into the canvas. However;
  // GV.Cont at close to 45 degrees, there will be unfetched tiles in the corners
  Array.prototype.forEach.call(viewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
    const isOverviewCanvas = canvas.closest('.ol-overviewmap');
    if (!isOverviewCanvas && canvas.width > 0) {
      const { opacity } = (canvas.parentNode as HTMLElement).style;
      resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

      // Calculate scaling for the map
      browserMapWidth = canvas.width;
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
  const pdfScaleFactor = browserMapWidth! / mapImageWidth;
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
    layerName: layer.layerName || 'Unnamed Layer',
    items: layer.items
      .filter((item) => item && item.name)
      .map((item) => ({
        ...item,
        name: item.name || 'Unnamed Item',
        icon: item.icon || null,
      })),
  }));

  // Process legend data
  const config = PAGE_CONFIGS[pageSize];
  const allItems = processLegendLayers(cleanLegendLayers, orderedLayerInfo, timeSliderLayers);
  const { fittedColumns, overflowItems } = distributeIntoColumns(
    allItems,
    config.legendColumns,
    config.maxLegendHeight,
    disclaimer,
    attribution
  );

  let fittedOverflowItems;
  if (overflowItems) {
    const distributedOverflow = distributeIntoColumns(overflowItems, config.legendColumns, config.maxLegendHeight, '', []);
    fittedOverflowItems = distributedOverflow.fittedColumns;
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
