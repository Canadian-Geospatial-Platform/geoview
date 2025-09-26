import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { TypeTimeSliderValues, TimeSliderLayerSet } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { DateMgt } from '@/core/utils/date-mgt';
import { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';

// Page size specific styling
const PAGE_CONFIGS = {
  LETTER: { size: 'LETTER' as const, mapHeight: 400, legendColumns: 4, maxLegendHeight: 450 },
  LEGAL: { size: 'LEGAL' as const, mapHeight: 600, legendColumns: 4, maxLegendHeight: 500 },
  TABLOID: { size: 'TABLOID' as const, mapHeight: 800, legendColumns: 6, maxLegendHeight: 620 },
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
  }> | null;
  northArrowRotation: number;
  legendLayers: TypeLegendLayer[];
  orderedLayerInfo: TypeOrderedLayerInfo[];
  disclaimer: string;
  attributions: string[];
  date: string;
  timeSliderLayers?: TimeSliderLayerSet;
  pageSize: 'LETTER' | 'LEGAL' | 'TABLOID';
}

interface FlattenedLegendItem {
  type: 'layer' | 'item' | 'child' | 'wms' | 'time';
  data: TypeLegendLayer;
  parentName?: string;
  depth: number;
  isRoot: boolean;
  timeInfo?: TypeTimeSliderValues;
}

// Estimate item heights (rough approximation)
const estimateItemHeight = (item: FlattenedLegendItem): number => {
  switch (item.type) {
    case 'layer':
      return 20;
    case 'child':
      return 15;
    case 'wms':
      return 60; // WMS images are typically larger
    case 'time':
      return 12;
    case 'item':
      return 10;
    default:
      return 10;
  }
};

/**
 * Filter and flatten layers for placement in the legend
 * @param {TypeLegendLayer[]} layers - The legend layers to be shown in the legend
 * @param {TypeOrdderedLayerInfo[]} orderedLayerInfo - The orderedLayerInfo to be used to filter out layers that aren't visible
 * @param {TimeSliderLayerSet} timeSliderLayers - Any layers that are time enabled
 * @returns {FlattenedLegendItem[]} The flattened list of all the items in the legend
 */
const processLegendLayers = (
  layers: TypeLegendLayer[],
  orderedLayerInfo: TypeOrderedLayerInfo[],
  timeSliderLayers?: TimeSliderLayerSet
): FlattenedLegendItem[] => {
  const allItems: FlattenedLegendItem[] = [];

  const flattenLayer = (layer: TypeLegendLayer, depth = 0, rootLayerName?: string): FlattenedLegendItem[] => {
    const items: FlattenedLegendItem[] = [];
    const currentRootName = rootLayerName || layer.layerName;

    // Check if layer is visible on the map
    const layerInfo = orderedLayerInfo.find((info) => info.layerPath === layer.layerPath);
    if (!layerInfo?.visible) {
      return items;
    }

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
    items.push({
      type: depth === 0 ? 'layer' : 'child',
      data: layer,
      depth,
      isRoot: depth === 0,
      parentName: depth === 0 ? undefined : currentRootName,
    });

    // Add time dimension if available
    if (hasTimeDimension) {
      const timeDimension = timeSliderLayers?.[layer.layerPath];
      items.push({
        type: 'time',
        data: layer,
        parentName: currentRootName,
        depth: depth + 1,
        isRoot: false,
        timeInfo: timeDimension,
      });
    }

    // Add WMS legend image if available
    if (hasWMSLegend) {
      items.push({
        type: 'wms',
        data: layer,
        parentName: currentRootName,
        depth: depth + 1,
        isRoot: false,
      });
    }

    // Add visible layer items only
    layer.items.forEach((item) => {
      if (item.isVisible) {
        items.push({
          type: 'item',
          data: { ...layer, items: [item] },
          parentName: currentRootName,
          depth: depth + 1,
          isRoot: false,
        });
      }
    });

    // Recursively add children
    if (layer.children) {
      layer.children.forEach((child) => {
        items.push(...flattenLayer(child, depth + 1, currentRootName));
      });
    }

    return items;
  };

  layers.forEach((layer) => {
    allItems.push(...flattenLayer(layer));
  });

  return allItems;
};

/**
 * Group items by their root layer and distribute in the columns
 * @param {FlattenedLegendItem[]} items - The flattened list of legend items to be placed in the legend
 * @param {number} numColumns - The maximum number of columns that can be used
 * @returns {FlattenedLegendItem[][]} The flattened legend items distributed between the columns
 */
const distributeIntoColumns = (items: FlattenedLegendItem[], numColumns: number, maxHeight: number): FlattenedLegendItem[][] => {
  if (!items || items.length === 0) return Array(numColumns).fill([]);

  const columns: FlattenedLegendItem[][] = Array(numColumns)
    .fill(null)
    .map(() => []);
  const columnHeights: number[] = Array(numColumns).fill(0);

  // Group items by root layers
  const groups: FlattenedLegendItem[][] = [];
  let currentGroup: FlattenedLegendItem[] = [];

  items.forEach((item) => {
    if (item.isRoot && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(item);
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Distribute groups to balance column sizes
  groups.forEach((group) => {
    const groupHeight = group.reduce((sum, item) => sum + estimateItemHeight(item), 0);

    // Find column with space for this group
    let targetColumn = 0;
    for (let i = 0; i < numColumns; i++) {
      if (columnHeights[i] + groupHeight <= maxHeight && columnHeights[i] < columnHeights[targetColumn]) {
        targetColumn = i;
      }
    }

    // If group is too large, split it (but keep root layer with at least one child)
    if (columnHeights[targetColumn] + groupHeight > maxHeight && group.length > 2) {
      // Keep root + first few items in current column
      const rootAndSome = group.slice(0, Math.max(2, Math.floor(group.length / 2)));
      const remaining = group.slice(rootAndSome.length);

      columns[targetColumn].push(...rootAndSome);
      columnHeights[targetColumn] += rootAndSome.reduce((sum, item) => sum + estimateItemHeight(item), 0);

      // Find next available column for remaining items
      const nextColumn = (targetColumn + 1) % numColumns;
      columns[nextColumn].push(...remaining);
      columnHeights[nextColumn] += remaining.reduce((sum, item) => sum + estimateItemHeight(item), 0);
    } else {
      columns[targetColumn].push(...group);
      columnHeights[targetColumn] += groupHeight;
    }
  });

  return columns;
};

/**
 * Render the legend columns with dynamic width based on content
 */
const renderLegendColumns = (
  legendLayers: TypeLegendLayer[],
  orderedLayerInfo: TypeOrderedLayerInfo[],
  config: (typeof PAGE_CONFIGS)[keyof typeof PAGE_CONFIGS],
  timeSliderLayers?: TimeSliderLayerSet
) => {
  const allItems = processLegendLayers(legendLayers, orderedLayerInfo, timeSliderLayers);
  const columns = distributeIntoColumns(allItems, config.legendColumns, config.maxLegendHeight);

  // Count non-empty columns so legend is spread out when there are empty columns
  const nonEmptyColumns = columns.filter((column) => column.length > 0);
  const actualColumnCount = nonEmptyColumns.length;

  return columns
    .filter((column) => column.length > 0) // filter out empty columns
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
  legendLayers,
  orderedLayerInfo,
  disclaimer,
  attributions,
  date,
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
        {legendLayers && legendLayers.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 10,
              paddingLeft: 10,
              marginTop: -20,
              marginBottom: 20,
            }}
          >
            {renderLegendColumns(legendLayers, orderedLayerInfo, config, timeSliderLayers)}
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
