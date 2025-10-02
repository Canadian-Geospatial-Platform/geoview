import { pdf } from '@react-pdf/renderer';

import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { DateMgt } from '@/core/utils/date-mgt';
import { getMapInfo, FlattenedLegendItem, PAGE_CONFIGS, TypeValidPageSizes } from './utilities';
import { FileExportProps } from './export-modal';

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
              <Text
                key={`layer-${item.data.layerPath}`}
                style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 3, marginTop: index > 0 ? 8 : 0 }}
              >
                {item.data.layerName}
              </Text>
            );
          } else if (item.type === 'wms') {
            return (
              <View key={`wms-${item.data.layerPath}`} style={{ marginLeft: indentLevel + 3, marginBottom: 2 }}>
                <Image src={item.data.icons?.[0]?.iconImage || ''} style={{ width: 60, maxHeight: 100, objectFit: 'contain' }} />
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
              <Text
                key={`time-${item.data.layerPath}`}
                style={{ fontSize: 7, fontStyle: 'italic', marginLeft: indentLevel, marginBottom: 2 }}
              >
                {timeText}
              </Text>
            );
          } else if (item.type === 'child') {
            return (
              <Text
                key={`child-${item.data.layerPath}`}
                style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2, marginLeft: indentLevel, marginTop: 3 }}
              >
                {item.data.layerName || 'Unnamed Layer'}
              </Text>
            );
          } else {
            const legendItem = item.data.items[0];
            return (
              <View
                key={`item-${item.parentName}-${legendItem?.name}`}
                style={{ flexDirection: 'row', alignItems: 'center', marginLeft: indentLevel + 3, marginBottom: 1 }}
              >
                {legendItem?.icon && <Image src={legendItem.icon} style={{ width: 8, height: 8, marginRight: 2 }} />}
                <Text style={{ fontSize: 7, flexShrink: 1 }}>{legendItem?.name || 'Unnamed Item'}</Text>
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
      <Page size={config.size} style={{ padding: 36, fontFamily: 'Helvetica' }}>
        {/* Title */}
        {exportTitle && exportTitle.trim() && (
          <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>{exportTitle.trim()}</Text>
        )}

        {/* Map */}
        <View
          style={{
            marginBottom: 10,
            borderWidth: 1,
            borderColor: 'black',
            borderStyle: 'solid',
          }}
        >
          <Image
            src={mapDataUrl}
            style={{
              width: '100%',
              maxHeight: config.mapHeight,
              objectFit: 'contain',
            }}
          />
        </View>

        {/* Scale and North Arrow */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Scale bar with line */}
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: scaleLineWidth,
                height: 1,
                backgroundColor: 'black',
                marginBottom: 2,
                position: 'relative',
              }}
            >
              {/* Left tick */}
              <View
                style={{
                  position: 'absolute',
                  left: -0.5, // Move half tick width outside
                  top: -3,
                  width: 1,
                  height: 6,
                  backgroundColor: 'black',
                }}
              />
              {/* Right tick */}
              <View
                style={{
                  position: 'absolute',
                  right: -0.5, // Move half tick width outside
                  top: -3,
                  width: 1,
                  height: 6,
                  backgroundColor: 'black',
                }}
              />
            </View>
            <Text style={{ fontSize: 10, marginTop: 2, textAlign: 'center' }}>{scaleText}</Text>
          </View>
          {northArrowSvg && (
            <View style={{ width: 40, height: 40, transform: `rotate(${northArrowRotation - 180}deg)` }}>
              <Svg viewBox="285 142 24 24" style={{ width: 40, height: 40 }}>
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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 10,
              paddingLeft: 2,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            {renderLegendColumns(fittedColumns)}
          </View>
        )}

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 30, left: 36, right: 36 }}>
          <Text style={{ fontSize: 8, textAlign: 'center', marginBottom: 5 }}>{disclaimer || ''}</Text>
          {attributions.map((attr) => (
            <Text key={`${attr.slice(0, 5)}`} style={{ fontSize: 8, textAlign: 'center', marginBottom: 2 }}>
              {attr || ''}
            </Text>
          ))}
          <Text style={{ fontSize: 8, textAlign: 'center' }}>{date || ''}</Text>
        </View>
      </Page>

      {/* Overflow Page - only if needed */}
      {fittedOverflowItems && fittedOverflowItems.length > 0 && (
        <Page size={config.size} style={{ padding: 36, fontFamily: 'Helvetica' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 10,
              paddingLeft: 2,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            {renderLegendColumns(fittedOverflowItems)}
          </View>
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
