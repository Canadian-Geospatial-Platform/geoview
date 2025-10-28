import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, TypeValidPageSizes, ElementFactory } from './utilities';
import { getMapInfo, PAGE_CONFIGS, renderLegendColumns, renderFooter, renderScaleBar, renderNorthArrow } from './utilities';
import type { FileExportProps } from './export-modal';
import { PDF_STYLES, getScaledPDFStyles } from './layout-styles';

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
  fittedOverflowItems?: FlattenedLegendItem[][];
  pageSize: TypeValidPageSizes;
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
const renderLegendInRows = (columns: FlattenedLegendItem[][], styles: any): JSX.Element => {
  return renderLegendColumns(columns, pdfElementFactory, styles, PDF_STYLES);
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
  fittedOverflowItems,
  pageSize,
}: ExportDocumentProps): JSX.Element {
  const config = PAGE_CONFIGS[pageSize];
  const pageDimensions = [config.canvasWidth, config.canvasHeight];
  const scaledStyles = getScaledPDFStyles(config.canvasWidth);

  return (
    <Document>
      <Page size={{ width: pageDimensions[0], height: pageDimensions[1] }} style={PDF_STYLES.page}>
        {exportTitle && exportTitle.trim() && <Text style={scaledStyles.title}>{exportTitle.trim()}</Text>}

        <View style={PDF_STYLES.mapContainer}>
          <Image
            src={mapDataUrl}
            style={{
              ...PDF_STYLES.mapImage,
              maxHeight: pageSize === 'AUTO' ? 'auto' : config.mapHeight,
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
          <View style={PDF_STYLES.legendContainer}>{renderLegendInRows(fittedColumns, scaledStyles)}</View>
        )}

        {renderFooter(disclaimer, attributions, date, pdfElementFactory, scaledStyles)}
      </Page>

      {pageSize !== 'AUTO' && fittedOverflowItems && fittedOverflowItems.filter((column) => column.length > 0).length > 0 && (
        <Page size={{ width: pageDimensions[0], height: pageDimensions[1] }} style={PDF_STYLES.page}>
          <View style={PDF_STYLES.overflowContainer}>{renderLegendInRows(fittedOverflowItems, scaledStyles)}</View>
        </Page>
      )}
    </Document>
  );
}

export async function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer, pageSize } = params;
  const mapInfo = await getMapInfo(mapId, pageSize, disclaimer, exportTitle);

  const blob = await pdf(
    <ExportDocument
      {...mapInfo}
      exportTitle={exportTitle}
      disclaimer={disclaimer}
      date={DateMgt.formatDate(new Date(), 'YYYY-MM-DD, hh:mm:ss A')}
      pageSize={pageSize}
    />
  ).toBlob();
  return URL.createObjectURL(blob);
}
