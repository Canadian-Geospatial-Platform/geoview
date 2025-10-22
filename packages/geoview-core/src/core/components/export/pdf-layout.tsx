import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { getMapInfo, PAGE_CONFIGS } from './utilities';
import type { FileExportProps } from './export-modal';
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
 * Get scaled styles for AUTO mode based on document size
 * @param {TypeValidPageSizes} pageSize - The page size
 * @param {number} docWidth - Document width
 * @returns {object} Scaled styles
 */
const getScaledStyles = (pageSize: TypeValidPageSizes, docWidth: number): typeof PDF_STYLES => {
  if (pageSize !== 'AUTO') return PDF_STYLES;

  const scale = docWidth / 612; // Scale based on standard letter width
  return {
    ...PDF_STYLES,
    layerText: (marginTop: number) => ({
      ...PDF_STYLES.layerText(marginTop),
      fontSize: PDF_STYLES.layerText(0).fontSize * scale,
    }),
    childText: (indentLevel: number) => ({
      ...PDF_STYLES.childText(indentLevel),
      fontSize: PDF_STYLES.childText(0).fontSize * scale,
    }),
    timeText: (indentLevel: number) => ({
      ...PDF_STYLES.timeText(indentLevel),
      fontSize: PDF_STYLES.timeText(0).fontSize * scale,
    }),
    itemText: {
      ...PDF_STYLES.itemText,
      fontSize: PDF_STYLES.itemText.fontSize * scale,
    },
    title: {
      ...PDF_STYLES.title,
      fontSize: PDF_STYLES.title.fontSize * scale,
    },
    scaleText: {
      ...PDF_STYLES.scaleText,
      fontSize: PDF_STYLES.scaleText.fontSize * scale,
    },
    footerDisclaimer: {
      ...PDF_STYLES.footerDisclaimer,
      fontSize: PDF_STYLES.footerDisclaimer.fontSize * scale,
    },
    footerAttribution: {
      ...PDF_STYLES.footerAttribution,
      fontSize: PDF_STYLES.footerAttribution.fontSize * scale,
    },
    footerDate: {
      ...PDF_STYLES.footerDate,
      fontSize: PDF_STYLES.footerDate.fontSize * scale,
    },
    northArrow: {
      ...PDF_STYLES.northArrow,
      width: PDF_STYLES.northArrow.width * scale,
      height: PDF_STYLES.northArrow.height * scale,
    },
    northArrowSvg: {
      ...PDF_STYLES.northArrowSvg,
      width: PDF_STYLES.northArrowSvg.width * scale,
      height: PDF_STYLES.northArrowSvg.height * scale,
    },
    itemIcon: {
      ...PDF_STYLES.itemIcon,
      width: PDF_STYLES.itemIcon.width * scale,
      height: PDF_STYLES.itemIcon.height * scale,
    },
  };
};

/**
 * Organize columns into rows for better vertical alignment
 * @param {FlattenedLegendItem[][]} columns - The columns to organize
 * @param {number} maxColumnsPerRow - Maximum columns per row
 * @returns {FlattenedLegendItem[][][]} Rows of columns
 */
const organizeColumnsIntoRows = (columns: FlattenedLegendItem[][], maxColumnsPerRow: number): FlattenedLegendItem[][][] => {
  const nonEmptyColumns = columns.filter((column) => column.length > 0);

  // Force create multiple rows by splitting each column into separate rows
  const rows: FlattenedLegendItem[][][] = [];

  nonEmptyColumns.forEach((column, index) => {
    const rowIndex = Math.floor(index / maxColumnsPerRow);
    if (!rows[rowIndex]) {
      rows[rowIndex] = [];
    }
    rows[rowIndex].push(column);
  });

  return rows;
};

