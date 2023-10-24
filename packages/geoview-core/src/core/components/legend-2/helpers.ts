import {
  TypeLegend,
  isVectorLegend,
  isWmsLegend,
  isImageStaticLegend,
  TypeWmsLegendStyle,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewLayer, TypeLayerEntryConfig, api } from '@/app';
import { TypeDisplayLanguage, TypeListOfLayerEntryConfig, TypeLocalizedString, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { useTranslation } from 'react-i18next';
import { TypeLegendLayer, TypeLegendLayerIcon } from './types';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import _ from 'lodash';


export const useLegendHelpers =  function(mapId: string) {
  const { t, i18n } = useTranslation<string>();
  const store = getGeoViewStore(mapId);

  function populateLegendStoreWithFakeData() {

    const legendInfo = api.maps[mapId].legend.legendLayerSet.resultSets;
    console.log('I got here ', legendInfo, _.keys(legendInfo));
    const keys = _.keys(legendInfo);
    let legendLayers: TypeLegendLayer[] = [{
      layerPath: 'geojsonLYR5',
      layerName: { en: "Layer with groups", fr: "Layer with groups" },
      type: "GeoJSON",
      layerStatus: 'loaded',
      layerPhase: 'processed',
      querySent: true,
      children: [],
      items: []
    }];


    keys.forEach((i) => {
      const setData = legendInfo[i];
      const item: TypeLegendLayer = {
        layerPath: setData.data?.layerPath ?? '',
        layerName: setData.data?.layerName as  TypeLocalizedString,
        type: setData.data?.type ?? 'imageStatic',
        layerStatus: setData.layerStatus,
        layerPhase: setData.layerPhase,
        querySent: setData.querySent,
        children: [],
        items: []
      };

      if(i.startsWith('geojsonLYR5')) {
        legendLayers[0].children.push(item);
      } else {
        legendLayers.push(item);
      }

    });

    //adding to store
    store.setState({
      legendState: { ...store.getState().legendState, legendLayers },
    });
  }

  function getLayerIconImage(mapId: string, path: string) {
    const layerLegend = api.maps[mapId].legend.legendLayerSet.resultSets?.[path]?.data;
    let iconDetails: TypeLegendLayerIcon = {};
    if (layerLegend) {
      if (layerLegend.legend === null) iconDetails.iconImg = 'no data';
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        iconDetails.iconType = 'simple';
        if (layerLegend.legend) { 
          iconDetails.iconImg = layerLegend.legend?.toDataURL();
        }
      } else if (isVectorLegend(layerLegend) && layerLegend.legend) {
        Object.entries(layerLegend.legend).forEach(([, styleRepresentation]) => {
          if (styleRepresentation.arrayOfCanvas) {
            iconDetails.iconType = 'list';
            const iconImageList = (styleRepresentation.arrayOfCanvas as HTMLCanvasElement[]).map((canvas) => {
              return canvas.toDataURL();
            });
            if (iconImageList.length > 0) iconDetails.iconImg = iconImageList[0];
            if (iconImageList.length > 1) iconDetails.iconImgStacked = iconImageList[1];
            if (styleRepresentation.defaultCanvas) iconImageList.push(styleRepresentation.defaultCanvas.toDataURL());
            if (styleRepresentation.clusterCanvas) iconImageList.push(styleRepresentation.clusterCanvas.toDataURL());
            iconDetails.iconList = iconImageList;
          } else {
            iconDetails.iconType = 'simple';
            iconDetails.iconImg = (styleRepresentation.defaultCanvas as HTMLCanvasElement).toDataURL();
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`${path} - UNHANDLED LEGEND TYPE`);
      }
      return iconDetails;
    }
  }


  return {
    populateLegendStoreWithFakeData,
    getLayerIconImage
  }
}
