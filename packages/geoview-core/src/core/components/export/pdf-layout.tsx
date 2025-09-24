import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { TypeTimeSliderValues, TimeSliderLayerSet } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { DateMgt } from '@/core/utils/date-mgt';

// Page size specific styling
const PAGE_CONFIGS = {
  LETTER: { size: 'LETTER' as const, mapHeight: 400, legendColumns: 4 },
  LEGAL: { size: 'LEGAL' as const, mapHeight: 600, legendColumns: 4 },
  TABLOID: { size: 'TABLOID' as const, mapHeight: 800, legendColumns: 6 },
};

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
    transform: string;
  }> | null;
  legendLayers: TypeLegendLayer[];
  disclaimer: string;
  attributions: string[];
  date: string;
  mapId: string;
  timeSliderLayers?: TimeSliderLayerSet;
  pageSize: 'LETTER' | 'LEGAL' | 'TABLOID';
}

interface FlattenedLegendItem {
  type: 'layer' | 'item' | 'child' | 'wms' | 'time';
  data: TypeLegendLayer;
  parentName?: string;
  depth: number;
  timeInfo?: TypeTimeSliderValues;
}

// Filter and process layers like LegendContainerComponent does
const processLegendLayers = (layers: TypeLegendLayer[], mapId: string, timeSliderLayers?: TimeSliderLayerSet): FlattenedLegendItem[] => {
  const allItems: FlattenedLegendItem[] = [];

  const flattenLayer = (layer: TypeLegendLayer, depth = 0): FlattenedLegendItem[] => {
    const items: FlattenedLegendItem[] = [];

    // Check if layer has any meaningful legend content
    const hasVisibleItems = layer.items.some((item) => item.isVisible);
    const hasWMSLegend = layer.type === CONST_LAYER_TYPES.WMS && layer.icons?.[0]?.iconImage && layer.icons[0].iconImage !== 'no data';
    const hasTimeDimension = Boolean(timeSliderLayers?.[layer.layerPath]?.range?.length);
    const hasChildren = layer.children && layer.children.length > 0;

    // Skip layers with no legend content (like XYZ/vector tiles without symbolization)
    if (!hasVisibleItems && !hasWMSLegend && !hasTimeDimension && !hasChildren) {
      return items;
    }

    // Add the layer itself
    items.push({ type: depth === 0 ? 'layer' : 'child', data: layer, depth });

    // Add WMS legend image if available
    if (hasWMSLegend) {
      items.push({
        type: 'wms',
        data: layer,
        parentName: layer.layerName,
        depth: depth + 1,
      });
    }

    // Add time dimension if available
    if (hasTimeDimension) {
      const timeDimension = timeSliderLayers?.[layer.layerPath];
      items.push({
        type: 'time',
        data: layer,
        parentName: layer.layerName,
        depth: depth + 1,
        timeInfo: timeDimension,
      });
    }

    // Add visible layer items only
    layer.items.forEach((item) => {
      if (item.isVisible) {
        items.push({
          type: 'item',
          data: { ...layer, items: [item] },
          parentName: layer.layerName,
          depth: depth + 1,
        });
      }
    });

    // Recursively add children
    if (layer.children) {
      layer.children.forEach((child) => {
        items.push(...flattenLayer(child, depth + 1));
      });
    }

    return items;
  };

  layers.forEach((layer) => {
    allItems.push(...flattenLayer(layer));
  });

  return allItems;
};

// Group items by their root layer and distribute smartly
const distributeIntoColumns = (items: FlattenedLegendItem[], numColumns: number): FlattenedLegendItem[][] => {
  if (!items || items.length === 0) return Array(numColumns).fill([]);

  const columns: FlattenedLegendItem[][] = Array(numColumns)
    .fill(null)
    .map(() => []);
  let currentColumn = 0;
  let currentGroup: FlattenedLegendItem[] = [];
  let currentRootLayer = '';

  items.forEach((item) => {
    // Determine root layer for grouping
    const rootLayer = item.type === 'layer' ? item.data.layerName : item.parentName || '';

    // If we're starting a new root layer group
    if (rootLayer !== currentRootLayer) {
      // Add previous group to current column if it exists
      if (currentGroup.length > 0) {
        columns[currentColumn].push(...currentGroup);
        currentGroup = [];
      }

      // Check if we should move to next column (if current group would be too long)
      const estimatedGroupSize = items.filter((i) => (i.type === 'layer' ? i.data.layerName : i.parentName || '') === rootLayer).length;

      // If current column already has items and adding this group would make it too long, move to next column
      if (
        columns[currentColumn].length > 0 &&
        columns[currentColumn].length + estimatedGroupSize > Math.ceil(items.length / numColumns) + 3
      ) {
        currentColumn = Math.min(currentColumn + 1, numColumns - 1);
      }

      currentRootLayer = rootLayer;
    }

    currentGroup.push(item);
  });

  // Add final group
  if (currentGroup.length > 0) {
    columns[currentColumn].push(...currentGroup);
  }

  return columns;
};

export function ExportDocument({
  mapDataUrl,
  exportTitle,
  scaleText,
  scaleLineWidth,
  northArrowSvg,
  legendLayers,
  disclaimer,
  attributions,
  date,
  mapId,
  timeSliderLayers,
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
        <Image src={mapDataUrl} style={{ width: '100%', maxHeight: config.mapHeight, objectFit: 'contain', marginBottom: 10 }} />

        {/* Scale and North Arrow */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Scale bar with line */}
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: parseInt(scaleLineWidth, 10),
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
                  left: 0,
                  top: -3,
                  width: 1,
                  height: 8,
                  backgroundColor: 'black',
                }}
              />
              {/* Right tick */}
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -3,
                  width: 1,
                  height: 8,
                  backgroundColor: 'black',
                }}
              />
            </View>
            <Text style={{ fontSize: 10, marginTop: 2, textAlign: 'center' }}>{scaleText}</Text>
          </View>
          {northArrowSvg && (
            <View style={{ width: 40, height: 40 }}>
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
        {legendLayers && legendLayers.length > 0 && (
          <View style={{ marginBottom: 20, marginTop: -20 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 10 }}>Legend</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(() => {
                const allItems = processLegendLayers(legendLayers, mapId, timeSliderLayers);
                const columns = distributeIntoColumns(allItems, config.legendColumns);

                return columns.map((columnItems, columnIndex) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <View key={columnIndex} style={{ width: `${100 / config.legendColumns}%`, paddingRight: 3 }}>
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
                            <Image src={item.data.icons?.[0]?.iconImage || ''} style={{ width: 60, height: 'auto' }} />
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
                            style={{ fontSize: 7, fontStyle: 'italic', marginLeft: indentLevel + 3, marginBottom: 2 }}
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
              })()}
            </View>
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
    </Document>
  );
}
