/** Definition of options for swiper orientation. */
export type SwipeOrientation = 'horizontal' | 'vertical';

/** Definition of options for the visible side of the swiper bar for a layer. */
export type SwipeSide = 'left' | 'right' | 'up' | 'down';

/** A single layer entry participating in the swiper, with its visible side. */
export type SwiperLayerEntry = {
  /** The layer path participating in the swiper. */
  layerPath: string;

  /** The visible side of the swiper bar for this layer. */
  side: SwipeSide;
};
