import type React from 'react';
import { TypeWindow } from 'geoview-core';

interface TimeSliderProps {
  mapId: string;
}

const w = window as TypeWindow;

/**
 * Create the range slider to display in the footer panel.
 *
 * @returns {JSX.Element} created range slider component
 */

export function TimeSlider({ mapId }: TimeSliderProps) {
  const { cgpv } = w;
  const { api, react } = cgpv;
  const { useState, useEffect } = react;

  const [slider, setSlider] = useState(null);

  /**
   * Create time slider from geo view layers.
   */
  const createTimeSlider = async () => {
    const data = await cgpv.api.maps[mapId].timeSlider.createTimeSlider();
    setSlider(data);
  };

  /**
   * Get the time slider after map is loaded and timeout has passed.
   */
  const getTimeSlider = () => {
    setTimeout(() => {
      createTimeSlider();
    }, 1000);
  };

  useEffect(() => {
    api.event.on(api.eventNames.MAP.EVENT_MAP_LOADED, getTimeSlider, mapId);
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId, getTimeSlider);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>{slider}</div>;
}
