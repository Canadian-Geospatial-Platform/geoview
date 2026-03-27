import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { type TemporalMode, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, ElementFactory, NorthArrowSVG } from '@/core/components/export/utilities';
import { ExportUtilities } from '@/core/components/export/utilities';
import type { FileExportProps } from '@/core/components/export/export-modal';
import { PDF_STYLES, getScaledPDFStyles } from '@/core/components/export/layout-styles';

/** Properties for the PDF export document component. */
interface ExportDocumentProps {
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
  /** The canvas height in pixels. */
  canvasHeight: number;
}

/** PDF element factory mapping to react-pdf elements. */
const pdfElementFactory: ElementFactory = {
  View: (props) => <View {...props} />,
  Text: (props) => <Text {...props} />,
  Image: (props) => <Image {...props} />,
  Span: (props) => <Text {...props} />, // Use Text for Span in PDF
  Svg: (props) => <Svg {...props} />,
  Path: (props) => <Path {...props} />,
};

/**
 * Renders legend items in columns for PDF export.
 *
 * @param columns - Pre-organized legend items grouped into columns
 * @param styles - Scaled styles for the PDF layout
 * @param layerDateFormats - Date formats for layers
 * @param layerDateTemporalModes - Temporal modes for layers
 * @param columnWidths - Optional array of column widths in pixels
 * @returns The rendered legend columns
 */
const renderLegendInRows = (
  columns: FlattenedLegendItem[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: any,
  layerDateFormats: Record<string, TypeDisplayDateFormat>,
  layerDateTemporalModes: Record<string, TemporalMode>,
  columnWidths?: number[]
): JSX.Element => {
  return ExportUtilities.renderLegendColumns(
    columns,
    pdfElementFactory,
    styles,
    PDF_STYLES,
    layerDateFormats,
    layerDateTemporalModes,
    columnWidths
  );
};

/**
 * Creates the PDF export document for the map export.
 *
 * @param props - Properties defined in ExportDocumentProps interface
 * @returns The rendered PDF document
 */
export function ExportDocument({
  mapDataUrl,
  exportTitle,
  scaleText,
  scaleLineWidth,
  northArrowSvg,
  northArrowRotation,
  disclaimer,
  attributions,
  layerDateFormats,
  layerDateTemporalModes,
  fittedColumns,
  columnWidths,
  canvasWidth,
  canvasHeight,
}: ExportDocumentProps): JSX.Element {
  const pageDimensions = [canvasWidth, canvasHeight];
  const scaledStyles = getScaledPDFStyles(canvasWidth);

  return (
    <Document>
      <Page size={{ width: pageDimensions[0], height: pageDimensions[1] }} style={PDF_STYLES.page}>
        {exportTitle && exportTitle.trim() && <Text style={scaledStyles.title}>{exportTitle.trim()}</Text>}

        <View style={PDF_STYLES.mapContainer}>
          <Image
            src={mapDataUrl}
            style={{
              ...PDF_STYLES.mapImage,
              maxHeight: 'auto', // AUTO mode only
            }}
          />
        </View>

        <View style={PDF_STYLES.scaleContainer}>
          {ExportUtilities.renderScaleBar(scaleText, scaleLineWidth, pdfElementFactory, scaledStyles, PDF_STYLES)}
          {ExportUtilities.renderNorthArrow(northArrowSvg, northArrowRotation, pdfElementFactory, scaledStyles)}
        </View>

        {/* Divider between scale and legend */}
        <View style={PDF_STYLES.divider} />

        {fittedColumns && fittedColumns.length > 0 && (
          <View style={PDF_STYLES.legendContainer}>
            {renderLegendInRows(fittedColumns, scaledStyles, layerDateFormats, layerDateTemporalModes, columnWidths)}
          </View>
        )}

        {ExportUtilities.renderFooter(disclaimer, attributions, pdfElementFactory, scaledStyles)}
      </Page>
    </Document>
  );
}

/**
 * Creates the PDF map for the export.
 *
 * @param mapId - The map ID
 * @param params - The file export properties
 * @returns A promise that resolves with a string URL for the document
 */
export async function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer, layerDateFormats, layerDateTemporalModes } = params;
  const mapInfo = await ExportUtilities.getMapInfo(mapId, exportTitle, disclaimer, layerDateFormats, layerDateTemporalModes);

  // Use pre-calculated canvas height from getMapInfo (measured during preview)
  const blob = await pdf(
    <ExportDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      layerDateFormats={layerDateFormats}
      layerDateTemporalModes={layerDateTemporalModes}
      canvasWidth={mapInfo.canvasWidth}
      canvasHeight={mapInfo.canvasHeight}
    />
  ).toBlob();
  return URL.createObjectURL(blob);
}
