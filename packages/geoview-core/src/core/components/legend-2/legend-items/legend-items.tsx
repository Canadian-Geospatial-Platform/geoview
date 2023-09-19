import { api } from '@/app';
import { LegendItem } from './legend-item';
import { List } from '@/ui';
import { LegendItemsProps } from '../types';

export function LegendItems(props: LegendItemsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  const legendItems = layerIds
    .filter((layerId) => api.maps[mapId].layer.geoviewLayers[layerId])
    .map((layerId) => {
      const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];

      return (
        <LegendItem
          key={`layerKey-${layerId}`}
          layerId={layerId}
          geoviewLayerInstance={geoviewLayerInstance}
          isRemoveable={isRemoveable}
          canSetOpacity={canSetOpacity}
          expandAll={expandAll}
          hideAll={hideAll}
          canZoomTo
        />
      );
    });

  return (
    <div>
      <List sx={{ width: '100%' }}>{legendItems}</List>
      <p>Left Pane</p>
    </div>
  );
}
