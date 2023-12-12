export type SliderProps = {
  layerPaths: string[];
  title: string;
  description: string;
  locked: boolean;
  reversed: boolean;
  defaultValue: string;
};

export type ConfigProps = {
  sliders: SliderProps[];
};
