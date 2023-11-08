import React, { useEffect } from 'react';
import { LayersListFooter } from './layers-list-footer';
import { TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
import { useDetailsStoreActions, useDetailsStoreLayerDataArray } from '@/core/stores/store-interface-and-intial-values/details-state';

export interface TypeDetailsProps {
  arrayOfLayerData: TypeArrayOfLayerData;
  mapId: string;
}

/**
 * The Details component is used to display the list of layers in footer that have selected features. It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function DetailsFooter({ arrayOfLayerData, mapId }: TypeDetailsProps): JSX.Element | null {
  const layerDataArray = useDetailsStoreLayerDataArray();
  const { setLayerDataArray } = useDetailsStoreActions();

  useEffect(() => {
    setLayerDataArray(arrayOfLayerData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerData]);

  return <LayersListFooter arrayOfLayerData={layerDataArray} mapId={mapId} />;
}
