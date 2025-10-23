import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import { getMapInfo, PAGE_CONFIGS } from './utilities';
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

/**
 * Render legend items directly from columns without re-grouping
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLegendInRows = (columns: FlattenedLegendItem[][], styles: any): JSX.Element => {
  /**
   * Renders a single legend item
   */
  const renderSingleItem = (item: FlattenedLegendItem, itemIndex: number, indentLevel: number): JSX.Element => {
    if (item.type === 'layer') {
      return (
        <Text key={`layer-${item.data.layerPath}-${itemIndex}`} style={styles.layerText(itemIndex > 0 ? 8 : 0)}>
          {item.data.layerName}
        </Text>
      );
    }
    if (item.type === 'wms') {
      return (
        <View key={`wms-${item.data.layerPath}-${itemIndex}`} style={PDF_STYLES.wmsContainer(indentLevel)}>
          <Image src={item.data.icons?.[0]?.iconImage || ''} style={PDF_STYLES.wmsImage} />
        </View>
      );
    }
    if (item.type === 'time') {
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
        <Text key={`time-${item.data.layerPath}-${itemIndex}`} style={styles.timeText(indentLevel)}>
          {timeText}
        </Text>
      );
    }
    if (item.type === 'child') {
      return (
        <Text key={`child-${item.data.layerPath}-${itemIndex}`} style={styles.childText(indentLevel)}>
          {item.data.layerName || '...'}
        </Text>
      );
    }
    const legendItem = item.data.items[0];
    return (
      <View key={`item-${item.parentName}-${legendItem?.name}-${itemIndex}`} style={PDF_STYLES.itemContainer(indentLevel)}>
        {legendItem?.icon && <Image src={legendItem.icon} style={styles.itemIcon} />}
        <Text style={styles.itemText}>{legendItem?.name}</Text>
      </View>
    );
  };

  /**
   * Groups items into containers - wraps content (not header) in red border
   */
  const renderColumnItems = (column: FlattenedLegendItem[]): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < column.length) {
      const item = column[i];
      const indentLevel = Math.min(item.depth, 3);

      // Check if this is a layer (depth 0) or child layer (any depth >= 1)
      if (item.type === 'layer' || item.type === 'child') {
        // First render the layer/child header WITHOUT the border
        elements.push(renderSingleItem(item, i, indentLevel));

        const currentDepth = item.depth;
        const contentStart = i + 1;
        let contentEnd = i + 1;

        // Find all immediate children (depth = currentDepth + 1)
        // Stop when we hit an item at same or lower depth (sibling or higher level)
        while (contentEnd < column.length && column[contentEnd].depth > currentDepth) {
          // Only collect items at the immediate next level for wrapping
          if (column[contentEnd].depth === currentDepth + 1) {
            contentEnd++;
          } else {
            // This is a deeper nested item, skip to find where this group ends
            break;
          }
        }

        // If we have direct children, check if they are content items (not child layers)
        if (contentEnd > contentStart) {
          const hasContentItems = column
            .slice(contentStart, contentEnd)
            .some((childItem) => childItem.type === 'wms' || childItem.type === 'item' || childItem.type === 'time');

          if (hasContentItems) {
            // Wrap content items with red border
            const contentItems: JSX.Element[] = [];
            for (let j = contentStart; j < contentEnd; j++) {
              const contentItem = column[j];
              const contentIndentLevel = Math.min(contentItem.depth, 3);

              contentItems.push(renderSingleItem(contentItem, j, contentIndentLevel));
            }

            elements.push(
              <View
                key={`content-${i}`}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: '#9e9e9e',
                  borderLeftStyle: 'solid',
                  paddingLeft: 8,
                  marginLeft: 8,
                  marginBottom: 4,
                }}
              >
                {contentItems}
              </View>
            );

            i = contentEnd;
          } else {
            // Only child layers, no content to wrap - will be handled in next iteration
            i++;
          }
        } else {
          // No content, just move to next item
          i++;
        }
      } else {
        elements.push(renderSingleItem(item, i, indentLevel));
        i++;
      }
    }

    return elements;
  };

  // Render columns directly as they were distributed
  return (
    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
      {columns.map((column, colIndex) => {
        const columnKey = column.length > 0 ? `col-${column[0].data.layerPath}-${colIndex}` : `col-empty-${colIndex}`;
        return (
          <View key={columnKey} style={{ flexDirection: 'column', flex: 1, minWidth: 0 }}>
            {renderColumnItems(column)}
          </View>
        );
      })}
    </View>
  );
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

        {/* Divider between scale and legend */}
        <View style={PDF_STYLES.divider} />

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
