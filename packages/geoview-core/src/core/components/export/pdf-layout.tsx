import { pdf } from '@react-pdf/renderer';
import { renderToString } from 'react-dom/server';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, ElementFactory } from './utilities';
import { getMapInfo, renderLegendColumns, renderFooter, renderScaleBar, renderNorthArrow } from './utilities';
import type { FileExportProps } from './export-modal';
import { PDF_STYLES, getScaledPDFStyles } from './layout-styles';
import { CanvasDocument } from './canvas-layout';

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
 * Render legend items directly from columns without re-grouping
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegendInRows = (columns: FlattenedLegendItem[][], styles: any, columnWidths?: number[]): JSX.Element => {
  return renderLegendColumns(columns, pdfElementFactory, styles, PDF_STYLES, columnWidths);
};

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

export async function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer } = params;
  const mapInfo = await getMapInfo(mapId);

  // First, render a temporary canvas to measure actual height
  const tempHtml = renderToString(
    <CanvasDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
      canvasWidth={mapInfo.canvasWidth}
    />
  );
  const tempElement = document.createElement('div');
  tempElement.innerHTML = tempHtml;
  document.body.appendChild(tempElement);

  // Measure the actual rendered height
  const renderedElement = tempElement.firstChild as HTMLElement;
  const actualCanvasHeight = Math.ceil(renderedElement.getBoundingClientRect().height);

  // Clean up temporary element
  document.body.removeChild(tempElement);

  // Now create the PDF with the correct height
  const blob = await pdf(
    <ExportDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
      canvasWidth={mapInfo.canvasWidth}
      canvasHeight={actualCanvasHeight}
    />
  ).toBlob();
  return URL.createObjectURL(blob);
}
