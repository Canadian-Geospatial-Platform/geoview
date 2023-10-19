import {
  TypeLegend,
  isVectorLegend,
  isWmsLegend,
  isImageStaticLegend,
  TypeWmsLegendStyle,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewLayer, TypeLayerEntryConfig, api } from '@/app';
import { TypeDisplayLanguage, TypeListOfLayerEntryConfig, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { useTranslation } from 'react-i18next';

type LayerIconDetails = {
  iconType? : string,
  iconImg?: string,
  iconImgStacked?: string,
  iconList?: string[]
}

export const getLegendLayerInstances = function(mapId: string, layerIds: string[]) {
  return layerIds
    .filter((layerId) => api.maps[mapId].layer.geoviewLayers[layerId])
    .map((layerId) => api.maps[mapId].layer.geoviewLayers[layerId]);
}

export const useLegendHelpers =  function() {
  const { t, i18n } = useTranslation<string>();

  function getLayerName(geoviewLayerInstance: AbstractGeoViewLayer, layerConfigEntry?: TypeLayerEntryConfig) {
    if (layerConfigEntry) {
      if (layerConfigEntry.layerName && layerConfigEntry.layerName[i18n.language as TypeDisplayLanguage]) {
        return layerConfigEntry.layerName[i18n.language as TypeDisplayLanguage] ?? '';
      } else {
        return t('legend.unknown')!;
      }
    } else if (geoviewLayerInstance?.geoviewLayerName[i18n.language as TypeDisplayLanguage]) {
      return geoviewLayerInstance.geoviewLayerName[i18n.language as TypeDisplayLanguage] ?? '';
    } else {
      return (t('legend.unknown')!);
    }
  }

  function getLayerIconImage(mapId: string, path: string) {

    const layerLegend = api.maps[mapId].legend.legendLayerSet.resultSets?.[path]?.data;
    let iconDetails: LayerIconDetails = {};
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


  const isGroup = (geoviewLayerInstance: AbstractGeoViewLayer, layerConfigEntry?: TypeLayerEntryConfig): boolean => {
    let isGroup = false;
    if (layerConfigEntry) {
      if (layerEntryIsGroupLayer(layerConfigEntry)) {
        isGroup = true;
      }
    } else if (
      geoviewLayerInstance?.listOfLayerEntryConfig &&
      (geoviewLayerInstance?.listOfLayerEntryConfig.length > 1 || layerEntryIsGroupLayer(geoviewLayerInstance?.listOfLayerEntryConfig[0]))
    ) {
      isGroup = true;
    }
    return isGroup;
  };

  const getGroupsDetails = (geoviewLayerInstance: AbstractGeoViewLayer, layerConfigEntry?: TypeLayerEntryConfig)  => {
    let groups: TypeListOfLayerEntryConfig = [];
    if (layerConfigEntry) {
      if (layerEntryIsGroupLayer(layerConfigEntry)) {
        groups = layerConfigEntry.listOfLayerEntryConfig;
      }
    } else if (
      geoviewLayerInstance?.listOfLayerEntryConfig &&
      (geoviewLayerInstance?.listOfLayerEntryConfig.length > 1 || layerEntryIsGroupLayer(geoviewLayerInstance?.listOfLayerEntryConfig[0]))
    ) {
      groups = geoviewLayerInstance?.listOfLayerEntryConfig;
    }
    return groups;
  };

  const getWMSStyles= function(mapId: string, path: string): TypeWmsLegendStyle[] {
    const layerLegend = api.maps[mapId].legend.legendLayerSet.resultSets?.[path]?.data;
    if(layerLegend) {
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        if (isWmsLegend(layerLegend) && layerLegend.styles) {
          return layerLegend.styles;
          //setCurrentWMSStyle(layerLegend.styles[0].name);
        }
      }
    }
    return [];
  }

  return {
    isGroup,
    getWMSStyles,
    getGroupsDetails,
    getLayerName,
    getLegendLayerInstances,
    getLayerIconImage
  }
}

