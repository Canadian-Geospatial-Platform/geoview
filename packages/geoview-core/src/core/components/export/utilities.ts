import { createElement } from 'react';
import { Buffer } from 'buffer';
import { renderToString } from 'react-dom/server';

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
import { NorthArrowIcon } from '@/core/components/north-arrow/north-arrow-icon';

import { SHARED_STYLES, getScaledCanvasStyles } from '@/core/components/export/layout-styles';
import { CanvasDocument } from '@/core/components/export/canvas-layout';

// GV Buffer polyfill for react-pdf
if (typeof window !== 'undefined') {
  (window as typeof globalThis).Buffer = Buffer;
}

// Export constants
export const EXPORT_CONSTANTS = {
  // DPI and quality settings
  DEFAULT_DPI: 96, // Standard screen DPI
  JPEG_QUALITY: 0.98, // JPEG compression quality for map image

  // Column optimization
  COLUMN_BALANCE_THRESHOLD: 0.8, // Columns within 80% height ratio are considered balanced
  MAX_OPTIMIZATION_ITERATIONS: 20, // Maximum iterations for column balancing
  DEFAULT_MAX_COLUMNS: 4, // Default maximum number of legend columns
  COLUMN_GAP: 10, // Gap between legend columns in pixels

  // WMS image constraints
  WMS_MAX_WIDTH: 500, // Maximum width for WMS images
  WMS_INDENT_PER_LEVEL: 10, // Indent in pixels per depth level
} as const;

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
  calculatedWidth?: number;
  wmsImageSize?: { width: number; height: number }; // Actual measured WMS image dimensions
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
  canvasWidth: number;
  canvasHeight: number;
};

// Export dimension constants at 300DPI (only AUTO is supported)
const MAP_IMAGE_DIMENSIONS = {
  AUTO: {
    // Width and height calculated dynamically
    width: 100, // Default, will be recalculated
    height: 100, // Default, will be recalculated
  },
};

