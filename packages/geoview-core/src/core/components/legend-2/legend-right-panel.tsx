import { getGeoViewStore } from '@/core/stores/stores-managers';
import { useStore } from 'zustand';
import { LegendOverview } from './legend-overview/legend-overview';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { Paper } from '@/ui';

export interface LegendRightPanelProps {
  layerIds: string[];
  mapId: string
}

export function LegendRightPanel(props: LegendRightPanelProps): JSX.Element {
  const { mapId, layerIds } = props;
  const store = getGeoViewStore(mapId);
  const currentRightPanelDisplay= useStore(store, (state) => state.legendState.currentRightPanelDisplay);
  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);

  if (currentRightPanelDisplay === 'overview') {
    return (<LegendOverview mapId={mapId} layerIds={layerIds} />);
  } else if(currentRightPanelDisplay === 'layer-details' && selectedLegendItem) {
    return ( 
    <Paper>
      <LegendItemDetails
        key={`layerKey-${selectedLegendItem.layerId}`}
        layerId={selectedLegendItem.layerId}
        geoviewLayerInstance={selectedLegendItem?.geoviewLayerInstance}
        isRemoveable={selectedLegendItem.isRemoveable}
        canSetOpacity={selectedLegendItem.canSetOpacity}
        expandAll={selectedLegendItem.expandAll}
        hideAll={selectedLegendItem?.hideAll}
      />
    </Paper>);
  } else {
    return (<></>)
  }
}
