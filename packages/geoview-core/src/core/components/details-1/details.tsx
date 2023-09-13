import React, { useEffect, useState } from 'react';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
import { LayersListFooter } from './layers-list-footer';

export interface TypeDetailsProps {
  arrayOfLayerData: TypeArrayOfLayerData;
  mapId: string;
}

export interface TypeLayerData {
  layerPath: string;
  layerName: string;
  features: TypeArrayOfFeatureInfoEntries;
}
export type TypeArrayOfLayerData = TypeLayerData[];

/**
 * The Details component is used to display the list of layers in footer that have selected features. It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function DetailsFooter({ arrayOfLayerData, mapId }: TypeDetailsProps): JSX.Element | null {
  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);

  useEffect(() => {
    setDetails(arrayOfLayerData);
  }, [arrayOfLayerData]);

  return <LayersListFooter arrayOfLayerData={details} mapId={mapId} />;
}
