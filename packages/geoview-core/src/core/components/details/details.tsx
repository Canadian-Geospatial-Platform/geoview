import React, { useEffect, useState } from 'react';
import { TypeArrayOfFeatureInfoEntries } from '../../../api/events/payloads/get-feature-info-payload';
import { mapSingleClickPayload, TypeMapSingleClick } from '../../../api/events/payloads/map-slingle-click-payload';
import { LayersList } from './layers-list';
import { api } from '../../../app';

export interface TypeofClickPayload {
  handlerName: string | null;
  coordinates: TypeMapSingleClick;
}

export interface DetailsProps {
  mapId: string;
  location: unknown;
  backgroundStyle?: string;
  singleColumn?: boolean;
  clickPayload?: TypeofClickPayload;
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
  const { clickPayload } = detailsSettings;
  const [clicked, setClicked] = useState<boolean>(true);
  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);

  useEffect(() => {
    setDetails(arrayOfLayerData);
    // show marker

    console.log(clickPayload, clicked);
    if (clickPayload !== undefined) {
      setTimeout(() => {
        const { handlerName, coordinates } = clickPayload;
        api.event.emit(mapSingleClickPayload(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, handlerName, coordinates));
        // setClicked(false);
      }, 2000);
    }
  }, [arrayOfLayerData, clickPayload, clicked]);

  return <LayersList arrayOfLayerData={details} detailsSettings={detailsSettings} />;
}
