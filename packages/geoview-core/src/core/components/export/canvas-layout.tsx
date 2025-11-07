import { renderToString } from 'react-dom/server';
import * as html2canvas from '@html2canvas/html2canvas';

import { DateMgt } from '@/core/utils/date-mgt';
import type { FileExportProps } from './export-modal';
import type { FlattenedLegendItem, TypeValidPageSizes, ElementFactory } from './utilities';
import {
  PAGE_CONFIGS,
  getMapInfo,
  renderLegendColumns,
  renderFooter,
  renderScaleBar,
  renderNorthArrow,
  EXPORT_CONSTANTS,
} from './utilities';
import { CANVAS_STYLES, getScaledCanvasStyles } from './layout-styles';

interface CanvasDocumentProps {
  mapDataUrl: string;
  exportTitle: string;
  scaleText: string;
  scaleLineWidth: string;
  northArrowSvg: Array<{
    d: string | null;
    fill: string | null;
    stroke: string | null;
    strokeWidth: string | null;
  }> | null;
  northArrowRotation: number;
  disclaimer: string;
  attributions: string[];
  date: string;
  fittedColumns: FlattenedLegendItem[][];
  columnWidths?: number[];
  pageSize: TypeValidPageSizes;
}

// Canvas element factory for HTML elements
const canvasElementFactory: ElementFactory = {
  View: (props) => <div {...props} />,
  Text: (props) => <div {...props} />,
  Image: (props) => <img {...props} />,
  Span: (props) => <span {...props} />,
  Svg: (props) => <svg {...props} />,
  Path: (props) => <path {...props} />,
};

/**
 * Render legend items directly from columns without re-grouping
 */
const renderCanvasLegendInRows = (
  columns: FlattenedLegendItem[][],
  pageSize: TypeValidPageSizes,
  canvasWidth: number,
  columnWidths?: number[]
): JSX.Element => {
  const scaledStyles = getScaledCanvasStyles(canvasWidth);
  return renderLegendColumns(columns, canvasElementFactory, scaledStyles, CANVAS_STYLES, columnWidths);
};

/**
 * The Canvas that is created for the map export
 * @param {CanvasDocumentProps} props - The Canvas Document properties
 * @returns {JSX.Element} The resulting html map
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
  date,
  pageSize,
}: CanvasDocumentProps): JSX.Element {
  const { canvasWidth } = PAGE_CONFIGS[pageSize];
  const scaledStyles = getScaledCanvasStyles(canvasWidth);

  return (
    <div style={CANVAS_STYLES.page(canvasWidth)}>
      {/* Title */}
      {exportTitle && exportTitle.trim() && <h1 style={scaledStyles.title}>{exportTitle.trim()}</h1>}

      {/* Map */}
      <img src={mapDataUrl} style={CANVAS_STYLES.mapImage} />

      {/* Scale and North Arrow */}
      <div style={CANVAS_STYLES.scaleContainer}>
        {renderScaleBar(scaleText, scaleLineWidth, canvasElementFactory, scaledStyles, CANVAS_STYLES)}
        {renderNorthArrow(northArrowSvg, northArrowRotation, canvasElementFactory, scaledStyles)}
      </div>

      {/* Divider between scale and legend */}
      <div style={CANVAS_STYLES.divider} />

      {/* Legend */}
      {fittedColumns.length > 0 && (
        <div style={CANVAS_STYLES.legendContainer}>{renderCanvasLegendInRows(fittedColumns, pageSize, canvasWidth, columnWidths)}</div>
      )}

      {/* Footer */}
      {renderFooter(disclaimer, attributions, date, canvasElementFactory, scaledStyles)}
    </div>
  );
}

/**
 * Creates the HTML map and converts to canvas and then image for the export
 * @param {string} mapId - The map ID
 * @param {FileExportProps} props - The file export props
 * @returns {Promise<string[]>} A string of URLs for the images (Map and overflow pages)
 */
export async function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string[]> {
  const results = [];
  const { exportTitle, disclaimer, pageSize, dpi, jpegQuality, format } = props;

  // Get map info
  const mapInfo = await getMapInfo(mapId, pageSize);

  // Create main page HTML
  const mainPageHtml = renderToString(
    <CanvasDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
      pageSize={pageSize}
    />
  );
  const mainElement = document.createElement('div');
  mainElement.innerHTML = mainPageHtml;
  document.body.appendChild(mainElement);

  // Convert to canvas
  const renderedElement = mainElement.firstChild as HTMLElement;
  const quality = jpegQuality ?? 1;
  const mainCanvas = await html2canvas.default(renderedElement, { scale: dpi / EXPORT_CONSTANTS.DEFAULT_DPI, logging: false });
  results.push(mainCanvas.toDataURL(`image/${format}`, quality));

  // Capture actual canvas height for PDF generation
  const actualCanvasHeight = renderedElement.getBoundingClientRect().height;
  PAGE_CONFIGS[pageSize].canvasHeight = Math.ceil(actualCanvasHeight);

  document.body.removeChild(mainElement);

  return results;
}