export class ExportUtilities {
  /**
   * Extract native dimensions from a base64-encoded PNG image by reading the IHDR chunk.
   * PNG format stores width/height in IHDR chunk at bytes 16-23 after the 8-byte signature.
   * Used to ensure legend icons render at their actual size without scaling artifacts.
   *
   * @param {string} base64Data - The base64 image string (with or without data:image/png;base64, prefix)
   * @returns {{ width: number; height: number } | null} The image dimensions in pixels, or null if extraction fails
   */
  static #getPNGDimensions(base64Data: string): { width: number; height: number } | null {
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
   * Sanitizes legend text for PDF rendering by replacing problematic Unicode characters with safe alternatives.
   * React-pdf has issues with certain characters (≤, ≥, etc.) which get rendered incorrectly in legend items.
   * Uses Unicode escape codes to ensure proper matching regardless of source encoding.
   *
   * @param {string} text - The legend text to sanitize
   * @returns {string} The sanitized text safe for PDF rendering
   */
  static #sanitizeLegendText = (text: string): string => {
    return text
      .replace(/\u2264/g, '<=') // Less than or equal (≤) → <=
      .replace(/\u2265/g, '>=') // Greater than or equal (≥) → >=
      .replace(/≤/g, '<=') // Literal ≤ → <=
      .replace(/≥/g, '>=') // Literal ≥ → >=
      .replace(/\u2013/g, '-') // En dash (–) → hyphen
      .replace(/\u2014/g, '-') // Em dash (—) → hyphen
      .replace(/\u2212/g, '-'); // Minus sign (−) → hyphen
  };

  /**
   * Renders a single legend item (layer, child, wms, time, or item type) using the provided element factory.
   * Handles different item types with appropriate styling and structure:
   * - layer: Root layer name with optional separator line
   * - child: Child layer name with indentation
   * - wms: WMS legend image with actual measured dimensions
   * - time: Time dimension text (single date or range)
   * - item: Legend icon + label with native PNG dimensions
   *
   * @param {FlattenedLegendItem} item - The legend item to render
   * @param {number} itemIndex - Index of the item in the column (used for separator logic)
   * @param {number} indentLevel - The indentation level (0-3) based on item depth
   * @param {ElementFactory} factory - Element factory for creating renderer-specific elements (Canvas/PDF)
   * @param {any} scaledStyles - The scaled styles object (CANVAS_STYLES or PDF_STYLES)
   * @param {any} baseStyles - The base styles object with factory-specific properties
   * @returns {JSX.Element} The rendered item element
   */
  static #renderSingleLegendItem = (
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
        this.#sanitizeLegendText(item.data.layerName || '')
      );

      // Return wrapper with separator + text, or just text if no separator
      if (separator) {
        return createElement(View, { key: `layer-wrapper-${item.data.layerPath}-${itemIndex}` }, separator, layerText);
      }
      return layerText;
    }

    if (item.type === 'wms') {
      const imageStyle = item.wmsImageSize
        ? {
            ...baseStyles.wmsImage,
            width: item.wmsImageSize.width,
            height: item.wmsImageSize.height,
          }
        : baseStyles.wmsImage;

      return createElement(
        View,
        {
          key: `wms-${item.data.layerPath}-${itemIndex}`,
          style: baseStyles.wmsContainer(indentLevel),
        },
        createElement(Image, {
          src: item.data.icons?.[0]?.iconImage || '',
          style: imageStyle,
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
        this.#sanitizeLegendText(item.data.layerName || '...')
      );
    }

    // Default: item type
    const legendItem = item.data.items[0];

    // Extract native PNG dimensions and reduce by half for better layout
    let iconStyle = scaledStyles.itemIcon;
    if (legendItem?.icon) {
      const dimensions = this.#getPNGDimensions(legendItem.icon);
      if (dimensions) {
        // Reduce dimensions by half, with minimum 4px size to ensure icons are visible
        const minSize = 4;
        const width = Math.max(dimensions.width / 2, minSize);
        const height = Math.max(dimensions.height / 2, minSize);

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
      createElement(Span, { style: scaledStyles.itemText }, this.#sanitizeLegendText(legendItem?.name || ''))
    );
  };

  /**
   * Renders all items in a legend column, grouping content items under their parent layers.
   * Wraps immediate children (non-child-layer items) in a container for proper visual grouping.
   * Recursively processes nested child layers to maintain hierarchy.
   *
   * Processing logic:
   * - Layer/child headers rendered first
   * - Immediate children (wms, time, item) wrapped in container
   * - Nested child layers processed separately (not wrapped)
   *
   * @param {FlattenedLegendItem[]} column - The column items to render in order
   * @param {ElementFactory} factory - Element factory for creating renderer-specific elements
   * @param {any} scaledStyles - The scaled styles object for sizing
   * @param {any} baseStyles - The base styles object for layout
   * @returns {JSX.Element[]} Array of rendered elements (headers + content containers)
   */
  static #renderColumnItems = (
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
        elements.push(this.#renderSingleLegendItem(item, i, indentLevel, factory, scaledStyles, baseStyles));

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

            contentItems.push(this.#renderSingleLegendItem(contentItem, j, contentIndentLevel, factory, scaledStyles, baseStyles));
          }

          elements.push(createElement(View, { key: `content-${i}` }, ...contentItems));

          i = contentEnd;
        } else {
          // No content to wrap, just move to next item
          i++;
        }
      } else {
        elements.push(this.#renderSingleLegendItem(item, i, indentLevel, factory, scaledStyles, baseStyles));
        i++;
      }
    }

    return elements;
  };

  /**
   * Renders multiple legend columns in a flexbox container with dynamic or fixed widths.
   * Uses space-between justification when columnWidths are provided to eliminate gaps.
   * Falls back to gap-based layout for equal-width columns.
   *
   * Layout modes:
   * - With columnWidths: Justified layout, each column has exact width, no gaps
   * - Without columnWidths: Flex layout with 10px gaps between equal-width columns
   *
   * @param {FlattenedLegendItem[][]} columns - Array of columns, each containing legend items
   * @param {ElementFactory} factory - Element factory for creating renderer-specific elements
   * @param {any} scaledStyles - The scaled styles object for sizing
   * @param {any} baseStyles - The base styles object for layout
   * @param {number[]} [columnWidths] - Optional array of column widths in pixels for justified layout
   * @returns {JSX.Element} The rendered legend container with all columns
   */
  static renderLegendColumns(
    columns: FlattenedLegendItem[][],
    factory: ElementFactory,
    scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    baseStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    columnWidths?: number[]
  ): JSX.Element {
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
              paddingRight: colIndex < columns.length - 1 ? EXPORT_CONSTANTS.COLUMN_GAP : 0,
            }
          : { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 };

        return createElement(
          View,
          {
            key: columnKey,
            style: columnStyle,
          },
          ...this.#renderColumnItems(column, factory, scaledStyles, baseStyles)
        );
      })
    );
  }

  /**
   * Renders the footer section with disclaimer, attributions, and date.
   * Footer appears at the bottom of the export document in all formats.
   *
   * @param {string} disclaimer - The disclaimer text to display
   * @param {string[]} attributions - Array of attribution texts (one per map layer)
   * @param {string} date - The export date string to display
   * @param {ElementFactory} factory - Element factory for creating renderer-specific elements
   * @param {any} scaledStyles - The scaled styles object with footer styling
   * @returns {JSX.Element} The rendered footer container
   */
  static renderFooter(
    disclaimer: string,
    attributions: string[],
    date: string,
    factory: ElementFactory,
    scaledStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): JSX.Element {
    const { View, Text } = factory;

    return createElement(
      View,
      { style: scaledStyles.footer || {} },
      createElement(Text, { style: scaledStyles.footerDisclaimer }, disclaimer || ''),
      ...attributions.map((attr) => createElement(Text, { key: `${attr.slice(0, 5)}`, style: scaledStyles.footerAttribution }, attr || '')),
      createElement(Text, { style: scaledStyles.footerDate }, date || '')
    );
  }

  /**
   * Renders a scale bar with tick marks and label text.
   * The scale bar width is dynamically calculated to match the map extent.
   * Includes left and right tick marks to clearly indicate the measurement distance.
   *
   * @param {string} scaleText - The scale text label (e.g., "100 km (approx)")
   * @param {string} scaleLineWidth - The scale line width as CSS string (e.g., "150px")
   * @param {ElementFactory} factory - Element factory for creating renderer-specific elements
   * @param {any} scaledStyles - The scaled styles object for text sizing
   * @param {any} baseStyles - The base styles object for scale bar layout
   * @returns {JSX.Element} The rendered scale bar container
   */
  static renderScaleBar(
    scaleText: string,
    scaleLineWidth: string,
    factory: ElementFactory,
    scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    baseStyles: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): JSX.Element {
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
  }

  /**
   * Renders a north arrow SVG icon with rotation to indicate true north direction.
   * The rotation accounts for both map rotation and user-configured north arrow orientation.
   * Returns null if north arrow is disabled or SVG data is unavailable.
   *
   * @param {Array} northArrowSvg - Array of SVG path data with stroke/fill properties
   * @param {number} northArrowRotation - The rotation angle in degrees (includes map rotation + config offset)
   * @param {ElementFactory} factory - Element factory for creating renderer-specific elements
   * @param {any} scaledStyles - The scaled styles object for sizing and rotation
   * @returns {JSX.Element | null} The rendered north arrow SVG or null if disabled
   */
  static renderNorthArrow(
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
  ): JSX.Element | null {
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
  }

  /**
   * Calculates actual WMS image height by loading the image and applying max-width constraint.
   * Images wider than maxWidth (500px * scale) are scaled down proportionally.
   * Narrower images keep their original dimensions (no stretching).
   * Includes scaled margin to match CSS rendering.
   *
   * @param {string | undefined} imageUrl - The WMS image URL (data URI or http/https)
   * @param {number} [scale=1] - The scale factor based on document width (e.g., 1.634 for 1000px, 3.922 for 2400px)
   * @param {string} [layerName='unknown'] - The layer name for error/warning logging
   * @returns {Promise<number>} The calculated height in pixels including scaled margin
   */
  static #calculateWMSImageHeight = (imageUrl: string | undefined, scale = 1, layerName = 'unknown'): Promise<number> => {
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
   * Calculates optimal number of columns (2-4) based on available width and minimum column requirements.
   * Ensures each column can accommodate:
   * - WMS images up to 500px wide
   * - Content padding and margins (20px total)
   * - Text content with reasonable wrapping (minimum 280px per column)
   *
   * Algorithm:
   * - Tries each column count from default (4) down to minimum (2)
   * - Returns first count where all columns meet minimum width requirement
   * - Falls back to 2 columns if narrower document
   *
   * @param {number} canvasWidth - The total canvas/document width in pixels
   * @param {number} defaultColumns - The default maximum number of columns (typically 4)
   * @returns {number} The optimal number of columns (2-4)
   */
  static #calculateOptimalColumns = (canvasWidth: number, defaultColumns: number): number => {
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
   * Filters and flattens hierarchical legend layers into a linear array for layout processing.
   * Recursively processes layer trees, filtering by visibility and content availability.
   * Preserves depth information and parent-child relationships for proper rendering.
   *
   * Processing steps:
   * 1. Filters layers by visibility (orderedLayerInfo)
   * 2. Checks for meaningful content (items, icons, time dimensions, children)
   * 3. Recursively processes children to prevent empty parent headers
   * 4. Flattens structure while preserving depth and parentName
   * 5. Adds layer header, time dimension, WMS image (if applicable), visible items
   *
   * Item types in result:
   * - layer: Root layer (depth 0)
   * - child: Nested layer (depth >= 1)
   * - time: Time dimension for temporal layers
   * - wms: WMS/dynamic service legend image
   * - item: Individual legend icon + label
   *
   * @param {TypeLegendLayer[]} layers - The legend layers from the map state
   * @param {TypeOrderedLayerInfo[]} orderedLayerInfo - Layer visibility info for filtering
   * @param {TimeSliderLayerSet} [timeSliderLayers] - Time-enabled layers with dimension data
   * @returns {FlattenedLegendItem[]} Flattened array of all legend items with depth/parent info
   */
  static #processLegendLayers = (
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
   * Main export processing function - gathers map data, processes legend, and optimizes layout.
   *
   * Workflow (AUTO mode only):
   * 1. Captures map canvas at browser dimensions (maintains extent/scale)
   * 2. Extracts scale bar, north arrow, and attribution data
   * 3. Filters and flattens legend layers by visibility
   * 4. Pre-calculates WMS image heights by loading images
   * 5. Measures actual rendered dimensions of each layer group in DOM
   * 6. Calculates optimal column count (2-4) based on available width
   * 7. Distributes layer groups across columns evenly
   * 8. Optimizes column balance using 2-step look-ahead algorithm (max 20 iterations)
   * 9. Calculates column widths for justified layout (eliminates gaps)
   * 10. Captures actual WMS image dimensions after layout
   * 11. Measures final canvas height with actual title/disclaimer for accurate sizing
   *
   * Key features:
   * - Uses actual DOM measurement for accuracy (no estimation)
   * - Maintains map extent by using browser canvas dimensions
   * - Handles map rotation via canvas transforms
   * - Balances columns within 80% height ratio threshold
   * - All content fits on single auto-sized page
   *
   * @param {string} mapId - The GeoView map ID
   * @param {string} exportTitle - The export title (affects height calculation)
   * @param {string} disclaimer - The disclaimer text (affects height calculation)
   * @returns {Promise<TypeMapInfoResult>} Map image URL, scale info, north arrow, legend columns, canvas dimensions
   * @throws {Error} If canvas context is unavailable
   */
  static async getMapInfo(mapId: string, exportTitle: string, disclaimer: string): Promise<TypeMapInfoResult> {
    // Get all needed data from store state
    const mapElement = AppEventProcessor.getGeoviewHTMLElement(mapId);
    const mapState = MapEventProcessor.getMapStateForExportLayout(mapId);
    const { northArrow, northArrowElement, attribution, mapRotation, mapScale } = mapState;

    // Get browser map dimensions from viewport element (not canvas, which changes size when rotated)
    const viewport = mapElement.getElementsByClassName('ol-viewport')[0] as HTMLElement;
    const viewportRect = viewport.getBoundingClientRect();

    // Use viewport dimensions, not canvas dimensions (canvas size changes when map rotates)
    const browserMapWidth = Math.round(viewportRect.width);
    const browserMapHeight = Math.round(viewportRect.height);

    // Adjust map to correct aspect ratio for PDF map (AUTO mode uses exact browser dimensions)
    const mapImageWidth = browserMapWidth;
    const mapImageHeight = browserMapHeight;
    // Update MAP_IMAGE_DIMENSIONS for AUTO mode
    MAP_IMAGE_DIMENSIONS.AUTO.width = browserMapWidth;
    MAP_IMAGE_DIMENSIONS.AUTO.height = browserMapHeight;

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = mapImageWidth;
    resultCanvas.height = mapImageHeight;
    const resultContext = resultCanvas.getContext('2d');

    if (!resultContext) throw new Error('Canvas context not available');

    // GV IMPORTANT: Apply rotation transform to match browser display
    // GV.Cont Viewport dimensions stay constant (e.g., 800x400), rotation is applied via canvas transform
    // GV.Cont OpenLayers renders to a larger canvas when rotated, we scale it to fill the viewport
    // GV.Cont This may result in slight cropping at edges, especially at projection limits
    if (mapRotation !== 0) {
      resultContext.save();
      resultContext.translate(mapImageWidth / 2, mapImageHeight / 2);
      resultContext.rotate(mapRotation);
    }

    // Copy OpenLayers canvas layers to result canvas
    Array.prototype.forEach.call(viewport.querySelectorAll('canvas'), (canvas: HTMLCanvasElement) => {
      const isOverviewCanvas = canvas.closest('.ol-overviewmap');
      if (!isOverviewCanvas && canvas.width > 0) {
        const { opacity } = (canvas.parentNode as HTMLElement).style;
        resultContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

        // Calculate scale factor to fill viewport (maintains zoom level, may crop edges)
        const scaleX = mapImageWidth / canvas.width;
        const scaleY = mapImageHeight / canvas.height;
        const scale = Math.max(scaleX, scaleY);

        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;

        if (mapRotation !== 0) {
          // Rotated: draw centered at rotated origin
          resultContext.drawImage(canvas, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        } else {
          // Not rotated: draw centered in viewport
          const offsetX = (mapImageWidth - scaledWidth) / 2;
          const offsetY = (mapImageHeight - scaledHeight) / 2;
          resultContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, offsetX, offsetY, scaledWidth, scaledHeight);
        }
      }
    });

    // Restore context if rotated
    if (mapRotation !== 0) {
      resultContext.restore();
    }

    // Calculate scale line width using viewport width (not canvas width which may be rotated)
    const pdfScaleFactor = browserMapWidth / mapImageWidth;
    const pdfScaleWidth = Math.round(parseFloat(mapScale.lineWidthMetric) * pdfScaleFactor);
    const scaleLineWidth = `${pdfScaleWidth}px`;

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
        const iconString = renderToString(createElement(NorthArrowIcon, { width: 24, height: 24 }));
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
    const allItems = this.#processLegendLayers(cleanLegendLayers, orderedLayerInfo, timeSliderLayers);

    // Calculate scale factor for WMS images based on document width
    const wmsScale = mapImageWidth / 612;

    // Pre-calculate WMS image heights with scaling
    const wmsItems = allItems.filter((item) => item.type === 'wms');
    const heightPromises = wmsItems.map((item) =>
      this.#calculateWMSImageHeight(item.data.icons?.[0]?.iconImage || '', wmsScale, item.data.layerName || 'unknown')
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
    // Always start from default maximum columns, not config.legendColumns which may have been modified
    const optimalColumns = this.#calculateOptimalColumns(mapImageWidth, EXPORT_CONSTANTS.DEFAULT_MAX_COLUMNS);

    // Use styles matching the canvas width for consistent measurement
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

    // Maximum width per column - WMS images can be up to 500px for text readability
    // For text content, use a reasonable max based on available width
    const maxColumnWidth = Math.min(500, Math.floor(mapImageWidth / optimalColumns) - 20); // Leave room for gaps

    const groupHeights = await Promise.all(
      groups.map(async (group) => {
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
              marginLeft: `${indentLevel * EXPORT_CONSTANTS.WMS_INDENT_PER_LEVEL}px`,
              marginBottom: `${SHARED_STYLES.wmsMarginBottom}px`,
              maxWidth: `${EXPORT_CONSTANTS.WMS_MAX_WIDTH}px`,
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

            // Store reference to capture actual dimensions after measurement
            img.dataset.itemIndex = String(itemIndex);

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
              const dimensions = this.#getPNGDimensions(legendItem.icon);
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

        // Wait for all images in this group to load before measuring
        const images = groupDiv.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(
            (image) =>
              new Promise<void>((resolve) => {
                if (image.complete) {
                  resolve();
                } else {
                  const loadHandler = (): void => resolve();
                  image.addEventListener('load', loadHandler, { once: true });
                  image.addEventListener('error', loadHandler, { once: true }); // Continue even if image fails to load
                }
              })
          )
        );

        const { height, width } = groupDiv.getBoundingClientRect();

        // Capture actual WMS image dimensions after layout
        group.forEach((item, itemIndex) => {
          if (item.type === 'wms') {
            const img = groupDiv.querySelector(`img[data-item-index="${itemIndex}"]`) as HTMLImageElement;
            if (img) {
              const imgRect = img.getBoundingClientRect();
              // eslint-disable-next-line no-param-reassign
              item.wmsImageSize = {
                width: Math.round(imgRect.width),
                height: Math.round(imgRect.height),
              };
            }
          }
        });

        dummyContainer.removeChild(groupDiv);

        const layerName = group[0]?.data.layerName || 'unknown';

        return { group, height, width, layerName };
      })
    );

    document.body.removeChild(dummyContainer);

    // STEP 3: Calculate required column width and verify number of columns fits
    // Each column width = widest layer in that column
    // We need to ensure all columns fit within available width
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
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + (numCols - 1) * EXPORT_CONSTANTS.COLUMN_GAP;
      return { cols, colWidths, totalWidth };
    };

    // Start with optimal columns and reduce if needed
    let finalColumns = optimalColumns;
    let result = calculateColumnsAndWidths(finalColumns);

    while (result.totalWidth > mapImageWidth && finalColumns > 1) {
      finalColumns--;
      result = calculateColumnsAndWidths(finalColumns);
    }

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

              break;
            }
          }
        }
      }
    }

    // STEP 5: Optimize using pre-measured heights with 2-step look-ahead
    let iteration = 0;
    let improved = true;

    while (improved && iteration < EXPORT_CONSTANTS.MAX_OPTIMIZATION_ITERATIONS) {
      improved = false;
      iteration++;

      const maxHeight = Math.max(...columnHeights);
      const minHeight = Math.min(...columnHeights);
      const balanceRatio = minHeight / maxHeight;

      if (balanceRatio > EXPORT_CONSTANTS.COLUMN_BALANCE_THRESHOLD) {
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
      }
    }

    const fittedColumns = columns;
    const columnWidths = localColumnWidths;

    // Measure canvas height by rendering temporary CanvasDocument (reused by PDF/PNG exports)
    const tempHtml = renderToString(
      createElement(CanvasDocument, {
        mapDataUrl: resultCanvas.toDataURL('image/jpeg', EXPORT_CONSTANTS.JPEG_QUALITY),
        scaleText: `${mapScale.labelGraphicMetric} (approx)`,
        scaleLineWidth,
        northArrowSvg: northArrowSvgPaths,
        northArrowRotation: rotationAngle,
        attributions: attribution,
        fittedColumns,
        columnWidths,
        canvasWidth: mapImageWidth,
        exportTitle, // Use actual title for accurate height
        disclaimer, // Use actual disclaimer for accurate height
        date: DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A'),
      })
    );
    const tempElement = document.createElement('div');
    tempElement.innerHTML = tempHtml;
    document.body.appendChild(tempElement);
    const renderedElement = tempElement.firstChild as HTMLElement;
    const canvasHeight = Math.ceil(renderedElement.getBoundingClientRect().height);
    document.body.removeChild(tempElement);

    return {
      mapDataUrl: resultCanvas.toDataURL('image/jpeg', EXPORT_CONSTANTS.JPEG_QUALITY),
      scaleText: `${mapScale.labelGraphicMetric} (approx)`,
      scaleLineWidth,
      northArrowSvg: northArrowSvgPaths,
      northArrowRotation: rotationAngle,
      attributions: attribution,
      fittedColumns,
      columnWidths,
      canvasWidth: mapImageWidth,
      canvasHeight,
    };
  }
}
