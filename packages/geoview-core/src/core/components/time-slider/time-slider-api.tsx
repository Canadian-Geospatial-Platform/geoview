import { createElement, ReactElement } from 'react';
import { TimeSlider } from './time-slider';

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

  /**
   * Create a slider panel
   *
   * @return {ReactElement} the time slider react element
   */
  createTimeSlider = (): ReactElement => {
    return createElement(TimeSlider, { mapId: this.mapId }, []);
  };
}
