import React, { useEffect, useState } from 'react';
import { TypeArrayOfFeatureInfoEntries } from '../../../api/events/payloads/get-feature-info-payload';
import { LayersList } from './layers-list';

export interface TypeDetailsProps {
  key: string;
  arrayOfLayerData: TypeArrayOfLayerData;
}

export interface TypeLayerData {
  layerPath: string;
  layerName: string;
  features: TypeArrayOfFeatureInfoEntries;
}
export type TypeArrayOfLayerData = TypeLayerData[];

/**
 * The Details component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function Details(props: TypeDetailsProps): JSX.Element | null {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { key, arrayOfLayerData } = props;
  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);

  useEffect(() => {
    setDetails(arrayOfLayerData);
  }, [arrayOfLayerData]);

  return <LayersList arrayOfLayerData={details} />;
}
