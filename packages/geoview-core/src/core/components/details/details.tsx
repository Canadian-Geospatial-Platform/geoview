import { LayersListFooter } from './layers-list-footer';
import { useDetailsStoreLayerDataArray } from '@/core/stores/store-interface-and-intial-values/details-state';

/**
 * The Details component is used to display the list of layers in footer that have selected features.
 * It allows to show the list of features found in the click tolerance of the getFeatureInfo when you click on the expand icon.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function Details(mapId: string): JSX.Element | null {
  const layerDataArray = useDetailsStoreLayerDataArray();

  return <LayersListFooter arrayOfLayerData={layerDataArray} mapId={mapId} />;
}
