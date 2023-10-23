import React, { useEffect } from 'react';
import { useStore } from 'zustand';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
import { LayersListFooter } from './layers-list-footer';
import { getGeoViewStore } from '@/core/stores/stores-managers';

export interface TypeDetailsProps {
  arrayOfLayerData: TypeArrayOfLayerData;
  mapId: string;
}

export interface TypeLayerData {
  layerPath: string;
  layerName: string;
  features: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>;
}
export type TypeArrayOfLayerData = TypeLayerData[];

/**
 * The Details component is used to display the list of layers in footer that have selected features. It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function DetailsFooter({ arrayOfLayerData, mapId }: TypeDetailsProps): JSX.Element | null {
  const store = getGeoViewStore(mapId);
  const { storeArrayOfLayerData } = useStore(store, (state) => state.detailsState);

  useEffect(() => {
    store.setState({
      detailsState: { ...store.getState().detailsState, storeArrayOfLayerData: arrayOfLayerData },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerData]);

  return <LayersListFooter arrayOfLayerData={storeArrayOfLayerData} mapId={mapId} />;
}
