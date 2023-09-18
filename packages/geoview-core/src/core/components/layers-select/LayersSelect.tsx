/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import { List } from '@/ui';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { api } from '@/app';
import { LayerSelectItem } from './LayerSelectItem';

export interface LayersSelectProps {
  mapId: string;
  layerIds: string[];
  isRemoveable: false;
  canSetOpacity?: boolean;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
  canSort?: boolean;
  onOpenDetails?: (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined) => void;
}

export function LayersSelect(props: LayersSelectProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId, canSort, onOpenDetails } = props;
  // const [selectedLayer, setSelectedLayer] = useState<TypeLegendItemProps | null>(null);

  const legendItems = layerIds
    .filter((layerId) => api.maps[mapId].layer.geoviewLayers[layerId]) //eric added
    // .filter((layerId) => api.map(mapId).layer.geoviewLayers[layerId]) //original
    .map((layerId) => {
      const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId]; //eric added
      // const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId]; //original

      return (
        <LayerSelectItem
          key={`layerKey-${layerId}`}
          layerId={layerId}
          geoviewLayerInstance={geoviewLayerInstance}
          isRemoveable={isRemoveable}
          canSetOpacity={canSetOpacity}
          expandAll={expandAll}
          hideAll={hideAll}
          canSort={canSort}
          canZoomTo
          onOpenDetails={(_layerId: string, _layerConfigEntry: TypeLayerEntryConfig | undefined) => {
            // onOpenDetails(_layerId, _layerConfigEntry)
            if (onOpenDetails) {
              onOpenDetails(_layerId, _layerConfigEntry);
            }
          }}
        />
      );
    });

  return <List sx={{ width: '100%' }}>{legendItems}</List>;
}
