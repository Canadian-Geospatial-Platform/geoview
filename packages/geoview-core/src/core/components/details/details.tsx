import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContext } from '../../app-start';
import { AbstractGeoViewLayer, api, TypeDisplayLanguage } from '../../../app';
import { LayersList } from './layers-list';

/**
 * The Details component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Details component
 */
export function Details(): JSX.Element | null {
  const { mapId } = useContext(MapContext);
  // const mapInstance = api.map(mapId).map;
  // get event names
  const EVENT_NAMES = api.eventNames;
  // const { geoviewLayers } = api.map(mapId).layer;

  const { t, i18n } = useTranslation<string>();

  const [layersData, setLayersData] = useState<Record<string, AbstractGeoViewLayer>>({});
  
  useEffect(() => {
    // get the map service layers from the API
    const mapLayers = api.map(mapId).layer.geoviewLayers;
    // console.log(api.map(mapId).layer);

    // loop through each map server layer loaded from the map config and created using the API
    const arrayOfgeoviewLayerId = Object.keys(mapLayers);

    arrayOfgeoviewLayerId.forEach(async (geoviewLayerId: string) => {
      const mapLayer = mapLayers[geoviewLayerId];
      console.log(mapLayer);
      const featureInfoLayerSet = api.createFeatureInfoLayerSet(mapId, mapLayer.geoviewLayerId);
      const layerSetName = mapLayer.geoviewLayerName[i18n.language as TypeDisplayLanguage];
      if (featureInfoLayerSet) {
        // console.log(featureInfoEsriFeatureLayerSet);
        api.event.on(
          EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
          (payload) => {
            const { layerSetId, resultSets } = payload;
            const layerData = {};
            Object.keys(resultSets).forEach((layerId) => {
              const layerName = mapLayer.listOfLayerEntryConfig.find( ( l ) => { return l.layerId == layerId.replace(`${layerSetId}\/`,'') })?.layerName[i18n.language as TypeDisplayLanguage];
              layerData[layerId] = { layerName, features: resultSets[layerId] };
            });
            setLayersData({[layerSetId]: { layerSetName, layerData }});
          },
          mapId
        );
      }
    });
  }, []);

  return (
    <div style={{ height: 400, width: '100%' }}>
      <div>{t('click_map')}</div>
      <LayersList layersData={layersData} />
    </div>
  );
}
