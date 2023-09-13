import { api } from '@/app';
import { TypeLegendProps } from './types';
import { LegendItem } from './legend-item';
import { List } from '@/ui';

export interface LegendProps extends TypeLegendProps {
  mapId: string;
}

export function Legend(props: LegendProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });
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
    </div>
  );
}
