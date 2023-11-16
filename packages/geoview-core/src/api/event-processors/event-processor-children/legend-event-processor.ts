import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsLegendsLayersetUpdated, TypeLegendResultSetsEntry } from '@/api/events/payloads';
import { isImageStaticLegend, isVectorLegend, isWmsLegend, layerEntryIsGroupLayer, TypeGeoviewLayerType, TypeLegend } from '@/geo';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { TypeLegendLayer, TypeLegendLayerIcon, TypeLegendLayerItem } from '@/core/components/layers/types';
import { api, getLocalizedValue } from '@/app';

export class LegendEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const { mapId } = store.getState();

    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED,
      (layerUpdatedPayload) => {
        if (payloadIsLegendsLayersetUpdated(layerUpdatedPayload)) {
          const { layerPath, resultSets } = layerUpdatedPayload;
          const storeResultSets = store.getState().legendResultSets;
          storeResultSets[layerPath] = resultSets[layerPath];
          store.setState({ legendResultSets: storeResultSets });
          LegendEventProcessor.propagateLegendToStore(mapId, layerPath, resultSets[layerPath]);
        }
      },
      `${mapId}/LegendsLayerSet`
    );
    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // **********************************************************
  // Static functions for Typescript files to set store values
  // **********************************************************
  private static getLayerIconImage(mapId: string, layerPath: string, layerLegend: TypeLegend | null): TypeLegendLayerIcon | undefined {
    let iconDetails: TypeLegendLayerIcon = {};
    if (layerLegend) {
      if (layerLegend.legend === null) {
        if (layerLegend.styleConfig === null) iconDetails.iconImg = 'config not found';
        else if (layerLegend.styleConfig === undefined) iconDetails.iconImg = 'undefined style';
      } else if (Object.keys(layerLegend.legend).length === 0) iconDetails.iconImg = 'no data';
      else if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        iconDetails.iconType = 'simple';
        if (layerLegend.legend) iconDetails.iconImg = layerLegend.legend?.toDataURL();
        // YC if (layerLegend.)
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
      }
      return iconDetails;
    }
    return undefined;
  }

  static propagateLegendToStore(mapId: string, layerPath: string, legendResultSetsEntry: TypeLegendResultSetsEntry) {
    const layerPathNodes = layerPath.split('/');
    const createNewLegendEntries = (layerPathBeginning: string, currentLevel: number, existingEntries: TypeLegendLayer[]) => {
      const entryLayerPath = `${layerPathBeginning}/${layerPathNodes[currentLevel]}`;
      const layerConfig = api.maps[mapId].layer.registeredLayers[entryLayerPath];
      let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);
      if (layerEntryIsGroupLayer(layerConfig)) {
        if (entryIndex === -1) {
          existingEntries.push({
            layerId: layerConfig.layerId,
            layerPath: entryLayerPath,
            layerName: legendResultSetsEntry.data?.layerName ? getLocalizedValue(legendResultSetsEntry.data.layerName, mapId)! : '',
            type: layerConfig.entryType as TypeGeoviewLayerType,
            isVisible: layerConfig.initialSettings?.visible ? layerConfig.initialSettings.visible : 'yes',
            opacity: layerConfig.initialSettings?.opacity ? layerConfig.initialSettings.opacity : 1,
            items: [] as TypeLegendLayerItem[],
            children: [] as TypeLegendLayer[],
          } as TypeLegendLayer);
          entryIndex = existingEntries.length - 1;
        } // else
        // We don't need to update it because basic information of a group node is not supposed to change after its creation.
        // Only the children may change and this is handled by the following call.
        createNewLegendEntries(entryLayerPath, currentLevel + 1, existingEntries[entryIndex].children);
      } else {
        const newLegendLayer = {
          layerId: layerPathNodes[currentLevel],
          layerPath: entryLayerPath,
          layerName: getLocalizedValue(legendResultSetsEntry.data?.layerName, mapId)!,
          layerStatus: legendResultSetsEntry.layerStatus,
          layerPhase: legendResultSetsEntry.layerPhase,
          querySent: legendResultSetsEntry.querySent,
          styleConfig: legendResultSetsEntry.data?.styleConfig,
          type: legendResultSetsEntry.data?.type,
          isVisible: layerConfig.initialSettings?.visible ? layerConfig.initialSettings.visible : 'yes',
          opacity: layerConfig.initialSettings?.opacity ? layerConfig.initialSettings.opacity : 1,
          children: [] as TypeLegendLayer[],
          icon: LegendEventProcessor.getLayerIconImage(mapId, layerPath, legendResultSetsEntry.data!),
        } as TypeLegendLayer;
        // YC newLegendLayer.items =
        if (entryIndex === -1) existingEntries.push(newLegendLayer);
        // eslint-disable-next-line no-param-reassign
        else existingEntries[entryIndex] = newLegendLayer;
        /*
            icon?: TypeLegendLayerIcon;
          */
      }
    };
    createNewLegendEntries(layerPathNodes[0], 1, getGeoViewStore(mapId).getState().layerState.legendLayers);
  }
}