/**
 * Render the legend columns with dynamic width based on content
 * @param {FlattenedLegendItem[][]} columns - The columns / distributed items to be placed in the legend
 * @param {object} styles - Scaled styles to use
 * @returns {JSX.Element[]} The rendered legend columns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegendColumns = (columns: FlattenedLegendItem[][], styles: any): JSX.Element => {
  const rows = organizeColumnsIntoRows(columns, 2);

  return (
    <View>
      {rows.map((rowColumns, rowIndex) => {
        // Skip second row for testing
        if (rowIndex === 1) return null;

        const actualColumnCount = rowColumns.length;

        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`row-${rowIndex}`}
            style={rowIndex > 0 ? PDF_STYLES.rowContainer : { ...PDF_STYLES.rowContainer, borderTopWidth: 0, paddingTop: 0 }}
          >
            {rowColumns.map((columnItems, columnIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <View key={columnIndex} style={{ width: `${100 / actualColumnCount}%`, alignItems: 'flex-start' }}>
                {columnItems.map((item, index) => {
                  const indentLevel = Math.min(item.depth, 3);

                  if (item.type === 'layer') {
                    return (
                      <Text key={`layer-${item.data.layerPath}`} style={styles.layerText(index > 0 ? 8 : 0)}>
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
                      <Text key={`time-${item.data.layerPath}`} style={styles.timeText(indentLevel)}>
                        {timeText}
                      </Text>
                    );
                  } else if (item.type === 'child') {
                    return (
                      <Text key={`child-${item.data.layerPath}`} style={styles.childText(indentLevel)}>
                        {item.data.layerName || '...'}
                      </Text>
                    );
                  } else {
                    const legendItem = item.data.items[0];
                    return (
                      <View key={`item-${item.parentName}-${legendItem?.name}`} style={PDF_STYLES.itemContainer(indentLevel)}>
                        {legendItem?.icon && <Image src={legendItem.icon} style={styles.itemIcon} />}
                        <Text style={styles.itemText}>{legendItem?.name}</Text>
                      </View>
                    );
                  }
                })}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

/**
 * The pdf document that is created for the export
 * @param {ExportDocumentProps} props - The props to be used to create the pdf document
 * @returns {JSX.Element} The rendered pdf document
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
  fittedOverflowItems,
  pageSize,
}: ExportDocumentProps): JSX.Element {
  const config = PAGE_CONFIGS[pageSize];
  const pageSizeValue = pageSize === 'AUTO' ? [config.canvasWidth, config.canvasHeight] : config.size;
  const scaledStyles = getScaledStyles(pageSize, config.canvasWidth);

  return (
    <Document>
      <Page size={pageSizeValue} style={PDF_STYLES.page}>
        {/* Title */}
        {exportTitle && exportTitle.trim() && <Text style={scaledStyles.title}>{exportTitle.trim()}</Text>}

        {/* Map */}
        <View style={PDF_STYLES.mapContainer}>
          <Image
            src={mapDataUrl}
            style={{
              ...PDF_STYLES.mapImage,
              maxHeight: pageSize === 'AUTO' ? 'auto' : config.mapHeight,
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
            <Text style={scaledStyles.scaleText}>{scaleText}</Text>
          </View>
          {northArrowSvg && (
            <View style={{ ...scaledStyles.northArrow, transform: `rotate(${northArrowRotation - 180}deg)` }}>
              <Svg viewBox="285 142 24 24" style={scaledStyles.northArrowSvg}>
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
        {fittedColumns && fittedColumns.length > 0 && (
          <View style={PDF_STYLES.legendContainer}>{renderLegendColumns(fittedColumns, scaledStyles)}</View>
        )}

        {/* Footer */}
        <View style={{ ...PDF_STYLES.footer, marginTop: 5 }}>
          <Text style={scaledStyles.footerDisclaimer}>{disclaimer || ''}</Text>
          {attributions.map((attr) => (
            <Text key={`${attr.slice(0, 5)}`} style={scaledStyles.footerAttribution}>
              {attr || ''}
            </Text>
          ))}
          <Text style={scaledStyles.footerDate}>{date || ''}</Text>
        </View>
      </Page>

      {/* Overflow Page - only if needed */}
      {fittedOverflowItems && fittedOverflowItems.filter((column) => column.length > 0).length > 0 && (
        <Page size={pageSizeValue} style={PDF_STYLES.page}>
          <View style={PDF_STYLES.overflowContainer}>{renderLegendColumns(fittedOverflowItems, scaledStyles)}</View>
        </Page>
      )}
    </Document>
  );
}

/**
 * Creates the PDF map and returns the url for download
 * @param {string} mapId - THe map ID
 * @param {FileExportProps} params - The file export props
 * @returns {Promise<string>} The URL for the PDF map
 */
export async function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string> {
  const { exportTitle, disclaimer, pageSize } = params;

  // Get map info
  const mapInfo = await getMapInfo(mapId, pageSize, disclaimer, exportTitle);

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
