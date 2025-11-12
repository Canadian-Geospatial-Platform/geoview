import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, ElementFactory } from '@/core/components/export/utilities';
import { getMapInfo, renderLegendColumns, renderFooter, renderScaleBar, renderNorthArrow } from '@/core/components/export/utilities';
import type { FileExportProps } from '@/core/components/export/export-modal';
import { PDF_STYLES, getScaledPDFStyles } from '@/core/components/export/layout-styles';

interface ExportDocumentProps {
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
  canvasWidth: number;
  canvasHeight: number;
}

// PDF element factory for react-pdf elements
const pdfElementFactory: ElementFactory = {
  View: (props) => <View {...props} />,
  Text: (props) => <Text {...props} />,
  Image: (props) => <Image {...props} />,
  Span: (props) => <Text {...props} />, // Use Text for Span in PDF
  Svg: (props) => <Svg {...props} />,
  Path: (props) => <Path {...props} />,
};

/**
 * Render legend items in columns for PDF export
 * @param {FlattenedLegendItem[][]} columns - Pre-organized legend items grouped into columns
 * @param {any} styles - Scaled styles for the PDF layout
 * @param {number[]} columnWidths - Optional array of column widths in pixels
 * @returns {JSX.Element} The rendered legend columns as JSX
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegendInRows = (columns: FlattenedLegendItem[][], styles: any, columnWidths?: number[]): JSX.Element => {
  return renderLegendColumns(columns, pdfElementFactory, styles, PDF_STYLES, columnWidths);
};

/**
 * The PDF export document that is created for the map export
 * @param {ExportDocumentProps} props - The PDF Export Document properties
 * @returns {JSX.Element} The resulting html map
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
  date,
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
          {renderScaleBar(scaleText, scaleLineWidth, pdfElementFactory, scaledStyles, PDF_STYLES)}
          {renderNorthArrow(northArrowSvg, northArrowRotation, pdfElementFactory, scaledStyles)}
        </View>

        {/* Divider between scale and legend */}
        <View style={PDF_STYLES.divider} />

        {fittedColumns && fittedColumns.length > 0 && (
          <View style={PDF_STYLES.legendContainer}>{renderLegendInRows(fittedColumns, scaledStyles, columnWidths)}</View>
        )}

        {renderFooter(disclaimer, attributions, date, pdfElementFactory, scaledStyles)}
      </Page>
    </Document>
  );
}

/**
 * Creates the PDF map for the export
 * @param {string} mapId - The map ID
 * @param {FileExportProps} props - The file export props
 * @returns {Promise<string>} A string URL for the document
 */
export async function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer } = params;
  const mapInfo = await getMapInfo(mapId, exportTitle, disclaimer);

  // Use pre-calculated canvas height from getMapInfo (measured during preview)
  const blob = await pdf(
    <ExportDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
      canvasWidth={mapInfo.canvasWidth}
      canvasHeight={mapInfo.canvasHeight}
    />
  ).toBlob();
  return URL.createObjectURL(blob);
}
