import { renderToString } from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import { type TemporalMode, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { FileExportProps } from '@/core/components/export/export-modal';
import type { FlattenedLegendItem, ElementFactory, NorthArrowSVG } from '@/core/components/export/utilities';
import { ExportUtilities, EXPORT_CONSTANTS } from '@/core/components/export/utilities';
import { CANVAS_STYLES, getScaledCanvasStyles } from '@/core/components/export/layout-styles';

/** Properties for the Canvas export document component. */
interface CanvasDocumentProps {
  /** The base64-encoded map image data URL. */
  mapDataUrl: string;
  /** The export title text. */
  exportTitle: string;
  /** The scale bar text label. */
  scaleText: string;
  /** The scale line width as CSS string. */
  scaleLineWidth: string;
  /** Optional north arrow SVG path data. */
  northArrowSvg?: NorthArrowSVG[];
  /** The north arrow rotation angle in degrees. */
  northArrowRotation: number;
  /** The disclaimer text. */
  disclaimer: string;
  /** Array of attribution texts. */
  attributions: string[];
  /** Date display formats keyed by layer path. */
  layerDateFormats: Record<string, TypeDisplayDateFormat>;
  /** Temporal modes keyed by layer path. */
  layerDateTemporalModes: Record<string, TemporalMode>;
  /** Pre-organized legend items grouped into columns. */
  fittedColumns: FlattenedLegendItem[][];
  /** Optional array of column widths in pixels. */
  columnWidths?: number[];
  /** The canvas width in pixels. */
  canvasWidth: number;
}

/** Canvas element factory mapping to HTML elements. */
const canvasElementFactory: ElementFactory = {
  View: (props) => <div {...props} />,
  Text: (props) => <div {...props} />,
  Image: (props) => <img {...props} />,
  Span: (props) => <span {...props} />,
  Svg: (props) => <svg {...props} />,
  Path: (props) => <path {...props} />,
};

/**
 * Renders legend items in columns for canvas export.
 *
 * @param columns - Pre-organized legend items grouped into columns
 * @param canvasWidth - The width of the canvas in pixels
 * @param layerDateFormats - Date formats for layers
 * @param layerDateTemporalModes - Temporal modes for layers
 * @param columnWidths - Optional array of column widths in pixels
 * @returns The rendered legend columns
 */
const renderCanvasLegendInRows = (
  columns: FlattenedLegendItem[][],
  canvasWidth: number,
  layerDateFormats: Record<string, TypeDisplayDateFormat>,
  layerDateTemporalModes: Record<string, TemporalMode>,
  columnWidths?: number[]
): JSX.Element => {
  const scaledStyles = getScaledCanvasStyles(canvasWidth);
  return ExportUtilities.renderLegendColumns(
    columns,
    canvasElementFactory,
    scaledStyles,
    CANVAS_STYLES,
    layerDateFormats,
    layerDateTemporalModes,
    columnWidths
  );
};

/**
 * Creates the Canvas document for the map export.
 *
 * @param props - Properties defined in CanvasDocumentProps interface
 * @returns The rendered HTML canvas document
 */
export function CanvasDocument({
  mapDataUrl,
  exportTitle,
  scaleText,
  scaleLineWidth,
  northArrowSvg,
  northArrowRotation,
  fittedColumns,
  columnWidths,
  disclaimer,
  attributions,
  layerDateFormats,
  layerDateTemporalModes,
  canvasWidth,
}: CanvasDocumentProps): JSX.Element {
  const scaledStyles = getScaledCanvasStyles(canvasWidth);

  return (
    <div style={CANVAS_STYLES.page(canvasWidth)}>
      {/* Title */}
      {exportTitle && exportTitle.trim() && <h1 style={scaledStyles.title}>{exportTitle.trim()}</h1>}

      {/* Map */}
      <img src={mapDataUrl} style={CANVAS_STYLES.mapImage} />

      {/* Scale and North Arrow */}
      <div style={CANVAS_STYLES.scaleContainer}>
        {ExportUtilities.renderScaleBar(scaleText, scaleLineWidth, canvasElementFactory, scaledStyles, CANVAS_STYLES)}
        {ExportUtilities.renderNorthArrow(northArrowSvg, northArrowRotation, canvasElementFactory, scaledStyles)}
      </div>

      {/* Divider between scale and legend */}
      <div style={CANVAS_STYLES.divider} />

      {/* Legend */}
      {fittedColumns && fittedColumns.length > 0 && (
        <div style={CANVAS_STYLES.legendContainer}>
          {renderCanvasLegendInRows(fittedColumns, canvasWidth, layerDateFormats, layerDateTemporalModes, columnWidths)}
        </div>
      )}

      {/* Footer */}
      {ExportUtilities.renderFooter(disclaimer, attributions, canvasElementFactory, scaledStyles)}
    </div>
  );
}

/**
 * Creates the HTML map and converts to canvas then image for the export.
 *
 * @param mapId - The map ID
 * @param props - The file export properties
 * @returns A promise that resolves with a data URL for the exported image
 */
export async function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer, dpi, jpegQuality, format, layerDateFormats, layerDateTemporalModes } = props;

  // Get map info with title/disclaimer for accurate height calculation
  const mapInfo = await ExportUtilities.getMapInfo(mapId, exportTitle, disclaimer, layerDateFormats, layerDateTemporalModes);
  // Create main page HTML
  const mainPageHtml = renderToString(
    <CanvasDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      layerDateFormats={layerDateFormats}
      layerDateTemporalModes={layerDateTemporalModes}
      canvasWidth={mapInfo.canvasWidth}
    />
  );
  const mainElement = document.createElement('div');
  mainElement.innerHTML = mainPageHtml;
  document.body.appendChild(mainElement);

  // Convert to canvas
  const renderedElement = mainElement.firstChild as HTMLElement;
  const quality = jpegQuality ?? 1;
  const mainCanvas = await html2canvas.default(renderedElement, { scale: dpi / EXPORT_CONSTANTS.DEFAULT_DPI, logging: false });
  const dataUrl = mainCanvas.toDataURL(`image/${format}`, quality);

  document.body.removeChild(mainElement);

  return dataUrl;
}
