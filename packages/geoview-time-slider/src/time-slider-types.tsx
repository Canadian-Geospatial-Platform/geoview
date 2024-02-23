import { TimeDimension } from 'geoview-core';
import { TypeLocalizedString } from 'geoview-core/src/geo/map/map-schema-types';

export type SliderProps = {
  layerPaths: string[];
  title: TypeLocalizedString;
  description: TypeLocalizedString;
  locked: boolean;
  reversed: boolean;
  defaultValue: string;
  temporalDimension: TimeDimension;
};

export type ConfigProps = {
  sliders: SliderProps[];
};
