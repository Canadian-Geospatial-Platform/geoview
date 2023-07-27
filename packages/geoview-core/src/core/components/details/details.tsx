import React, { useEffect, useState } from 'react';
import { Coordinate } from 'ol/coordinate';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
import { LayersList } from './layers-list';

export interface DetailsProps {
  mapId: string;
  location: Coordinate;
  backgroundStyle?: string;
  singleColumn?: boolean;
  handlerName: string | null;
}
export interface TypeDetailsProps {
  arrayOfLayerData: TypeArrayOfLayerData;
  detailsSettings: DetailsProps;
}

export interface TypeLayerData {
  layerPath: string;
  layerName: string;
  features: TypeArrayOfFeatureInfoEntries;
}
export type TypeArrayOfLayerData = TypeLayerData[];

/**
 * The Details component is used to display the list of layers that have selected features. It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function Details(props: TypeDetailsProps): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { arrayOfLayerData, detailsSettings } = props;
  const { location, handlerName } = detailsSettings;
  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);

  useEffect(() => {
    setDetails(arrayOfLayerData);
  }, [arrayOfLayerData, location, handlerName]);

  return <LayersList arrayOfLayerData={details} detailsSettings={detailsSettings} />;
}
