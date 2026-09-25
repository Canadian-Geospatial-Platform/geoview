/** Definition of options for swiper orientation. */
export type SwipeOrientation = 'horizontal' | 'vertical';

/** Definition of options for the visible side of the swiper bar for a layer. */
export type SwipeSide = 'left' | 'right' | 'up' | 'down';

/** A single layer entry participating in the swiper, with its visible side. */
export type { TypeSwiperLayerEntry as SwiperLayerEntry } from 'geoview-core/core/stores/states/swiper-state';
