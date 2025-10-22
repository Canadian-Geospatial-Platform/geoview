import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { getMapInfo, PAGE_CONFIGS } from './utilities';
import type { FileExportProps } from './export-modal';
import { PDF_STYLES } from './layout-styles';
// import { width } from '@mui/system/sizing';
// import type { AnyARecord } from 'node:dns';

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
 * Render legend items in rows with proper alignment and dividers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegendInRows = (columns: FlattenedLegendItem[][], styles: any): JSX.Element => {
  const allItems: FlattenedLegendItem[] = [];

  // Flatten all columns into single array
  columns.forEach((column) => {
    allItems.push(...column);
  });

  // Group by root layers
  const layerGroups: FlattenedLegendItem[][] = [];
  let currentGroup: FlattenedLegendItem[] = [];

  allItems.forEach((item) => {
    if (item.isRoot && currentGroup.length > 0) {
      layerGroups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(item);
  });

  if (currentGroup.length > 0) {
    layerGroups.push(currentGroup);
  }

  // Create rows with max 3 layer groups per row
  const rows: FlattenedLegendItem[][][] = [];
  for (let i = 0; i < layerGroups.length; i += 3) {
    rows.push(layerGroups.slice(i, i + 3));
  }

  return (
    <View>
      {rows.map((rowGroups, rowIndex) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={`row-${rowIndex}`}
          style={{
            ...PDF_STYLES.rowContainer,
            ...(rowIndex === 0 ? { borderTopWidth: 0, paddingTop: 0 } : {}),
          }}
        >
          {rowGroups.map((group, groupIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={`group-${groupIndex}`} style={{ width: `${100 / rowGroups.length}%`, flexDirection: 'column' }}>
              {group.map((item, index) => {
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
      ))}
    </View>
  );
};

/**
 * Get scaled styles for AUTO mode
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getScaledStyles = (pageSize: TypeValidPageSizes, docWidth: number): any => {
  if (pageSize !== 'AUTO') return PDF_STYLES;

  const scale = docWidth / 612;
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
  const scaledStyles = getScaledStyles(pageSize, config.canvasWidth);

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
          <View style={PDF_STYLES.scaleBarContainer}>
            <View style={{ ...PDF_STYLES.scaleLine, width: scaleLineWidth }}>
              <View style={{ ...PDF_STYLES.scaleTick, ...PDF_STYLES.scaleTickLeft }} />
              <View style={{ ...PDF_STYLES.scaleTick, ...PDF_STYLES.scaleTickRight }} />
            </View>
            <Text style={scaledStyles.scaleText}>{scaleText}</Text>
          </View>
          {northArrowSvg && (
            <View style={{ ...scaledStyles.northArrow, transform: `rotate(${northArrowRotation - 180}deg)` }}>
              <Svg viewBox="285 142 24 24" style={scaledStyles.northArrowSvg}>
                {northArrowSvg.map((pathData, index) => (
                  <Path
                    // eslint-disable-next-line react/no-array-index-key
                    key={`path-${index}`}
                    d={pathData.d || ''}
                    fill={pathData.fill || 'black'}
                    stroke={pathData.stroke || 'none'}
                    strokeWidth={pathData.strokeWidth || '0'}
                  />
                ))}
              </Svg>
            </View>
          )}
        </View>

        {fittedColumns && fittedColumns.length > 0 && (
          <View style={PDF_STYLES.legendContainer}>{renderLegendInRows(fittedColumns, scaledStyles)}</View>
        )}

        <View style={PDF_STYLES.footer}>
          <Text style={scaledStyles.footerDisclaimer}>{disclaimer || ''}</Text>
          {attributions.map((attr) => (
            <Text key={`${attr.slice(0, 5)}`} style={scaledStyles.footerAttribution}>
              {attr || ''}
            </Text>
          ))}
          <Text style={scaledStyles.footerDate}>{date || ''}</Text>
        </View>
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
