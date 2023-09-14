import React from 'react';
import { api } from '@/app';
import { LegendItem } from './legend-item-details';
import { List } from '@/ui';
import { LegendItemsDetailsProps } from '../types';

export function LegendItemsDetails(props: LegendItemsDetailsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  const legendItems = layerIds
    // const subLayerItems = subLayerId
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
      {/* <List sx={{ width: '100%' }}>{subLayerItems}</List> */}
      <List sx={{ width: '100%' }}>{legendItems}</List>
      <p> Right Pane</p>
    </div>
  );
}
