import { createElement, ReactElement } from 'react';
import { RangeSlider } from './range-slider';
import { addNotificationError, api, getLocalizedValue, TypeArrayOfFeatureInfoEntries, TypeFeatureInfoLayerConfig } from '@/app';

export interface SliderFilterProps {
  filterIndex: number;
  values: number[];
  filtering: boolean;
}

export class RangeSliderApi {
  mapId!: string;

  /**
   * initialize the range slider api
   *
   * @param mapId the id of the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a slider panel
   *
   * @return {ReactElement} the range slider react element
   */
  createRangeSlider = async (): Promise<ReactElement | null> => {
    // Create list of layers that have a date or number field
    const layersList: string[] = Object.keys(api.maps[this.mapId].layer.registeredLayers).filter(
      (layerPath) =>
        api.maps[this.mapId].layer.registeredLayers[layerPath].entryType !== 'group' &&
        ((api.maps[this.mapId].layer.registeredLayers[layerPath].source?.featureInfo as TypeFeatureInfoLayerConfig)?.fieldTypes
          ?.split(',')
          .includes('date') ||
          (api.maps[this.mapId].layer.registeredLayers[layerPath].source?.featureInfo as TypeFeatureInfoLayerConfig)?.fieldTypes
            ?.split(',')
            .includes('number'))
    );

    // Get feature info for compatible layers
    const requests = layersList.map((layer: string) => {
      const geoviewLayerInstance = api.maps[this.mapId].layer.geoviewLayers[layer.split('/')[0]];
      return geoviewLayerInstance.getFeatureInfo('all', layer);
    });

    let featureInfo: { [index: string]: TypeArrayOfFeatureInfoEntries } = {};
    const responses = await Promise.allSettled(requests);
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') featureInfo = { ...featureInfo, [layersList[index]]: response.value };
      else {
        // eslint-disable-next-line no-console
        console.log(`Error loading features on  layer ${layersList[index]}`);
        addNotificationError(this.mapId, `Error loading features on  layer ${layersList[index]}`);
      }
    });

    // Build data to pass to range slider
    let rangeSliderData = {};
    Object.keys(featureInfo).forEach((layerPath) => {
      // Get field names for date and number fields
      const layer = api.maps[this.mapId].layer.registeredLayers[layerPath];
      const { aliasFields, fieldTypes, outfields } = layer.source!.featureInfo as TypeFeatureInfoLayerConfig;
      const localizedOutFields = getLocalizedValue(outfields, this.mapId)?.split(',');
      const separatedFieldTypes = fieldTypes?.split(',');
      if (!separatedFieldTypes || !localizedOutFields) {
        // eslint-disable-next-line no-console
        console.log(`Error with feature metadata on layer ${layerPath}`);
        addNotificationError(this.mapId, `Error with feature metadata on layer ${layerPath}`);
        return;
      }
      let localizedAliasFields = getLocalizedValue(aliasFields, this.mapId)?.split(',');
      if (localizedAliasFields?.length !== localizedOutFields!.length) localizedAliasFields = localizedOutFields;

      // List of indices of date and number features, moving dates to the front
      const fieldIndices: number[] = [];
      separatedFieldTypes.forEach((fieldType, index) => {
        if (fieldType === 'date') fieldIndices.unshift(index);
        else if (fieldType === 'number') fieldIndices.push(index);
      });

      const usedOutFields = fieldIndices.map((index) => localizedOutFields![index]);
      const usedAliasFields = fieldIndices.map((index) => localizedAliasFields![index]);

      if (fieldIndices?.length !== usedOutFields.length) {
        // eslint-disable-next-line no-console
        console.log(`Error with feature metadata on layer ${layerPath}`);
        addNotificationError(this.mapId, `Error with feature metadata on layer ${layerPath}`);
        return;
      }

      const usedFieldTypes = fieldIndices.map((index) => separatedFieldTypes[index]);

      /**
       * Get the minimum and maximum values from a feature set to set slider ranges
       * @param {TypeArrayOfFeatureInfoEntries} features The features to check
       * @param {number} index The index of the desired feature
       * @returns number[]
       */
      function getMinAndMaxValues(features: TypeArrayOfFeatureInfoEntries, index: number): number[] {
        const values = features!.map((feature) => feature.fieldInfo[localizedOutFields![index]]!.value);
        if (typeof values[0] === 'number') return [Math.min(...(values as number[])), Math.max(...(values as number[]))];

        const dates: number[] = values.map((value) => new Date(value as string).getTime() as number);
        return [Math.min(...dates), Math.max(...dates)];
      }

      const minsAndMaxes: number[][] = [];
      fieldIndices.forEach((index) => {
        const minMax = getMinAndMaxValues(featureInfo[layerPath], index);
        minsAndMaxes.push(minMax);
      });

      // First date field is set as initial slider
      const values = minsAndMaxes[0];
      const activeSliders = [{ filterIndex: 0, values, filtering: true }];

      const layerData = {
        [layerPath]: {
          fieldIndices,
          usedFieldTypes,
          usedAliasFields,
          usedOutFields,
          minsAndMaxes,
          activeSliders,
        },
      };
      rangeSliderData = { ...rangeSliderData, ...layerData };
    });

    return createElement(RangeSlider, { mapId: this.mapId, rangeSliderData }, []);
  };
}
