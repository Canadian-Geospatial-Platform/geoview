import { Box, Grid, List } from '@/ui';
import { getLegendLayerInstances } from '../helpers';
import { LegendItem } from './legend-item';


export interface LegendItemsProps {
  layerIds: string[];
  mapId: string
}

export function LegendItems(props: LegendItemsProps): JSX.Element {
  const { layerIds, mapId } = props;

  const legendItems = getLegendLayerInstances(mapId, layerIds)
        .map((layerInstance) => {
          const layerId = layerInstance.geoviewLayerId;
          return (
            <LegendItem
              key={`layerKey-${layerId}`}
              layerId={layerId}
              geoviewLayerInstance={layerInstance}
              isRemoveable={false}
              expandAll={false}
              hideAll={false}
            />
          );
      });

  return (
    <List sx={{ width: '100%' }}>{legendItems}</List>
  );
}
