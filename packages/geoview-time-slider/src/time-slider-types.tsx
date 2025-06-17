import { TimeDimension } from 'geoview-core/core/utils/date-mgt';

export type SliderProps = {
  layerPaths: string[];
  title: string;
  description: string;
  locked: boolean;
  reversed: boolean;
  defaultValue: string;
  temporalDimension: TimeDimension;
};

export type ConfigProps = {
  sliders: SliderProps[];
};
