import _ from 'lodash';
import { isVectorLegend, isWmsLegend, isImageStaticLegend, TypeLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { api } from '@/app';
import { TypeLocalizedString } from '@/geo/map/map-schema-types';
import { TypeLegendLayer, TypeLegendLayerIcon, TypeLegendLayerItem } from './types';
import { getGeoViewStore } from '@/core/stores/stores-managers';

export function useLegendHelpers(mapId: string) {
  const store = getGeoViewStore(mapId);

  function populateLegendStoreWithFakeData() {
    const legendInfo = api.maps[mapId].legend.legendLayerSet.resultSets;
    // console.log('I got here ', legendInfo, _.keys(legendInfo));
    const keys = _.keys(legendInfo);
    const legendLayers: TypeLegendLayer[] = [
      {
        layerPath: 'geojsonLYR5',
        layerName: { en: 'Layer with groups', fr: 'Layer with groups' },
        type: 'GeoJSON',
        layerStatus: 'loaded',
        layerPhase: 'processed',
        querySent: true,
        children: [],
        items: [],
      },
    ];

    keys.forEach((i) => {
      const setData = legendInfo[i];
      const items: TypeLegendLayerItem[] = [];
      const legendData = setData.data?.legend ? (setData.data.legend as TypeLayerStyles) : undefined;
      const itemCanvases = legendData ? legendData.Point?.arrayOfCanvas : undefined;
      if (itemCanvases) {
        itemCanvases.forEach((r, ind) => {
          if (r) {
            items.push({ name: `Item name ${ind}`, isChecked: true, icon: r.toDataURL() });
          }
        });
      }

      const item: TypeLegendLayer = {
        layerPath: setData.data?.layerPath ?? '',
        layerName: setData.data?.layerName as TypeLocalizedString,
        type: setData.data?.type ?? 'imageStatic',
        layerStatus: setData.layerStatus,
        layerPhase: setData.layerPhase,
        querySent: setData.querySent,
        children: [],
        items,
      };

      if (i.startsWith('geojsonLYR5')) {
        legendLayers[0].children.push(item);
      } else {
        legendLayers.push(item);
      }
    });

    // adding to store
    store.setState({
      legendState: { ...store.getState().legendState, legendLayers },
    });
  }

  function getLayerIconImage(path: string): TypeLegendLayerIcon | undefined {
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
            if (iconImageList.length > 0) iconDetails = { ...iconDetails, iconImg: iconImageList[0] };
            if (iconImageList.length > 1) iconDetails = { ...iconDetails, iconImgStacked: iconImageList[1] };
            if (styleRepresentation.defaultCanvas) {
              iconImageList.push(styleRepresentation.defaultCanvas.toDataURL());
            }
            if (styleRepresentation.clusterCanvas) {
              iconImageList.push(styleRepresentation.clusterCanvas.toDataURL());
            }
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
    return undefined;
  }

  return {
    populateLegendStoreWithFakeData,
    getLayerIconImage,
  };
}
