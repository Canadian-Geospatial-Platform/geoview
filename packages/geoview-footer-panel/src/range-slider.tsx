import type React from 'react';
import { TypeWindow } from 'geoview-core';

interface RangeSliderProps {
  mapId: string;
}

const w = window as TypeWindow;

/**
 * Create the range slider to display in the footer panel.
 *
 * @returns {JSX.Element} created range slider component
 */

export function RangeSlider({ mapId }: RangeSliderProps) {
  const { cgpv } = w;
  const { api, react } = cgpv;
  const { useState, useEffect } = react;

  const [slider, setSlider] = useState(null);

  /**
   * Create range slider from geo view layers.
   */
  const createRangeSlider = async () => {
    const data = await cgpv.api.maps[mapId].rangeSlider.createRangeSlider();
    setSlider(data);
  };

  /**
   * Get the range slider after map is loaded and timeout has passed.
   */
  const getRangeSlider = () => {
    setTimeout(() => {
      createRangeSlider();
    }, 1000);
  };

  useEffect(() => {
    api.event.on(api.eventNames.MAP.EVENT_MAP_LOADED, getRangeSlider, mapId);
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId, getRangeSlider);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>{slider}</div>;
}
