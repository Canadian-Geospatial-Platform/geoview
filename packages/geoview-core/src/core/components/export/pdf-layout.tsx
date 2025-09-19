import { Document, Page, Text, View, Image, Svg, Path } from '@react-pdf/renderer';
import { TypeLegendLayer } from '@/core/components/layers/types';

interface ExportDocumentProps {
  mapDataUrl: string;
  exportTitle: string;
  scaleText: string;
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
}

interface FlattenedLegendItem {
  type: 'layer' | 'item' | 'child';
  data: TypeLegendLayer;
  parentName?: string;
  depth: number;
}

// Group items by their root layer and distribute smartly
const distributeIntoColumns = (items: FlattenedLegendItem[]): FlattenedLegendItem[][] => {
  if (!items || items.length === 0) return [[], [], [], []];

  const columns: FlattenedLegendItem[][] = [[], [], [], []];
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
      if (columns[currentColumn].length > 0 && columns[currentColumn].length + estimatedGroupSize > Math.ceil(items.length / 4) + 3) {
        currentColumn = Math.min(currentColumn + 1, 3);
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

export const ExportDocument = ({
  mapDataUrl,
  exportTitle,
  scaleText,
  northArrowSvg,
  legendLayers,
  disclaimer,
  attributions,
  date,
}: ExportDocumentProps) => (
  <Document>
    <Page size="LETTER" style={{ padding: 36, fontFamily: 'Helvetica' }}>
      {/* Title */}
      {exportTitle && <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>{exportTitle || ''}</Text>}

      {/* Map */}
      <Image src={mapDataUrl} style={{ width: 'calc(100% + 50px)', maxHeight: 400, objectFit: 'contain', marginBottom: 10 }} />

      {/* Scale and North Arrow */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {/* Scale bar with line */}
        <View style={{ justifyContent: 'center' }}>
          <View
            style={{
              width: 60,
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
          <Text style={{ fontSize: 10, marginTop: 2 }}>{scaleText}</Text>
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
              // Recursive function to flatten all legend items
              const flattenLayer = (layer: TypeLegendLayer, depth = 0): FlattenedLegendItem[] => {
                const items: FlattenedLegendItem[] = [];

                // Add the layer itself
                items.push({ type: depth === 0 ? 'layer' : 'child', data: layer, depth });

                // Add layer items
                layer.items.forEach((item) => {
                  items.push({ type: 'item', data: { ...layer, items: [item] }, parentName: layer.layerName, depth: depth + 1 });
                });

                // Recursively add children
                if (layer.children) {
                  layer.children.forEach((child) => {
                    items.push(...flattenLayer(child, depth + 1));
                  });
                }

                return items;
              };

              // Flatten all legend items into a single array
              const allItems: FlattenedLegendItem[] = [];

              legendLayers.forEach((layer) => {
                allItems.push(...flattenLayer(layer));
              });

              // Split into 4 columns
              const columns = distributeIntoColumns(allItems);

              return columns.map((columnItems, columnIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <View key={columnIndex} style={{ width: '25%', paddingRight: 3 }}>
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
                    } else if (item.type === 'child') {
                      return (
                        <Text
                          key={`child-${item.data.layerPath}`}
                          style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2, marginLeft: indentLevel, marginTop: 3 }}
                        >
                          {item.data.layerName}
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
