import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContext } from '../../app-start';
import { api, TypeDisplayLanguage } from '../../../app';
import { TypeJsonArray } from '../../types/global-types';
import { LayersList } from './layers-list';

export interface TypeLayerData {
  layerName: string;
  features: TypeJsonArray;
}

export interface TypeLayerSetData {
  layerSetName: string;
  layerData: Record<string, TypeLayerData>;
}
/**
 * The Details component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function Details(): JSX.Element | null {
  const { mapId } = useContext(MapContext);
  const mapInstance = api.map(mapId).map;
  // get event names
  const EVENT_NAMES = api.eventNames;
  // const { geoviewLayers } = api.map(mapId).layer;

  const { i18n } = useTranslation<string>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lnglat, setLnglat] = useState<number[]>([]);
  const [layersData, setLayersData] = useState<Record<string, TypeLayerSetData>>({});

  useEffect(() => {
    // get the map service layers from the API
    // let layerSetData: Record<string, TypeLayerSetData> = {};
    mapInstance.on('click', (e: { originalEvent: { shiftKey: unknown }; coordinate: number[] }) => {
      if (!e.originalEvent.shiftKey) {
        setLnglat(e.coordinate);
        setLayersData({});
        // layerSetData = {};
        api.event.off(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
        const mapLayers = api.map(mapId).layer.geoviewLayers;
        // console.log(api.map(mapId).layer);

        // loop through each map server layer loaded from the map config and created using the API
        const arrayOfgeoviewLayerId = Object.keys(mapLayers);

        arrayOfgeoviewLayerId.forEach(async (geoviewLayerId: string) => {
          const mapLayer = mapLayers[geoviewLayerId];
          // console.log(mapLayer);
          const featureInfoLayerSet = api.createFeatureInfoLayerSet(mapId, mapLayer.geoviewLayerId);
          const layerSetName = mapLayer.geoviewLayerName[i18n.language as TypeDisplayLanguage];
          if (featureInfoLayerSet) {
            // console.log(featureInfoEsriFeatureLayerSet);
            api.event.on(
              EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (payload: any) => {
                const { layerSetId, resultSets } = payload;
                const layerData: Record<string, TypeLayerData> = {};
                Object.keys(resultSets).forEach((layerId: string) => {
                  if (resultSets[layerId].length > 0) {
                    const subId = layerId.replace(`${layerSetId}/`, '');
                    const subLayer = mapLayer?.listOfLayerEntryConfig?.find((l) => {
                      // eslint-disable-next-line eqeqeq
                      return l.layerId == subId;
                    });
                    const layerName =
                      subLayer && subLayer.layerName ? subLayer.layerName[i18n.language as TypeDisplayLanguage] : 'UNDEFINED';
                    layerData[layerId] = { layerName: layerName === undefined ? 'UNDEFINED' : layerName, features: resultSets[layerId] };
                  }
                });

                // layerSetData[layerSetId] = { layerSetName: layerSetName === undefined ? 'UNDEFINED' : layerSetName, layerData };
                if (Object.keys(layerData).length > 0) {
                  setLayersData((prevState) => ({
                    ...prevState,
                    [layerSetId]: {
                      ...prevState[layerSetId],
                      layerSetName: layerSetName === undefined ? 'UNDEFINED' : layerSetName,
                      layerData,
                    },
                  }));
                }
              },
              mapId
            );
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* <span>{lnglat.length > 0 && JSON.stringify(lnglat)}</span> */}
      <LayersList layersData={layersData} />
    </div>
  );
}
