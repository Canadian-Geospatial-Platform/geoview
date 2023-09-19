import { api } from '@/app';
import { LegendItemDetails } from './legend-item-details';
import { List } from '@/ui';
import { LegendItemsProps } from '../types';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

interface LegendItemsDetailsProps {
  layerId: string;
  geoviewLayerInstance: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  isParentVisible?: boolean;
  toggleParentVisible?: () => void;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
  mapId: string;
}



export function LegendItemsDetails(props: LegendItemsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  const legendItems = layerIds
    .filter((layerId) => api.maps[mapId].layer.geoviewLayers[layerId])
    .map((layerId) => {
      const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];

      return (
        <LegendItemDetails
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
      <p>Right Pane</p>
    </div>
  );
}
