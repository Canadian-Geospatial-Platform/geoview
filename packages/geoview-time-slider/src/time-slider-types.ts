import type { TimeDimension } from 'geoview-core/core/utils/date-mgt';

/** Properties for slider configuration. */
export type SliderProps = {
  layerPaths: string[];
  fields?: string[];
  title: string;
  description: string;
  locked: boolean;
  reversed: boolean;
  timeDimension: TimeDimension;
};

/** Configuration properties for the time slider plugin. */
export type ConfigProps = {
  sliders: SliderProps[];
};
