import React, { useEffect, useRef } from 'react';

import { Coordinate } from 'ol/coordinate'; // For typing only

import { getGeoViewStore } from '@/core/stores/stores-managers';

import {
  TypeFeatureInfoEntry,
  TypeJsonObject,
  useDetailsStoreLayerDataArray,
  useDetailsStoreSelectedLayerPath,
  useGeoViewMapId,
} from '@/app';
import { Box, ClickMapMarker } from '@/ui';

import { useMapClickMarker, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

export type TypeClickMarker = {
  lnglat: Coordinate;
  symbology?: TypeJsonObject;
};

/**
 * Create a react element to display a marker ( at the click location) when a user clicks on
 * the map
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
export function ClickMarker(): JSX.Element {
  const mapId = useGeoViewMapId();

  // internal state
  const markerCoordinates = useRef<Coordinate>();
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${mapId}-clickmarker`;

  // get values from the store
  const clickMarker = useMapClickMarker();
  const { hideClickMarker, setOverlayClickMarkerRef, showClickMarker, addSelectedFeature, removeSelectedFeature } = useMapStoreActions();
  const layerDataArray = useDetailsStoreLayerDataArray();
  const selectedLayerPath = useDetailsStoreSelectedLayerPath();
  setTimeout(() => setOverlayClickMarkerRef(clickMarkerRef.current as HTMLElement), 0);

  // When layerDataArray is updated, check for feature to add to selectedFeatures (highlight)
  useEffect(() => {
    removeSelectedFeature('all');
    let feature: TypeFeatureInfoEntry | undefined;
    const selectedLayerDataEntry = layerDataArray.filter((layerData) => layerData.layerPath === selectedLayerPath)[0];
    if (
      selectedLayerDataEntry != null &&
      selectedLayerDataEntry.features?.length &&
      selectedLayerDataEntry.features[0].geoviewLayerType !== 'ogcWms'
    )
      [feature] = selectedLayerDataEntry.features;
    else {
      layerDataArray.every((layer) => {
        const { features } = layer;
        if (features && features.length > 0 && features[0].geoviewLayerType !== 'ogcWms') {
          [feature] = features;
          return false;
        }
        return true;
      });
    }

    if (feature) {
      hideClickMarker();
      addSelectedFeature(feature);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerDataArray]);

  useEffect(() => {
    // if mapClickCoordinates changed, single click event has been triggered
    const unsubMapSingleClick = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.clickCoordinates,
      (curClick, prevClick) => {
        if (curClick !== prevClick) {
          removeSelectedFeature('all');
          markerCoordinates.current = curClick!.lnglat;
          showClickMarker({ lnglat: curClick!.lnglat });
        }
      }
    );

    return () => {
      unsubMapSingleClick();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      ref={clickMarkerRef}
      id={clickMarkerId}
      sx={{ position: 'absolute', visibility: clickMarker !== undefined ? 'visible' : 'hidden' }}
    >
      <ClickMapMarker
        sx={{
          animation: 'opacity 1s ease-in',
          '@keyframes opacity': {
            from: {
              opacity: 0,
            },
            to: {
              opacity: 1,
            },
          },
        }}
        fontSize="large"
        color="warning"
      />
    </Box>
  );
}
