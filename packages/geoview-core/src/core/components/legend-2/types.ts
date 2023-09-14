export interface TypeLegendProps {
  layerIds: string[];
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
}

export interface LegendItemsProps extends TypeLegendProps {
  mapId: string;
}

export interface LegendProps extends TypeLegendProps {
  mapId: string;
}

export interface LegendItemsDetailsProps extends TypeLegendProps {
  mapId: string;
  // subLayerId: string[];
}
