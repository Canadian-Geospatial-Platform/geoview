import { createElement, ReactElement } from 'react';
import { TimeSlider } from './time-slider';
import { api } from '@/app';

export interface SliderFilterProps {
  range: string[];
  defaultValue: string;
  minAndMax: number[];
  field: string;
  singleHandle: boolean;
  values: number[];
  filtering: boolean;
}

export class TimeSliderApi {
  mapId!: string;

  /**
   * initialize the time slider api
   *
   * @param mapId the id of the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  // Create list of layers that have a temporal dimension
  createLayersList(): string[] {
    return Object.keys(api.maps[this.mapId].layer.registeredLayers).filter(
      (layerPath) =>
        api.maps[this.mapId].layer.registeredLayers[layerPath].entryType !== 'group' &&
        api.maps[this.mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath]
    );
  }

  createTimeSliderData(layersList: string[]): { [index: string]: SliderFilterProps } {
    let timeSliderData: { [index: string]: SliderFilterProps } = {};
    layersList.forEach((layerPath) => {
      const temporalDimensionInfo = api.maps[this.mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath];
      const { range } = temporalDimensionInfo.range;
      const defaultValue = temporalDimensionInfo.default;
      const minAndMax: number[] = [new Date(range[0]).getTime(), new Date(range[range.length - 1]).getTime()];
      const { field, singleHandle } = temporalDimensionInfo;
      const values = singleHandle ? [new Date(temporalDimensionInfo.default).getTime()] : [...minAndMax];
      const filtering = true;
      const sliderData = { [layerPath]: { range, defaultValue, minAndMax, field, singleHandle, filtering, values } };
      timeSliderData = { ...timeSliderData, ...sliderData };
    });
    return timeSliderData;
  }

  /**
   * Create a slider panel
   *
   * @return {ReactElement} the time slider react element
   */
  createTimeSlider = (): ReactElement => {
    const layersList = this.createLayersList();
    const timeSliderData = this.createTimeSliderData(layersList);
    return createElement(TimeSlider, { mapId: this.mapId, layersList, timeSliderData }, []);
  };
}
