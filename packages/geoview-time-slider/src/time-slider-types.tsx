import { TypeLocalizedString } from 'geoview-core/src/geo/map/map-schema-types';

export type TemporalDimensionProps = {
  field: string;
  default: string;
  unitSymbol: string;
  range: string[];
  nearestValues: string;
  singleHandle: boolean;
};

export type SliderProps = {
  layerPaths: string[];
  title: TypeLocalizedString;
  description: TypeLocalizedString;
  locked: boolean;
  reversed: boolean;
  defaultValue: string;
  temporalDimension: TemporalDimensionProps | null;
};

export type ConfigProps = {
  sliders: SliderProps[];
};
