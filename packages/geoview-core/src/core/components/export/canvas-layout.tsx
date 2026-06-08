import { renderToString } from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { FileExportProps } from '@/core/components/export/export-modal';
import type { FlattenedLegendItem, ElementFactory, NorthArrowSVG } from '@/core/components/export/utilities';
import { ExportUtilities, EXPORT_CONSTANTS } from '@/core/components/export/utilities';
import { CANVAS_STYLES, getScaledCanvasStyles } from '@/core/components/export/layout-styles';
import { isLocalhost } from '@/core/utils/utilities';

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
  const { exportTitle, disclaimer, dpi, jpegQuality, format, layerDateFormats, layerDateTemporalModes, language } = props;

  // Snapshot the map canvas + collect legend/scale/north-arrow/footer data needed for layout
  const mapInfo = await ExportUtilities.getMapInfo(mapId, language, exportTitle, disclaimer, layerDateFormats, layerDateTemporalModes);

  // Render the export document (map image + scale + legend + footer) to an HTML string via React SSR
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

  // Inject the rendered HTML into the live DOM so the browser computes real layout/sizes for html2canvas
  const mainElement = document.createElement('div');
  mainElement.innerHTML = mainPageHtml;
  document.body.appendChild(mainElement);

  // React 19 prepends a <link rel="preload" as="image"> to the rendered HTML
  // for any <img> tag, so renderToString produces TWO root elements:
  // 1) a zero-size <link> preload tag
  // 2) the actual content <div>
  // We must target the <div> explicitly — `firstChild` / `firstElementChild`
  // would pick the <link>, giving html2canvas a 0x0 element and producing "data:,".
  const renderedElement = (mainElement.querySelector('div') as HTMLElement | null) ?? mainElement;
  const quality = jpegQuality ?? 1;

  // Rasterize the rendered DOM into a canvas (useCORS lets cross-origin legend icons draw without tainting)
  const mainCanvas = await html2canvas.default(renderedElement, {
    scale: dpi / EXPORT_CONSTANTS.DEFAULT_DPI,
    logging: isLocalhost() ? true : false, // Enable html2canvas logging in local dev for easier debugging, disable in prod for performance
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  // Encode the canvas as a data URL in the requested image format
  const dataUrl = mainCanvas.toDataURL(`image/${format}`, quality);

  // Clean up the temporary DOM node we appended above
  document.body.removeChild(mainElement);

  return dataUrl;
}
