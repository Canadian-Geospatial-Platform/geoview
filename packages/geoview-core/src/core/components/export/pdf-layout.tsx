import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import { getMapInfo, FlattenedLegendItem, PAGE_CONFIGS, TypeValidPageSizes } from './utilities';
import { FileExportProps } from './export-modal';
import { PDF_STYLES } from './layout-styles';

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

/**
 * Render the legend columns with dynamic width based on content
 */
const renderLegendColumns = (columns: FlattenedLegendItem[][]) => {
  const actualColumnCount = columns.filter((column) => column.length > 0).length;

  return columns
    .filter((column) => column.length > 0)
    .map((columnItems, columnIndex) => (
      // eslint-disable-next-line react/no-array-index-key
      <View key={columnIndex} style={{ width: `${100 / actualColumnCount}%` }}>
        {columnItems.map((item, index) => {
          const indentLevel = Math.min(item.depth, 3);

          if (item.type === 'layer') {
            return (
              <Text key={`layer-${item.data.layerPath}`} style={PDF_STYLES.layerText(index > 0 ? 8 : 0)}>
                {item.data.layerName}
              </Text>
            );
          } else if (item.type === 'wms') {
            return (
              <View key={`wms-${item.data.layerPath}`} style={PDF_STYLES.wmsContainer(indentLevel)}>
                <Image src={item.data.icons?.[0]?.iconImage || ''} style={PDF_STYLES.wmsImage} />
              </View>
            );
          } else if (item.type === 'time') {
            // Format time dimension display
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

            return (
              <Text key={`time-${item.data.layerPath}`} style={PDF_STYLES.timeText(indentLevel)}>
                {timeText}
              </Text>
            );
          } else if (item.type === 'child') {
            return (
              <Text key={`child-${item.data.layerPath}`} style={PDF_STYLES.childText(indentLevel)}>
                {item.data.layerName || 'Unnamed Layer'}
              </Text>
            );
          } else {
            const legendItem = item.data.items[0];
            return (
              <View key={`item-${item.parentName}-${legendItem?.name}`} style={PDF_STYLES.itemContainer(indentLevel)}>
                {legendItem?.icon && <Image src={legendItem.icon} style={PDF_STYLES.itemIcon} />}
                <Text style={PDF_STYLES.itemText}>{legendItem?.name || 'Unnamed Item'}</Text>
              </View>
            );
          }
        })}
      </View>
    ));
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

  return (
    <Document>
      <Page size={config.size} style={PDF_STYLES.page}>
        {/* Title */}
        {exportTitle && exportTitle.trim() && <Text style={PDF_STYLES.title}>{exportTitle.trim()}</Text>}

        {/* Map */}
        <View style={PDF_STYLES.mapContainer}>
          <Image
            src={mapDataUrl}
            style={{
              ...PDF_STYLES.mapImage,
              maxHeight: config.mapHeight,
            }}
          />
        </View>

        {/* Scale and North Arrow */}
        <View style={PDF_STYLES.scaleContainer}>
          {/* Scale bar with line */}
          <View style={PDF_STYLES.scaleBarContainer}>
            <View
              style={{
                ...PDF_STYLES.scaleLine,
                width: scaleLineWidth,
              }}
            >
              {/* Left tick */}
              <View
                style={{
                  ...PDF_STYLES.scaleTick,
                  ...PDF_STYLES.scaleTickLeft,
                }}
              />
              {/* Right tick */}
              <View
                style={{
                  ...PDF_STYLES.scaleTick,
                  ...PDF_STYLES.scaleTickRight,
                }}
              />
            </View>
            <Text style={PDF_STYLES.scaleText}>{scaleText}</Text>
          </View>
          {northArrowSvg && (
            <View style={{ ...PDF_STYLES.northArrow, transform: `rotate(${northArrowRotation - 180}deg)` }}>
              <Svg viewBox="285 142 24 24" style={PDF_STYLES.northArrowSvg}>
                {northArrowSvg.map((pathData, index) => {
                  return (
                    <Path
                      // eslint-disable-next-line react/no-array-index-key
                      key={`path-${index}`}
                      d={pathData.d || ''}
                      fill={pathData.fill || 'black'}
                      stroke={pathData.stroke || 'none'}
                      strokeWidth={pathData.strokeWidth || '0'}
                    />
                  );
                })}
              </Svg>
            </View>
          )}
        </View>

        {/* Legend */}
        {fittedColumns && fittedColumns.length > 0 && <View style={PDF_STYLES.legendContainer}>{renderLegendColumns(fittedColumns)}</View>}

        {/* Footer */}
        <View style={PDF_STYLES.footer}>
          <Text style={PDF_STYLES.footerDisclaimer}>{disclaimer || ''}</Text>
          {attributions.map((attr) => (
            <Text key={`${attr.slice(0, 5)}`} style={PDF_STYLES.footerAttribution}>
              {attr || ''}
            </Text>
          ))}
          <Text style={PDF_STYLES.footerDate}>{date || ''}</Text>
        </View>
      </Page>

      {/* Overflow Page - only if needed */}
      {fittedOverflowItems && fittedOverflowItems.filter((column) => column.length > 0).length > 0 && (
        <Page size={config.size} style={PDF_STYLES.page}>
          <View style={PDF_STYLES.overflowContainer}>{renderLegendColumns(fittedOverflowItems)}</View>
        </Page>
      )}
    </Document>
  );
}

export async function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer, pageSize } = params;

  // Get map info
  const mapInfo = await getMapInfo(mapId, pageSize, disclaimer);

  // Create PDF
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
